import { Test, TestingModule } from '@nestjs/testing';
import { AiServiceController } from './ai-service.controller';
import { AiServiceService } from './ai-service.service';

describe('AiServiceController', () => {
  let aiServiceController: AiServiceController;
  const mockAiService = {
    askQuestion: jest.fn(),
  };

  beforeEach(async () => {
    mockAiService.askQuestion.mockReset();

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AiServiceController],
      providers: [
        {
          provide: AiServiceService,
          useValue: mockAiService,
        },
      ],
    }).compile();

    aiServiceController = app.get<AiServiceController>(AiServiceController);
  });

  describe('askQuestion', () => {
    it('should return the AI response payload', async () => {
      mockAiService.askQuestion.mockResolvedValue({
        answer: 'Unit test giup xac minh tung don vi hanh vi [Nguon 1].',
        sources: [
          {
            id: 'chunk-1',
            title: 'Software Testing Strategy',
            source: 'SE Handbook',
            topic: 'software-testing',
            excerpt: 'Unit tests check small isolated pieces of behavior.',
            score: 0.92,
          },
        ],
        grounded: true,
        retrievalStrategy: 'vector+keyword+graph-rerank',
      });

      await expect(
        aiServiceController.askQuestion({ question: 'NestJS la gi?' }),
      ).resolves.toEqual({
        answer: 'Unit test giup xac minh tung don vi hanh vi [Nguon 1].',
        sources: [
          {
            id: 'chunk-1',
            title: 'Software Testing Strategy',
            source: 'SE Handbook',
            topic: 'software-testing',
            excerpt: 'Unit tests check small isolated pieces of behavior.',
            score: 0.92,
          },
        ],
        grounded: true,
        retrievalStrategy: 'vector+keyword+graph-rerank',
      });
    });

    it('should surface a gRPC deadline exceeded error for timeouts', async () => {
      mockAiService.askQuestion.mockRejectedValue(
        new Error('Knowledge retrieval timed out after 120000ms'),
      );

      await expect(
        aiServiceController.askQuestion({ question: 'NestJS la gi?' }),
      ).rejects.toMatchObject({
        error: {
          code: 4,
          message: 'Knowledge retrieval timed out after 120000ms',
        },
      });
    });
  });
});
