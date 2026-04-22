import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import { join } from 'path';
import * as swaggerUi from 'swagger-ui-express';
import { ApiGatewayModule } from './api-gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AI System API Gateway')
    .setDescription('Swagger docs cho endpoint chat RAG')
    .setVersion('1.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);
  await app.listen(process.env.PORT ?? 3000);
  console.log('API Gateway running on http://localhost:3000');
  console.log('Swagger docs at http://localhost:3000/docs');
}
bootstrap();
