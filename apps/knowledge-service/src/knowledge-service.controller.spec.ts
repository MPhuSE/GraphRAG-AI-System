import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { KnowledgeServiceController } from './knowledge-service.controller';
import { KnowledgeServiceService } from './knowledge-service.service';

describe('KnowledgeServiceController', () => {
  let knowledgeServiceController: KnowledgeServiceController;
  const mockKnowledgeService = {
    checkDatabaseConnections: jest.fn(),
  };

  beforeEach(async () => {
    mockKnowledgeService.checkDatabaseConnections.mockReset();

    const app: TestingModule = await Test.createTestingModule({
      controllers: [KnowledgeServiceController],
      providers: [
        {
          provide: KnowledgeServiceService,
          useValue: mockKnowledgeService,
        },
      ],
    }).compile();

    knowledgeServiceController = app.get<KnowledgeServiceController>(
      KnowledgeServiceController,
    );
  });

  describe('checkDatabaseConnections', () => {
    it('should return the health payload when all databases are reachable', async () => {
      const healthyResult = {
        status: 'ok',
        neo4j: { status: 'ok', queryResult: 1 },
        chroma: { status: 'ok', heartbeat: 123 },
      };

      mockKnowledgeService.checkDatabaseConnections.mockResolvedValue(healthyResult);

      await expect(
        knowledgeServiceController.checkDatabaseConnections(),
      ).resolves.toEqual(healthyResult);
    });

    it('should throw 503 when at least one database check fails', async () => {
      const unhealthyResult = {
        status: 'error',
        neo4j: { status: 'error', message: 'Neo4j unavailable' },
        chroma: { status: 'ok', heartbeat: 123 },
      };

      mockKnowledgeService.checkDatabaseConnections.mockResolvedValue(unhealthyResult);

      await expect(
        knowledgeServiceController.checkDatabaseConnections(),
      ).rejects.toThrow(ServiceUnavailableException);
      await expect(
        knowledgeServiceController.checkDatabaseConnections(),
      ).rejects.toMatchObject({
        response: unhealthyResult,
        status: 503,
      });
    });
  });
});
