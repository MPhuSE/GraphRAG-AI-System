import { ConfigService } from '@nestjs/config';
import { AiServiceService } from './ai-service.service';

describe('AiServiceService', () => {
  let aiServiceService: AiServiceService;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    aiServiceService = new AiServiceService(
      new ConfigService({
        OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
        OLLAMA_MODEL: 'llama3:latest',
        OLLAMA_TIMEOUT_MS: 120000,
        OLLAMA_TEMPERATURE: 0.2,
        OLLAMA_NUM_PREDICT: 128,
        KNOWLEDGE_SERVICE_BASE_URL: 'http://127.0.0.1:3001',
        KNOWLEDGE_TOP_K: 4,
      }),
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return a fallback message for blank questions', async () => {
    await expect(aiServiceService.askQuestion('   ')).resolves.toEqual({
      answer: 'Vui long nhap cau hoi.',
      sources: [],
      grounded: false,
      retrievalStrategy: 'none',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should return an insufficient-context response when retrieval returns no chunks', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        strategy: 'vector+keyword+graph-rerank',
        relatedConcepts: [],
        chunks: [],
        sources: [],
      }),
    });

    await expect(aiServiceService.askQuestion('DDD la gi?')).resolves.toEqual({
      answer:
        'Minh chua tim thay ngu canh du manh trong kho tri thuc Software Engineering de tra loi chac chan cau hoi nay.',
      sources: [],
      grounded: false,
      retrievalStrategy: 'vector+keyword+graph-rerank',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should retrieve context then return the trimmed Ollama response with sources', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          strategy: 'vector+keyword+graph-rerank',
          relatedConcepts: ['unit test PART_OF software testing'],
          chunks: [
            {
              chunkId: 'chunk-1',
              title: 'Software Testing Strategy',
              source: 'SE Handbook',
              topic: 'software-testing',
              content: 'Unit tests check small isolated pieces of behavior.',
              score: 0.92,
            },
          ],
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
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          response: ' Cau tra loi tu LLaMA. ',
        }),
      });

    await expect(
      aiServiceService.askQuestion('Unit test dung de lam gi?'),
    ).resolves.toEqual({
      answer: 'Cau tra loi tu LLaMA.',
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
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://127.0.0.1:3001/knowledge/retrieve',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"query":"Unit test dung de lam gi?"'),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://127.0.0.1:11434/api/generate',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Ngu canh truy xuat:'),
      }),
    );
  });

  it('should surface knowledge retrieval HTTP errors', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValue({
        message: 'knowledge service unavailable',
      }),
    });

    await expect(aiServiceService.askQuestion('test')).rejects.toThrow(
      'knowledge service unavailable',
    );
  });

  it('should fail when Ollama returns no text', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          strategy: 'vector+keyword+graph-rerank',
          relatedConcepts: [],
          chunks: [
            {
              chunkId: 'chunk-1',
              title: 'Code Review and Maintainability',
              source: 'SE Handbook',
              topic: 'maintainability',
              content: 'Code review is a quality gate and a learning mechanism.',
              score: 0.88,
            },
          ],
          sources: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      });

    await expect(aiServiceService.askQuestion('test')).rejects.toThrow(
      'Ollama returned an empty response',
    );
  });
});
