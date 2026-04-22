import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface OllamaEmbedResponse {
  embeddings?: number[][];
}

interface LegacyOllamaEmbeddingResponse {
  embedding?: number[];
}

@Injectable()
export class EmbeddingService {
  private readonly baseUrl: string;
  private readonly modelName: string;
  private readonly timeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('OLLAMA_BASE_URL') ??
      'http://127.0.0.1:11434';
    this.modelName =
      this.configService.get<string>('OLLAMA_EMBED_MODEL') ??
      'nomic-embed-text';
    this.timeoutMs =
      this.configService.get<number>('OLLAMA_TIMEOUT_MS') ?? 120000;
  }

  async generateEmbeddings(texts: string[]) {
    if (texts.length === 0) {
      return [];
    }

    try {
      return await this.embedBatch(texts);
    } catch {
      return Promise.all(texts.map((text) => this.embedLegacy(text)));
    }
  }

  private async embedBatch(texts: string[]) {
    const payload = (await this.postJson('/api/embed', {
      model: this.modelName,
      input: texts,
      truncate: true,
    })) as OllamaEmbedResponse;

    if (!payload.embeddings || payload.embeddings.length !== texts.length) {
      throw new Error('Ollama embed response did not match input size');
    }

    return payload.embeddings;
  }

  private async embedLegacy(text: string) {
    const payload = (await this.postJson('/api/embeddings', {
      model: this.modelName,
      prompt: text,
    })) as LegacyOllamaEmbeddingResponse;

    if (!payload.embedding) {
      throw new Error('Ollama legacy embedding response was empty');
    }

    return payload.embedding;
  }

  private async postJson(path: string, body: Record<string, unknown>) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const payload = (await response.json()) as Record<string, unknown>;

      if (!response.ok) {
        const message =
          typeof payload.error === 'string'
            ? payload.error
            : `Embedding request failed for ${path}`;
        throw new Error(message);
      }

      return payload;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(
          `Ollama embedding request timed out after ${this.timeoutMs}ms`,
        );
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
