import { ApiProperty } from '@nestjs/swagger';

export class KnowledgeRelationshipDto {
  @ApiProperty({ example: 'unit test' })
  source: string;

  @ApiProperty({
    example: 'PART_OF',
    enum: [
      'PREREQUISITE_OF',
      'PART_OF',
      'RELATED_TO',
      'USES',
      'PRODUCES',
      'VALIDATES',
      'ANTI_PATTERN_OF',
    ],
  })
  relation: string;

  @ApiProperty({ example: 'software testing' })
  target: string;
}

export class KnowledgeDocumentDto {
  @ApiProperty({ required: false, example: 'testing-basics' })
  id?: string;

  @ApiProperty({ example: 'Testing Basics' })
  title: string;

  @ApiProperty({ example: 'Internal Handbook' })
  source: string;

  @ApiProperty({
    example:
      'Unit tests validate small isolated behavior. Integration tests verify collaboration between components.',
  })
  content: string;

  @ApiProperty({ example: 'software-testing' })
  topic: string;

  @ApiProperty({ required: false, example: 'unit-testing' })
  subtopic?: string;

  @ApiProperty({ required: false, example: 'foundation' })
  difficulty?: string;

  @ApiProperty({
    required: false,
    type: () => [String],
    example: ['unit test', 'regression test'],
  })
  tags?: string[];

  @ApiProperty({ required: false, example: 'se://testing/basics' })
  uri?: string;

  @ApiProperty({ required: false, type: () => [KnowledgeRelationshipDto] })
  relationships?: KnowledgeRelationshipDto[];
}

export class IngestKnowledgeRequestDto {
  @ApiProperty({ type: () => [KnowledgeDocumentDto] })
  documents: KnowledgeDocumentDto[];
}

export class RetrieveKnowledgeRequestDto {
  @ApiProperty({ example: 'unit test dung de lam gi?' })
  query: string;

  @ApiProperty({ required: false, example: 4 })
  topK?: number;

  @ApiProperty({ required: false, example: 'software-testing' })
  topic?: string;
}

export class RetrievedChunkDto {
  @ApiProperty()
  chunkId: string;

  @ApiProperty()
  documentId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  source: string;

  @ApiProperty()
  topic: string;

  @ApiProperty({ required: false })
  subtopic?: string;

  @ApiProperty({ required: false })
  difficulty?: string;

  @ApiProperty({ required: false })
  uri?: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ example: 0.91 })
  score: number;

  @ApiProperty({ nullable: true, example: 0.12 })
  distance: number | null;

  @ApiProperty({ example: 0 })
  chunkIndex: number;

  @ApiProperty({ type: () => [String] })
  tags: string[];
}

export class AnswerSourceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  source: string;

  @ApiProperty()
  topic: string;

  @ApiProperty()
  excerpt: string;

  @ApiProperty({ required: false })
  uri?: string;

  @ApiProperty({ example: 0.91 })
  score: number;
}

export class RetrievalResultDto {
  @ApiProperty({ example: 'unit test dung de lam gi?' })
  query: string;

  @ApiProperty({ example: 'vector+keyword+graph-rerank' })
  strategy: string;

  @ApiProperty({
    type: () => [String],
    example: ['unit test PART_OF software testing'],
  })
  relatedConcepts: string[];

  @ApiProperty({ type: () => [RetrievedChunkDto] })
  chunks: RetrievedChunkDto[];

  @ApiProperty({ type: () => [AnswerSourceDto] })
  sources: AnswerSourceDto[];
}

export class IngestKnowledgeResultDto {
  @ApiProperty({ example: 'ok' })
  status: string;

  @ApiProperty({ example: 'se_knowledge_base' })
  collectionName: string;

  @ApiProperty({ example: 5 })
  documentsReceived: number;

  @ApiProperty({ example: 9 })
  chunksStored: number;

  @ApiProperty({ example: 'ok', enum: ['ok', 'skipped'] })
  graphStatus: string;
}

export class DbConnectionDetailDto {
  @ApiProperty({ example: 'ok', enum: ['ok', 'error'] })
  status: string;

  @ApiProperty({ required: false, example: 1 })
  queryResult?: number;

  @ApiProperty({ required: false, example: 123456789 })
  heartbeat?: number;

  @ApiProperty({ required: false, example: 'se_knowledge_base' })
  collectionName?: string;

  @ApiProperty({ required: false, example: 9 })
  chunkCount?: number;

  @ApiProperty({ required: false, example: 'Neo4j unavailable' })
  message?: string;
}

export class DbHealthResponseDto {
  @ApiProperty({ example: 'ok', enum: ['ok', 'error'] })
  status: string;

  @ApiProperty({ type: () => DbConnectionDetailDto })
  neo4j: DbConnectionDetailDto;

  @ApiProperty({ type: () => DbConnectionDetailDto })
  chroma: DbConnectionDetailDto;
}
