import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AiServiceModule } from './ai-service.module';
async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AiServiceModule, {
    transport: Transport.GRPC,
    options: {
      package: 'ai',
      protoPath: join(__dirname, '../../../libs/contracts/src/proto/ai.proto'),
      url: '0.0.0.0:50051',
    },
  });
  await app.listen();
  console.log('AI Service đang chạy gRPC trên port 50051');
}
bootstrap();
