import { Controller, Post, UploadedFile, UseInterceptors, Body, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { FileParserService } from './file-parser.service';
import { GraphExtractorService } from './graph-extractor.service';
import { KnowledgeServiceService } from '../knowledge-service.service';
import { KnowledgeDocumentInput } from '../knowledge.types';

@ApiTags('knowledge')
@Controller('knowledge/upload')
export class FileIngestionController {
  constructor(
    private readonly fileParserService: FileParserService,
    private readonly graphExtractorService: GraphExtractorService,
    private readonly knowledgeService: KnowledgeServiceService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Upload file (PDF, Word) de khoi tao Knowledge Graph' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        topic: { type: 'string', default: 'General' },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('topic') topic: string = 'General'
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // 1. Parsing Document
    const content = await this.fileParserService.extractText(
      file.buffer,
      file.mimetype,
      file.originalname
    );

    // 2. Extract Relationships via GraphExtractorService (LLaMA)
    const extractedRelationships = await this.graphExtractorService.extractRelationships(content);

    // 3. Build Document Payload
    const document: KnowledgeDocumentInput = {
      id: file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '-'),
      title: file.originalname,
      source: 'Uploaded File',
      content: content,
      topic: topic,
      tags: [topic.toLowerCase(), 'upload', file.originalname.split('.').pop() || ''],
      relationships: extractedRelationships.length > 0 ? extractedRelationships : [
        { source: file.originalname, relation: 'RELATED_TO', target: topic }
      ]
    };

    // 3. Digest and Ingest into Vector Database + Knowledge Graph
    const result = await this.knowledgeService.ingestDocuments([document]);
    
    return {
      message: 'File successfully parsed and ingested to GraphRAG',
      extractedLength: content.length,
      ...result
    };
  }
}
