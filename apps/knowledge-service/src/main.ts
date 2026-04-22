import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import { join } from 'path';
import * as swaggerUi from 'swagger-ui-express';
import { KnowledgeServiceModule } from './knowledge-service.module';

async function bootstrap() {
  const app = await NestFactory.create(KnowledgeServiceModule);
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AI System Knowledge Service')
    .setDescription('Swagger docs cho ingest va retrieval knowledge')
    .setVersion('1.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);
  await app.listen(process.env.PORT ?? 3001);
  console.log('Knowledge Service running on http://localhost:3001');
  console.log('Swagger docs at http://localhost:3001/docs');
}
bootstrap();
