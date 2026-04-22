import { Injectable } from '@nestjs/common';
import { EmbeddingService } from './database/embedding.service';
import { Neo4jService } from './database/neo4j.service';
import { VectorService } from './database/vector.service';
import { softwareEngineeringSeedDocuments } from './knowledge-base/software-engineering.seed';
import { TextChunkerService } from './knowledge-base/text-chunker.service';
import {
  IngestKnowledgeResult,
  KnowledgeDocumentInput,
  RetrievalResult,
  RetrieveKnowledgeInput,
  RetrievedChunk,
} from './knowledge.types';

@Injectable()
export class KnowledgeServiceService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly vectorService: VectorService,
    private readonly textChunkerService: TextChunkerService,
    private readonly embeddingService: EmbeddingService,
  ) {}

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

  async bootstrapSoftwareEngineeringKnowledge(): Promise<IngestKnowledgeResult> {
    return this.ingestDocuments(softwareEngineeringSeedDocuments);
  }

  async clearAllData() {
    await this.vectorService.clearAll();
  }

  async peekKnowledge() {
    return this.vectorService.peekChunks(10);
  }

  async ingestDocuments(
    documents: KnowledgeDocumentInput[],
  ): Promise<IngestKnowledgeResult> {
    if (!Array.isArray(documents) || documents.length === 0) {
      throw new Error('At least one knowledge document is required');
    }

    const normalizedDocuments = documents.map((document) =>
      this.normalizeDocument(document),
    );
    const chunks = normalizedDocuments.flatMap((document) =>
      this.textChunkerService.chunkDocument(document),
    );

    if (chunks.length === 0) {
      throw new Error('The provided documents did not produce any chunks');
    }

    const embeddings = await this.embeddingService.generateEmbeddings(
      chunks.map((chunk) => chunk.text),
    );

    await this.vectorService.upsertChunks(chunks, embeddings);
    const chunksByDocumentId = new Map<string, typeof chunks>();

    for (const chunk of chunks) {
      const existing = chunksByDocumentId.get(chunk.documentId);

      if (existing) {
        existing.push(chunk);
      } else {
        chunksByDocumentId.set(chunk.documentId, [chunk]);
      }
    }

    let graphStatus: 'ok' | 'skipped' = 'ok';

    for (const document of normalizedDocuments) {
      const documentId = document.id ?? this.buildDocumentId(document);
      const documentChunks = chunksByDocumentId.get(documentId) ?? [];

      try {
        await this.neo4jService.upsertKnowledgeGraph(document, documentChunks);
      } catch {
        graphStatus = 'skipped';
      }
    }

    return {
      status: 'ok',
      collectionName: this.vectorService.getDefaultCollectionName(),
      documentsReceived: normalizedDocuments.length,
      chunksStored: chunks.length,
      graphStatus,
    };
  }

  async retrieveKnowledge(
    input: RetrieveKnowledgeInput,
  ): Promise<RetrievalResult> {
    const query = input.query.trim();

    if (!query) {
      throw new Error('Query is required');
    }

    const topK = this.clampTopK(input.topK);
    const queryEmbedding = await this.embeddingService.generateEmbeddings([query]);
    const rawChunks = await this.vectorService.queryChunks({
      queryEmbedding: queryEmbedding[0],
      topK: Math.max(topK * 2, 6),
      topic: input.topic,
    });
    const relatedConcepts = await this.safeFindRelatedConcepts(query);
    const rerankedChunks = this.rerankChunks(rawChunks, query, relatedConcepts)
      .slice(0, topK)
      .map((chunk) => ({
        ...chunk,
        content: chunk.content.trim(),
      }));

    const sources = rerankedChunks.map((chunk) => ({
      id: chunk.chunkId,
      title: chunk.title,
      source: chunk.source,
      topic: chunk.topic,
      excerpt: this.buildExcerpt(chunk.content, 220),
      uri: chunk.uri,
      score: chunk.score,
    }));

    return {
      query,
      strategy: 'vector+keyword+graph-rerank',
      relatedConcepts,
      chunks: rerankedChunks,
      sources,
    };
  }

  private getErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error';
  }

  private normalizeDocument(document: KnowledgeDocumentInput) {
    if (!document.title?.trim()) {
      throw new Error('Document title is required');
    }

    if (!document.source?.trim()) {
      throw new Error('Document source is required');
    }

    if (!document.content?.trim()) {
      throw new Error('Document content is required');
    }

    if (!document.topic?.trim()) {
      throw new Error('Document topic is required');
    }

    return {
      ...document,
      id: document.id?.trim() || this.buildDocumentId(document),
      title: document.title?.trim(),
      source: document.source?.trim(),
      content: document.content?.trim(),
      topic: document.topic?.trim().toLowerCase(),
      subtopic: document.subtopic?.trim().toLowerCase(),
      difficulty: document.difficulty?.trim().toLowerCase(),
      uri: document.uri?.trim(),
      tags: (document.tags ?? []).map((tag) => tag.trim().toLowerCase()),
      relationships: document.relationships ?? [],
    };
  }

  private clampTopK(topK?: number) {
    if (!topK || Number.isNaN(topK)) {
      return 4;
    }

    return Math.min(Math.max(Math.trunc(topK), 1), 8);
  }

  private async safeFindRelatedConcepts(query: string) {
    const keywords = this.extractKeywords(query);

    try {
      return await this.neo4jService.findRelatedConcepts(keywords);
    } catch {
      return [];
    }
  }

  private rerankChunks(
    chunks: RetrievedChunk[],
    query: string,
    relatedConcepts: string[],
  ) {
    const keywords = this.extractKeywords(query);
    const graphTerms = Array.from(new Set(
      relatedConcepts
        .join(' ')
        .toLowerCase()
        .split(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+/u)
        .filter(t => t.length > 2)
    ));

    return chunks
      .map((chunk) => {
        const textToSearch = `${chunk.title} ${chunk.content} ${chunk.tags.join(' ')}`.toLowerCase();
        
        // 1. Keyword Score (BM25-lite)
        const keywordHits = keywords.filter(k => textToSearch.includes(k)).length;
        const keywordScore = keywords.length > 0 ? keywordHits / keywords.length : 0;

        // 2. Graph Context Score (Linh hon cua GraphRAG)
        const graphHits = graphTerms.filter(t => textToSearch.includes(t)).length;
        const graphScore = graphTerms.length > 0 ? Math.min(graphHits / 3, 1) : 0;

        // 3. Vector Score (Chuyen tu Distance sang Score)
        const vectorScore = chunk.distance != null ? 1 / (1 + chunk.distance) : 0.5;

        // Tong hop diem: Graph (40%) + Vector (40%) + Keyword (20%)
        const finalScore = (graphScore * 0.4) + (vectorScore * 0.4) + (keywordScore * 0.2);

        return {
          ...chunk,
          score: Number(finalScore.toFixed(4)),
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  private extractKeywords(text: string) {
    return Array.from(
      new Set(
        text
          .toLowerCase()
          .split(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+/u)
          .filter((token) => token.length >= 2)
          .filter(
            (token) =>
              ![
                'lam', 'the', 'nao', 'la', 'gi', 'cua', 'cho', 'trong', 'tai', 'voi'
              ].includes(token),
          ),
      ),
    );
  }

  private buildExcerpt(text: string, maxLength: number) {
    if (text.length <= maxLength) {
      return text;
    }

    return `${text.slice(0, maxLength).trim()}...`;
  }

  private buildDocumentId(document: KnowledgeDocumentInput) {
    return `${document.topic}-${document.title}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
