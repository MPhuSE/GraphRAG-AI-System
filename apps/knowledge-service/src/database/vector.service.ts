import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ChromaClient,
  ChromaNotFoundError,
  type Collection,
  type EmbeddingFunction,
  type Metadata,
} from 'chromadb';
import {
  KnowledgeChunkRecord,
  RetrievedChunk,
} from '../knowledge.types';

interface ChunkMetadata extends Metadata {
  documentId: string;
  title: string;
  source: string;
  topic: string;
  subtopic: string | null;
  difficulty: string | null;
  chunkIndex: number;
  tags: string[];
  wordCount: number;
}

@Injectable()
export class VectorService {
  private client: ChromaClient;
  private readonly defaultCollectionName: string;
  private readonly collectionCache = new Map<string, Collection>();
  private readonly manualEmbeddingFunction: EmbeddingFunction = {
    // Chroma only needs this placeholder so it won't fall back to its
    // default embedding package. Our app always sends explicit embeddings.
    async generate(): Promise<number[][]> {
      throw new Error('Embeddings must be supplied explicitly by the app');
    },
  };

  constructor(private configService: ConfigService) {
    const chromaHost = this.configService.get<string>('CHROMA_HOST') ?? 'localhost';
    const chromaPort = this.configService.get<number>('CHROMA_PORT') ?? 8000;

    this.client = new ChromaClient({
      host: chromaHost,
      port: chromaPort,
      ssl: false,
    });
    this.defaultCollectionName =
      this.configService.get<string>('KNOWLEDGE_COLLECTION_NAME') ??
      'se_knowledge_base';
  }

  async getOrCreateCollection(name = this.defaultCollectionName) {
    const cachedCollection = this.collectionCache.get(name);

    if (cachedCollection) {
      return cachedCollection;
    }

    const collection = await this.getCollectionOrCreate(name);
    this.collectionCache.set(name, collection);

    return collection;
  }

  async upsertChunks(
    chunks: KnowledgeChunkRecord[],
    embeddings: number[][],
    collectionName = this.defaultCollectionName,
  ) {
    if (chunks.length === 0) {
      return;
    }

    const collection = await this.getOrCreateCollection(collectionName);

    await collection.upsert({
      ids: chunks.map((chunk) => chunk.id),
      embeddings,
      documents: chunks.map((chunk) => chunk.text),
      metadatas: chunks.map((chunk) => ({
        documentId: chunk.documentId,
        title: chunk.title,
        source: chunk.source,
        topic: chunk.topic,
        subtopic: chunk.subtopic ?? null,
        difficulty: chunk.difficulty ?? null,
        chunkIndex: chunk.chunkIndex,
        tags: chunk.tags,
        wordCount: chunk.wordCount,
      })),
      uris: chunks.map((chunk) => chunk.uri ?? chunk.source),
    });
  }

  async queryChunks({
    queryEmbedding,
    topK,
    topic,
    collectionName = this.defaultCollectionName,
  }: {
    queryEmbedding: number[];
    topK: number;
    topic?: string;
    collectionName?: string;
  }): Promise<RetrievedChunk[]> {
    const collection = await this.getOrCreateCollection(collectionName);
    const count = await collection.count();

    if (count === 0) {
      return [];
    }

    const result = await collection.query<ChunkMetadata>({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
      where: topic
        ? {
            topic: topic.toLowerCase(),
          }
        : undefined,
      include: ['documents', 'metadatas', 'distances', 'uris'],
    });

    return (result.rows()[0] ?? []).map((row) => ({
      chunkId: row.id,
      documentId: String(row.metadata?.documentId ?? ''),
      title: String(row.metadata?.title ?? 'Untitled chunk'),
      source: String(row.metadata?.source ?? 'Unknown source'),
      topic: String(row.metadata?.topic ?? 'general'),
      subtopic:
        row.metadata?.subtopic == null
          ? undefined
          : String(row.metadata.subtopic),
      difficulty:
        row.metadata?.difficulty == null
          ? undefined
          : String(row.metadata.difficulty),
      uri: row.uri ?? undefined,
      content: row.document ?? '',
      score: 0,
      distance: row.distance ?? null,
      chunkIndex: Number(row.metadata?.chunkIndex ?? 0),
      tags: Array.isArray(row.metadata?.tags)
        ? row.metadata.tags.map((tag) => String(tag))
        : [],
    }));
  }

  getDefaultCollectionName() {
    return this.defaultCollectionName;
  }

  async peekChunks(limit = 10, collectionName = this.defaultCollectionName) {
    const collection = await this.getOrCreateCollection(collectionName);
    return await collection.peek({
      limit,
    });
  }

  async checkConnection() {
    const heartbeat = await this.client.heartbeat();
    const collection = await this.getCollectionIfExists();
    const chunkCount = collection ? await collection.count() : 0;

    return {
      status: 'ok' as const,
      heartbeat,
      collectionName: this.defaultCollectionName,
      chunkCount,
    };
  }

  async clearAll(name = this.defaultCollectionName) {
    try {
      await this.client.deleteCollection({ name });
      this.collectionCache.delete(name);
    } catch {
      // Collection already deleted or does not exist
    }
  }

  private async getCollectionOrCreate(name: string) {
    const existingCollection = await this.getCollectionIfExists(name);

    if (existingCollection) {
      return existingCollection;
    }

    return this.client.createCollection({
      name,
      embeddingFunction: this.manualEmbeddingFunction,
      metadata: {
        domain: 'software-engineering',
      },
    });
  }

  private async getCollectionIfExists(name = this.defaultCollectionName) {
    try {
      return await this.client.getCollection({
        name,
        embeddingFunction: this.manualEmbeddingFunction,
      });
    } catch (error) {
      if (error instanceof ChromaNotFoundError) {
        return null;
      }

      if (
        error instanceof Error &&
        error.message.toLowerCase().includes('does not exist')
      ) {
        return null;
      }

      throw error;
    }
  }
}
