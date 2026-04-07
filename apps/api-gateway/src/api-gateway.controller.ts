import { Controller, Get, Inject, Query } from '@nestjs/common';
import { type OnModuleInit } from '@nestjs/common';
import { type ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';

interface AskQuestionRequest {
  question: string;
}

interface AskQuestionResponse {
  answer: string;
}

interface AiServiceClient {
  AskQuestion(data: AskQuestionRequest): Observable<AskQuestionResponse>;
}

@Controller('chat')
export class ApiGatewayController implements OnModuleInit {
  private aiService!: AiServiceClient;

  constructor(@Inject('AI_PACKAGE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.aiService = this.client.getService<AiServiceClient>('AiService');
  }

  @Get()
  getHello(@Query('q') q = '') {
    return this.aiService.AskQuestion({ question: q });
  }
}
