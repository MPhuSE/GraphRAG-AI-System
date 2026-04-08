import { NestFactory } from '@nestjs/core';
import { KnowledgeServiceModule } from './knowledge-service.module';

async function bootstrap() {
  const app = await NestFactory.create(KnowledgeServiceModule);
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
