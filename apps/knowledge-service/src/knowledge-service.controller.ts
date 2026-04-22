import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { KnowledgeServiceService } from './knowledge-service.service';
import {
  KnowledgeDocumentInput,
  RetrieveKnowledgeInput,
} from './knowledge.types';
import {
  DbHealthResponseDto,
  IngestKnowledgeRequestDto,
  IngestKnowledgeResultDto,
  RetrievalResultDto,
  RetrieveKnowledgeRequestDto,
} from './knowledge.swagger';

import { Neo4jService } from './database/neo4j.service';
import { curriculumCypherSeed, curriculumEdgesSeed } from './knowledge-base/curriculum.seed';

@ApiTags('knowledge')
@Controller()
export class KnowledgeServiceController {
  constructor(
    private readonly knowledgeServiceService: KnowledgeServiceService,
    private readonly neo4jService: Neo4jService,
  ) {}

  // Kiểm tra kết nối db !!!
  @ApiOperation({ summary: 'Kiem tra ket noi Neo4j va ChromaDB' })
  @ApiOkResponse({ type: DbHealthResponseDto })
  @ApiServiceUnavailableResponse({ type: DbHealthResponseDto })
  @Get('health/db')
  async checkDatabaseConnections() {
    const result = await this.knowledgeServiceService.checkDatabaseConnections();

    if (result.status === 'error') {
      throw new ServiceUnavailableException(result);
    }

    return result;
  }

  @ApiOperation({ summary: 'Ingest tai lieu vao knowledge base' })
  @ApiBody({ type: IngestKnowledgeRequestDto })
  @ApiCreatedResponse({ type: IngestKnowledgeResultDto })
  @ApiBadRequestResponse({ description: 'Body.documents phai co du lieu' })
  @Post('knowledge/documents')
  ingestDocuments(
    @Body() body: { documents?: KnowledgeDocumentInput[] } | undefined,
  ) {
    if (!body?.documents || body.documents.length === 0) {
      throw new BadRequestException('Body.documents must contain documents');
    }

    return this.knowledgeServiceService.ingestDocuments(body.documents);
  }

  @ApiOperation({ summary: 'Retrieve chunk va source phu hop cho cau hoi' })
  @ApiBody({ type: RetrieveKnowledgeRequestDto })
  @ApiOkResponse({ type: RetrievalResultDto })
  @ApiBadRequestResponse({ description: 'Query khong duoc de trong' })
  @Post('knowledge/retrieve')
  retrieveKnowledge(@Body() body: RetrieveKnowledgeInput | undefined) {
    if (!body?.query?.trim()) {
      throw new BadRequestException('Query is required');
    }

    return this.knowledgeServiceService.retrieveKnowledge(body);
  }

  @ApiOperation({ summary: 'Xoá sach toan bo du lieu Neo4j va ChromaDB' })
  @Post('knowledge/reset')
  async resetAll() {
    // 1. Delete all Nodes and Relationships in Neo4j
    await this.neo4jService.executeQuery('MATCH (n) DETACH DELETE n');
    
    // 2. Drop the entire ChromaDB collection
    await this.knowledgeServiceService.clearAllData();

    return {
      message: 'Da xoa sach toan bo data tren ca GraphDB (Neo4j) lan VectorDB (ChromaDB).'
    };
  }

  @ApiOperation({ summary: 'Xem truoc cac du lieu dang co trong Vector Database (ChromaDB)' })
  @Get('knowledge/peek')
  async peekKnowledge() {
    return this.knowledgeServiceService.peekKnowledge();
  }
}
