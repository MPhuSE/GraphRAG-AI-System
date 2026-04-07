import { Test, TestingModule } from '@nestjs/testing';
import { ApiGatewayController } from './api-gateway.controller';
import { of } from 'rxjs';

describe('ApiGatewayController', () => {
  let apiGatewayController: ApiGatewayController;
  const mockClient = {
    getService: jest.fn().mockReturnValue({
      AskQuestion: jest
        .fn()
        .mockImplementation(({ question }: { question: string }) =>
          of({ answer: `AI đã nhận được câu hỏi: ${question}` }),
        ),
    }),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ApiGatewayController],
      providers: [
        {
          provide: 'AI_PACKAGE',
          useValue: mockClient,
        },
      ],
    }).compile();

    apiGatewayController = app.get<ApiGatewayController>(ApiGatewayController);
    apiGatewayController.onModuleInit();
  });

  describe('getHello', () => {
    it('should proxy the question to the AI service', (done) => {
      apiGatewayController.getHello('GraphRAG').subscribe((response) => {
        expect(response).toEqual({
          answer: 'AI đã nhận được câu hỏi: GraphRAG',
        });
        done();
      });
    });
  });
});
