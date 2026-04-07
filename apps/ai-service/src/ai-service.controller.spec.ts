import { Test, TestingModule } from '@nestjs/testing';
import { AiServiceController } from './ai-service.controller';

describe('AiServiceController', () => {
  let aiServiceController: AiServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AiServiceController],
    }).compile();

    aiServiceController = app.get<AiServiceController>(AiServiceController);
  });

  describe('askQuestion', () => {
    it('should return the AI response payload', () => {
      expect(
        aiServiceController.askQuestion({ question: 'NestJS la gi?' }),
      ).toEqual({
        answer: 'AI đã nhận được câu hỏi: NestJS la gi?',
      });
    });
  });
});
