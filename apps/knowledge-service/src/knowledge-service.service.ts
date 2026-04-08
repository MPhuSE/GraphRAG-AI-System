import { Injectable } from '@nestjs/common';
import { Neo4jService } from './database/neo4j.service';
import { VectorService } from './database/vector.service';

@Injectable()
export class KnowledgeServiceService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly vectorService: VectorService,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async checkDatabaseConnections() {
    const [neo4j, chroma] = await Promise.allSettled([
      this.neo4jService.checkConnection(),
      this.vectorService.checkConnection(),
    ]);

    const neo4jStatus =
      neo4j.status === 'fulfilled'
        ? neo4j.value
        : {
            status: 'error' as const,
            message: this.getErrorMessage(neo4j.reason),
          };

    const chromaStatus =
      chroma.status === 'fulfilled'
        ? chroma.value
        : {
            status: 'error' as const,
            message: this.getErrorMessage(chroma.reason),
          };

    const status =
      neo4jStatus.status === 'ok' && chromaStatus.status === 'ok'
        ? 'ok'
        : 'error';

    return {
      status,
      neo4j: neo4jStatus,
      chroma: chromaStatus,
    };
  }

  private getErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error';
  }
}
