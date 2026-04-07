import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

@Controller()
export class AiServiceController {
  @GrpcMethod('AiService', 'AskQuestion')
  askQuestion(data: { question: string }) {
    return { answer: `AI đã nhận được câu hỏi: ${data.question}` };
  }
}
