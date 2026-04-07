import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ApiGatewayController } from './api-gateway.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AI_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'ai',
          protoPath: join(__dirname, '../../../libs/contracts/src/proto/ai.proto'),
          url: 'localhost:50051',
        },
      },
    ]),
  ],
  controllers: [ApiGatewayController],
})
export class ApiGatewayModule {}
