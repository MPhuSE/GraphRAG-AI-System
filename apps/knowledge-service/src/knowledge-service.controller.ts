import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { KnowledgeServiceService } from './knowledge-service.service';

@Controller()
export class KnowledgeServiceController {
  constructor(private readonly knowledgeServiceService: KnowledgeServiceService) {}

  // Kiểm tra kết nối db !!!
  @Get('health/db')
  async checkDatabaseConnections() {
    const result = await this.knowledgeServiceService.checkDatabaseConnections();

    if (result.status === 'error') {
      throw new ServiceUnavailableException(result);
    }

    return result;
  }
}
