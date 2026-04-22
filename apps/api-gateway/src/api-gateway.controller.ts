import {
  Controller,
  GatewayTimeoutException,
  Get,
  HttpException,
  Inject,
  Query,
  ServiceUnavailableException,
} from '@nestjs/common';
import { type OnModuleInit } from '@nestjs/common';
import { type ClientGrpc } from '@nestjs/microservices';
import {
  ApiGatewayTimeoutResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { catchError, Observable, throwError } from 'rxjs';
import { ChatResponseDto } from './api-gateway.swagger';

interface AskQuestionRequest {
  question: string;
}

interface AskQuestionResponse {
  answer: string;
  sources: Array<{
    id: string;
    title: string;
    source: string;
    topic: string;
    excerpt: string;
    uri?: string;
    score: number;
  }>;
  grounded: boolean;
  retrievalStrategy: string;
}

interface AiServiceClient {
  AskQuestion(data: AskQuestionRequest): Observable<AskQuestionResponse>;
}

@ApiTags('chat')
@Controller('chat')
export class ApiGatewayController implements OnModuleInit {
  private aiService!: AiServiceClient;

  constructor(@Inject('AI_PACKAGE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.aiService = this.client.getService<AiServiceClient>('AiService');
  }

  @ApiOperation({ summary: 'Hoi dap RAG cho mien Software Engineering' })
  @ApiQuery({
    name: 'q',
    required: false,
    example: 'unit test dung de lam gi?',
  })
  @ApiOkResponse({ type: ChatResponseDto })
  @ApiGatewayTimeoutResponse({ description: 'AI hoac retrieval bi timeout' })
  @ApiServiceUnavailableResponse({
    description: 'AI service hoac knowledge service khong san sang',
  })
  @Get()
  getHello(@Query('q') q = '') {
    return this.aiService.AskQuestion({ question: q }).pipe(
      catchError((error: { code?: number; details?: string; message?: string }) =>
        throwError(() => this.mapGrpcError(error)),
      ),
    );
  }

  private mapGrpcError(error: {
    code?: number;
    details?: string;
    message?: string;
  }) {
    const message = error.details || error.message || 'AI service error';

    if (error.code === 4) {
      return new GatewayTimeoutException(message);
    }

    if (error.code === 14) {
      return new ServiceUnavailableException(message);
    }

    return new HttpException(message, 500);
  }
}
