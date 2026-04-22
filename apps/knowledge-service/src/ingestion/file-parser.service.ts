import { Injectable, BadRequestException } from '@nestjs/common';
const { PDFParse } = require('pdf-parse');
import * as mammoth from 'mammoth';

@Injectable()
export class FileParserService {
  async extractText(buffer: Buffer, mimetype: string, originalname: string): Promise<string> {
    try {
      if (
        mimetype === 'application/pdf' ||
        originalname.toLowerCase().endsWith('.pdf')
      ) {
        return await this.parsePdf(buffer);
      }

      if (
        mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        originalname.toLowerCase().endsWith('.docx')
      ) {
        return await this.parseDocx(buffer);
      }

      if (
        mimetype === 'text/plain' ||
        originalname.toLowerCase().endsWith('.txt')
      ) {
        return buffer.toString('utf-8');
      }

      throw new BadRequestException('Unsupported file format. Only PDF, DOCX, and TXT are allowed.');
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Failed to parse file: ${error.message}`);
    }
  }

  private async parsePdf(buffer: Buffer): Promise<string> {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    return result.text;
  }

  private async parseDocx(buffer: Buffer): Promise<string> {
    const data = await mammoth.extractRawText({ buffer });
    return data.value;
  }
}
