import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver } from 'neo4j-driver';
import {
  KnowledgeChunkRecord,
  KnowledgeDocumentInput,
  KnowledgeRelationship,
} from '../knowledge.types';

@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  private driver!: Driver;
  private readonly relationTypes = [
    'PREREQUISITE_OF',
    'PART_OF',
    'RELATED_TO',
    'USES',
    'PRODUCES',
    'VALIDATES',
    'ANTI_PATTERN_OF',
  ] as const;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get('NEO4J_HOST');
    const port = this.configService.get('NEO4J_PORT');
    const user = this.configService.get('NEO4J_USERNAME');
    const pass = this.configService.get('NEO4J_PASSWORD');

    this.driver = neo4j.driver(
      `bolt://${host}:${port}`,
      neo4j.auth.basic(user, pass)
    );
  }

  async onModuleDestroy() {
    await this.driver?.close();
  }

  async executeQuery(cypher: string, params?: any) {
    const session = this.driver.session();
    try {
      const result = await session.run(cypher, params);
      return result.records;
    } finally {
      await session.close();
    }
  }

  async upsertKnowledgeGraph(
    document: KnowledgeDocumentInput,
    chunks: KnowledgeChunkRecord[],
  ) {
    const documentId = chunks[0]?.documentId;

    if (!documentId) {
      return;
    }

    await this.executeQuery(
      `
      MERGE (document:Document {id: $documentId})
      SET document.title = $title,
          document.source = $source,
          document.topic = $topic,
          document.subtopic = $subtopic,
          document.difficulty = $difficulty,
          document.uri = $uri
      MERGE (topic:Topic {name: $topic})
      MERGE (document)-[:ABOUT]->(topic)
      `,
      {
        documentId,
        title: document.title,
        source: document.source,
        topic: document.topic.toLowerCase(),
        subtopic: document.subtopic?.toLowerCase() ?? null,
        difficulty: document.difficulty?.toLowerCase() ?? null,
        uri: document.uri ?? null,
      },
    );

    await this.executeQuery(
      `
      UNWIND $chunks AS chunk
      MATCH (document:Document {id: chunk.documentId})
      MERGE (chunkNode:Chunk {id: chunk.id})
      SET chunkNode.index = chunk.chunkIndex,
          chunkNode.title = chunk.title,
          chunkNode.source = chunk.source,
          chunkNode.topic = chunk.topic,
          chunkNode.subtopic = chunk.subtopic,
          chunkNode.difficulty = chunk.difficulty,
          chunkNode.wordCount = chunk.wordCount,
          chunkNode.content = chunk.text
      MERGE (document)-[:HAS_CHUNK]->(chunkNode)
      MERGE (topic:Topic {name: chunk.topic})
      MERGE (chunkNode)-[:ABOUT]->(topic)
      FOREACH (tag IN chunk.tags |
        MERGE (entity:KnowledgeEntity {name: tag})
        MERGE (chunkNode)-[:MENTIONS]->(entity)
      )
      `,
      {
        chunks,
      },
    );

    const groupedRelationships = this.groupRelationshipsByType(
      document.relationships ?? [],
    );

    for (const [relationType, pairs] of groupedRelationships.entries()) {
      if (pairs.length === 0) {
        continue;
      }

      await this.executeQuery(
        `
        UNWIND $pairs AS pair
        // Xu ly thong minh: Neu la mon hoc thi label la Course, con lai la KnowledgeEntity
        MERGE (source:KnowledgeEntity {name: pair.source})
        MERGE (target:KnowledgeEntity {name: pair.target})
        MERGE (source)-[:${relationType}]->(target)
        `,
        {
          pairs,
        },
      );
    }
  }

  async findRelatedConcepts(keywords: string[], limit = 10) {
    if (keywords.length === 0) {
      return [];
    }

    // Tim kiem cac Node lien quan va lay them hang xom de mo rong ngu canh
    const records = await this.executeQuery(
      `
      MATCH (n)
      WHERE any(k IN $keywords WHERE toLower(n.name) CONTAINS k OR toLower(n.title) CONTAINS k)
      WITH n LIMIT 5
      MATCH (n)-[r]-(m)
      RETURN DISTINCT 
        n.name + " " + type(r) + " " + coalesce(m.name, m.title) as relationship,
        labels(n)[0] as type,
        n.name as main_node
      LIMIT $limit
      `,
      {
        keywords,
        limit: neo4j.int(limit),
      },
    );

    return records.map(r => r.get('relationship')).filter(Boolean) as string[];
  }

  async checkConnection() {
    await this.driver.verifyConnectivity();

    const records = await this.executeQuery('RETURN 1 AS ok');
    const result = records[0]?.get('ok');

    return {
      status: 'ok' as const,
      queryResult: result,
    };
  }

  private groupRelationshipsByType(relationships: KnowledgeRelationship[]) {
    const groups = new Map<(typeof this.relationTypes)[number], Array<{
      source: string;
      target: string;
    }>>();

    for (const relationType of this.relationTypes) {
      groups.set(relationType, []);
    }

    for (const relationship of relationships) {
      if (!this.relationTypes.includes(relationship.relation)) {
        continue;
      }

      groups.get(relationship.relation)?.push({
        source: relationship.source.trim().toLowerCase(),
        target: relationship.target.trim().toLowerCase(),
      });
    }

    return groups;
  }
}
