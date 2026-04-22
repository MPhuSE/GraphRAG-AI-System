import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  KnowledgeChunkRecord,
  KnowledgeDocumentInput,
} from '../knowledge.types';

@Injectable()
export class TextChunkerService {
  private readonly targetWords = 140;
  private readonly overlapWords = 35;

  chunkDocument(document: KnowledgeDocumentInput): KnowledgeChunkRecord[] {
    const normalizedText = document.content.replace(/\r\n/g, '\n').trim();
    const paragraphs = normalizedText
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);

    const segments = paragraphs.length > 0 ? paragraphs : [normalizedText];
    const chunks = this.createChunksFromSegments(segments);
    const documentId = document.id ?? this.buildDocumentId(document);

    return chunks.map((text, chunkIndex) => ({
      id: `${documentId}:chunk:${chunkIndex}`,
      documentId,
      chunkIndex,
      title: document.title.trim(),
      source: document.source.trim(),
      topic: document.topic.trim().toLowerCase(),
      subtopic: document.subtopic?.trim().toLowerCase(),
      difficulty: document.difficulty?.trim().toLowerCase(),
      uri: document.uri?.trim(),
      text,
      tags: (document.tags ?? []).map((tag) => tag.trim().toLowerCase()),
      wordCount: this.countWords(text),
    }));
  }

  private createChunksFromSegments(segments: string[]) {
    const chunks: string[] = [];
    let currentWords: string[] = [];

    for (const segment of segments) {
      const words = segment.split(/\s+/).filter(Boolean);

      if (words.length === 0) {
        continue;
      }

      if (
        currentWords.length > 0 &&
        currentWords.length + words.length > this.targetWords
      ) {
        chunks.push(currentWords.join(' ').trim());
        currentWords = currentWords
          .slice(Math.max(0, currentWords.length - this.overlapWords))
          .concat(words);
      } else {
        currentWords = currentWords.concat(words);
      }

      while (currentWords.length >= this.targetWords + this.overlapWords) {
        chunks.push(currentWords.slice(0, this.targetWords).join(' ').trim());
        currentWords = currentWords.slice(
          Math.max(0, this.targetWords - this.overlapWords),
        );
      }
    }

    if (currentWords.length > 0) {
      chunks.push(currentWords.join(' ').trim());
    }

    return chunks.filter(Boolean);
  }

  private buildDocumentId(document: KnowledgeDocumentInput) {
    const slug = `${document.topic}-${document.title}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return slug || randomUUID();
  }

  private countWords(text: string) {
    return text.split(/\s+/).filter(Boolean).length;
  }
}
