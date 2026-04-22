import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { ApiGatewayController } from './api-gateway.controller';

describe('ApiGatewayController', () => {
  let apiGatewayController: ApiGatewayController;
  const askQuestionMock = jest.fn();
  const mockClient = {
    getService: jest.fn().mockImplementation(() => ({
      AskQuestion: askQuestionMock,
    })),
  };

  beforeEach(async () => {
    askQuestionMock.mockReset();
    mockClient.getService.mockClear();
    askQuestionMock.mockImplementation(({ question }: { question: string }) =>
      of({
        answer: `AI da nhan duoc cau hoi: ${question}`,
        sources: [],
        grounded: false,
        retrievalStrategy: 'vector+keyword+graph-rerank',
      }),
    );

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
          answer: 'AI da nhan duoc cau hoi: GraphRAG',
          sources: [],
          grounded: false,
          retrievalStrategy: 'vector+keyword+graph-rerank',
        });
        done();
      });
    });

    it('should map gRPC timeout errors to HTTP 504', (done) => {
      askQuestionMock.mockImplementation(() =>
        throwError(() => ({
          code: 4,
          details: 'Ollama request timed out after 120000ms',
        })),
      );

      apiGatewayController.getHello('GraphRAG').subscribe({
        next: () => done.fail('Expected an error'),
        error: (error) => {
          expect(error).toMatchObject({
            status: 504,
            response: {
              message: 'Ollama request timed out after 120000ms',
            },
          });
          done();
        },
      });
    });
  });
});
