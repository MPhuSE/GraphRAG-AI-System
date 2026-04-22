import { status } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { AiServiceService } from './ai-service.service';

@Controller()
export class AiServiceController {
  constructor(private readonly aiServiceService: AiServiceService) {}

  @GrpcMethod('AiService', 'AskQuestion')
  async askQuestion(data: { question: string }) {
    try {
      return await this.aiServiceService.askQuestion(data.question);
    } catch (error) {
      throw new RpcException({
        code: this.getGrpcStatusCode(error),
        message: this.getErrorMessage(error),
      });
    }
  }

  private getGrpcStatusCode(error: unknown) {
    const message = this.getErrorMessage(error).toLowerCase();

    if (message.includes('timed out')) {
      return status.DEADLINE_EXCEEDED;
    }

    if (
      message.includes('knowledge retrieval failed') ||
      message.includes('knowledge service') ||
      message.includes('unavailable') ||
      message.includes('failed to fetch') ||
      message.includes('fetch failed') ||
      message.includes('connect') ||
      message.includes('econnrefused')
    ) {
      return status.UNAVAILABLE;
    }

    return status.INTERNAL;
  }

  private getErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown AI service error';
  }
}
