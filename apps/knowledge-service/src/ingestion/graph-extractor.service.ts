import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KnowledgeRelationship } from '../knowledge.types';

@Injectable()
export class GraphExtractorService {
  private readonly logger = new Logger(GraphExtractorService.name);
  private readonly baseUrl: string;
  private readonly modelName: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get('OLLAMA_BASE_URL') || 'http://127.0.0.1:11434';
    this.modelName = this.configService.get('OLLAMA_MODEL') || 'llama3:latest';
  }

  async extractRelationships(textChunk: string): Promise<KnowledgeRelationship[]> {
    try {
      const prompt = `
Ban la chuyen gia triet xuat Do thi tri thuc (Knowledge Graph).
Tu doan van ban sau, hay trich xuat cac moi quan he giua cac thuc the duoi dinh dang JSON mang.
Cac loai quan he cho phep: PREREQUISITE_OF, PART_OF, RELATED_TO, USES, PRODUCES, VALIDATES, ANTI_PATTERN_OF.
Tra ve DONG NHAT 1 mang JSON array gom cac object co dang {"source": "Thuc the A", "relation": "LOAI_QUAN_HE", "target": "Thuc the B"}.
Dien dat ten thuc the ngan gon. Chi tra ve JSON, khong tra ve text thua.

Van ban:
"${textChunk.substring(0, 2000)}" // Gioi han do dai de chay cho local model an toan
      `.trim();

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.modelName,
          prompt,
          stream: false,
          format: 'json',
          options: { temperature: 0.1, num_ctx: 1024 }
        })
      });

      if (!response.ok) {
        throw new Error('Ollama failed to generate response');
      }

      const payload = await response.json();
      const relationships = JSON.parse(payload.response || '[]');
      
      return Array.isArray(relationships) ? relationships : [];
    } catch (error) {
      this.logger.error('Failed to extract relationships via Ollama:', error);
      return [];
    }
  }
}
