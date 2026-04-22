import { ApiProperty } from '@nestjs/swagger';

export class ChatSourceDto {
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

  @ApiProperty({ example: 0.92 })
  score: number;
}

export class ChatResponseDto {
  @ApiProperty({
    example:
      'Unit test dung de kiem tra tung don vi hanh vi rieng le va giup phat hien loi som [Nguon 1].',
  })
  answer: string;

  @ApiProperty({ type: () => [ChatSourceDto] })
  sources: ChatSourceDto[];

  @ApiProperty({ example: true })
  grounded: boolean;

  @ApiProperty({ example: 'vector+keyword+graph-rerank' })
  retrievalStrategy: string;
}
