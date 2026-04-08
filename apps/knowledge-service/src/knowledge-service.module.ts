import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import * as Joi from 'joi';

import { KnowledgeServiceController } from './knowledge-service.controller';
import { KnowledgeServiceService } from './knowledge-service.service';
import { Neo4jService } from './database/neo4j.service'; 
import { VectorService } from './database/vector.service';

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
      }),
    }),
  ],
  controllers: [KnowledgeServiceController],
  providers: [
    KnowledgeServiceService,
    Neo4jService, 
    VectorService, 
  ],
  exports: [Neo4jService, VectorService],
})
export class KnowledgeServiceModule {}
