import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChromaClient } from 'chromadb';

@Injectable()
export class VectorService {
  private client: ChromaClient;

  constructor(private configService: ConfigService) {
    this.client = new ChromaClient({
      path: `http://${this.configService.get('CHROMA_HOST')}:${this.configService.get('CHROMA_PORT')}`
    });
  }

  async getOrCreateCollection(name: string) {
    return await this.client.getOrCreateCollection({ name });
  }

  async checkConnection() {
    const heartbeat = await this.client.heartbeat();

    return {
      status: 'ok' as const,
      heartbeat,
    };
  }
}
