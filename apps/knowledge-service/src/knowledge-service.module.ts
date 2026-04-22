import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import * as Joi from 'joi';

import { KnowledgeServiceController } from './knowledge-service.controller';
import { KnowledgeServiceService } from './knowledge-service.service';
import { Neo4jService } from './database/neo4j.service'; 
import { VectorService } from './database/vector.service';
import { TextChunkerService } from './knowledge-base/text-chunker.service';
import { EmbeddingService } from './database/embedding.service';
import { FileIngestionController } from './ingestion/file-ingestion.controller';
import { FileParserService } from './ingestion/file-parser.service';
import { GraphExtractorService } from './ingestion/graph-extractor.service';

@Module({
  imports: [
    //Quản lý biến môi trường
    ConfigModule.forRoot({
      isGlobal: true, 
      envFilePath: [
        join(process.cwd(), 'apps/knowledge-service/.env'),
        join(process.cwd(), '.env'),
      ],
      // Validation để đảm bảo Windows không bị thiếu biến khi chạy
      validationSchema: Joi.object({
        NEO4J_HOST: Joi.string().required(),
        NEO4J_PORT: Joi.number().port().default(7687),
        NEO4J_USERNAME: Joi.string().required(),
        NEO4J_PASSWORD: Joi.string().required(),
        CHROMA_HOST: Joi.string().required(),
        CHROMA_PORT: Joi.number().port().default(8000),
        OLLAMA_BASE_URL: Joi.string()
          .uri({ scheme: ['http', 'https'] })
          .default('http://127.0.0.1:11434'),
        OLLAMA_EMBED_MODEL: Joi.string().default('nomic-embed-text'),
        OLLAMA_TIMEOUT_MS: Joi.number().integer().positive().default(120000),
        KNOWLEDGE_COLLECTION_NAME: Joi.string().default('se_knowledge_base'),
      }),
    }),
  ],
  controllers: [KnowledgeServiceController, FileIngestionController],
  providers: [
    KnowledgeServiceService,
    Neo4jService, 
    VectorService,
    TextChunkerService,
    EmbeddingService,
    FileParserService,
    GraphExtractorService,
  ],
  exports: [Neo4jService, VectorService, TextChunkerService, EmbeddingService],
})
export class KnowledgeServiceModule {}
