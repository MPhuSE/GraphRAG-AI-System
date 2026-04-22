import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { join } from 'path';
import { AiServiceController } from './ai-service.controller';
import { AiServiceService } from './ai-service.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), 'apps/ai-service/.env'),
        join(process.cwd(), '.env'),
      ],
      validationSchema: Joi.object({
        OLLAMA_BASE_URL: Joi.string()
          .uri({ scheme: ['http', 'https'] })
          .default('http://127.0.0.1:11434'),
        OLLAMA_MODEL: Joi.string().default('llama3:latest'),
        OLLAMA_TIMEOUT_MS: Joi.number().integer().positive().default(120000),
        OLLAMA_TEMPERATURE: Joi.number().min(0).max(2).default(0.2),
        OLLAMA_NUM_PREDICT: Joi.number().integer().positive().default(128),
        KNOWLEDGE_SERVICE_BASE_URL: Joi.string()
          .uri({ scheme: ['http', 'https'] })
          .default('http://127.0.0.1:3001'),
        KNOWLEDGE_TOP_K: Joi.number().integer().min(1).max(8).default(4),
      }),
    }),
  ],
  controllers: [AiServiceController],
  providers: [AiServiceService],
})
export class AiServiceModule {}
