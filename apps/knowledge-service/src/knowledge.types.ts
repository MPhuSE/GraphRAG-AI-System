export interface KnowledgeRelationship {
  source: string;
  relation:
    | 'PREREQUISITE_OF'
    | 'PART_OF'
    | 'RELATED_TO'
    | 'USES'
    | 'PRODUCES'
    | 'VALIDATES'
    | 'ANTI_PATTERN_OF';
  target: string;
}

export interface KnowledgeDocumentInput {
  id?: string;
  title: string;
  source: string;
  content: string;
  topic: string;
  subtopic?: string;
  difficulty?: string;
  tags?: string[];
  uri?: string;
  relationships?: KnowledgeRelationship[];
}

export interface KnowledgeChunkRecord {
  id: string;
  documentId: string;
  chunkIndex: number;
  title: string;
  source: string;
  topic: string;
  subtopic?: string;
  difficulty?: string;
  uri?: string;
  text: string;
  tags: string[];
  wordCount: number;
}

export interface RetrieveKnowledgeInput {
  query: string;
  topK?: number;
  topic?: string;
}

export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  title: string;
  source: string;
  topic: string;
  subtopic?: string;
  difficulty?: string;
  uri?: string;
  content: string;
  score: number;
  distance: number | null;
  chunkIndex: number;
  tags: string[];
}

export interface AnswerSource {
  id: string;
  title: string;
  source: string;
  topic: string;
  excerpt: string;
  uri?: string;
  score: number;
}

export interface RetrievalResult {
  query: string;
  strategy: string;
  relatedConcepts: string[];
  chunks: RetrievedChunk[];
  sources: AnswerSource[];
}

export interface IngestKnowledgeResult {
  status: 'ok';
  collectionName: string;
  documentsReceived: number;
  chunksStored: number;
  graphStatus: 'ok' | 'skipped';
}
