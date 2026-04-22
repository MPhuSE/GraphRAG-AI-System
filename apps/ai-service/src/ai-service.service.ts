import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface OllamaGenerateResponse {
  response?: string;
  error?: string;
}

interface KnowledgeSource {
  id: string;
  title: string;
  source: string;
  topic: string;
  excerpt: string;
  uri?: string;
  score: number;
}

interface RetrievedChunk {
  chunkId: string;
  title: string;
  source: string;
  topic: string;
  subtopic?: string;
  content: string;
  score: number;
}

interface RetrievalResponse {
  strategy: string;
  relatedConcepts: string[];
  chunks: RetrievedChunk[];
  sources: KnowledgeSource[];
}

export interface RagAnswerResponse {
  answer: string;
  sources: KnowledgeSource[];
  grounded: boolean;
  retrievalStrategy: string;
}

@Injectable()
export class AiServiceService {
  private readonly baseUrl: string;
  private readonly modelName: string;
  private readonly timeoutMs: number;
  private readonly temperature: number;
  private readonly numPredict: number;
  private readonly knowledgeServiceBaseUrl: string;
  private readonly topK: number;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('OLLAMA_BASE_URL') ??
      'http://127.0.0.1:11434';
    this.modelName =
      this.configService.get<string>('OLLAMA_MODEL') ?? 'llama3:latest';
    this.timeoutMs =
      this.configService.get<number>('OLLAMA_TIMEOUT_MS') ?? 300000;
    this.temperature =
      this.configService.get<number>('OLLAMA_TEMPERATURE') ?? 0.2;
    this.numPredict =
      this.configService.get<number>('OLLAMA_NUM_PREDICT') ?? 128;
    this.knowledgeServiceBaseUrl =
      this.configService.get<string>('KNOWLEDGE_SERVICE_BASE_URL') ??
      'http://127.0.0.1:3001';
    this.topK = this.configService.get<number>('KNOWLEDGE_TOP_K') ?? 2;
  }

  async askQuestion(question: string) {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      return {
        answer: 'Vui long nhap cau hoi.',
        sources: [],
        grounded: false,
        retrievalStrategy: 'none',
      } satisfies RagAnswerResponse;
    }

    const retrieval = await this.retrieveKnowledge(trimmedQuestion);

    if (retrieval.chunks.length === 0) {
      return {
        answer:
          'Minh chua tim thay ngu canh du manh trong kho tri thuc Software Engineering de tra loi chac chan cau hoi nay.',
        sources: [],
        grounded: false,
        retrievalStrategy: retrieval.strategy,
      } satisfies RagAnswerResponse;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.modelName,
          prompt: this.buildPrompt(trimmedQuestion, retrieval),
          stream: false,
          keep_alive: '10m',
          options: {
            temperature: this.temperature,
            num_predict: this.numPredict,
            num_ctx: 1024,
          },
        }),
        signal: controller.signal,
      });

      const payload = (await response.json()) as OllamaGenerateResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? 'Ollama request failed');
      }

      if (!payload.response) {
        throw new Error('Ollama returned an empty response');
      }

      return {
        answer: payload.response.trim(),
        sources: retrieval.sources,
        grounded: true,
        retrievalStrategy: retrieval.strategy,
      } satisfies RagAnswerResponse;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(
          `Ollama request timed out after ${this.timeoutMs}ms`,
        );
      }

      if (error instanceof Error) {
        throw error;
      }

      throw new Error('Unknown Ollama error');
    } finally {
      clearTimeout(timeout);
    }
  }

  private async retrieveKnowledge(question: string) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(
        `${this.knowledgeServiceBaseUrl}/knowledge/retrieve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: question,
            topK: this.topK,
          }),
          signal: controller.signal,
        },
      );

      const payload = (await response.json()) as RetrievalResponse & {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message ?? 'Knowledge retrieval failed');
      }

      return payload;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(
          `Knowledge retrieval timed out after ${this.timeoutMs}ms`,
        );
      }

      if (error instanceof Error) {
        throw error;
      }

      throw new Error('Unknown knowledge retrieval error');
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildPrompt(question: string, retrieval: RetrievalResponse) {
    const contextBlocks = retrieval.chunks
      .map(
        (chunk, index) =>
          `[Nguon ${index + 1}] Tieu de: ${chunk.title}\nChu de: ${chunk.topic}\nNguon tai lieu: ${chunk.source}\nNoi dung: ${chunk.content}`,
      )
      .join('\n\n');
    const relatedConcepts =
      retrieval.relatedConcepts.length > 0
        ? retrieval.relatedConcepts.join('; ')
        : 'Khong co';

    return [
      'Ban la tro ly RAG cho mon Software Engineering.',
      'Chi duoc phep tra loi dua tren ngu canh da truy xuat ben duoi.',
      'Neu ngu canh chua du, hay noi ro la chua du bang chung.',
      'Tra loi bang tieng Viet, ngan gon, ro rang, toi da 6 cau.',
      'Khi dua ra y chinh, hay gan nhan [Nguon n] o cuoi cau neu phu hop.',
      `Cac khai niem lien quan tu knowledge graph: ${relatedConcepts}`,
      '',
      'Ngu canh truy xuat:',
      contextBlocks,
      '',
      `Cau hoi: ${question}`,
    ].join('\n');
  }
}
