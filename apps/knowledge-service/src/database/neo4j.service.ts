import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver } from 'neo4j-driver';

@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  private driver!: Driver;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get('NEO4J_HOST');
    const port = this.configService.get('NEO4J_PORT');
    const user = this.configService.get('NEO4J_USERNAME');
    const pass = this.configService.get('NEO4J_PASSWORD');

    this.driver = neo4j.driver(
      `bolt://${host}:${port}`,
      neo4j.auth.basic(user, pass)
    );
  }

  async onModuleDestroy() {
    await this.driver?.close();
  }

  async executeQuery(cypher: string, params?: any) {
    const session = this.driver.session();
    try {
      const result = await session.run(cypher, params);
      return result.records;
    } finally {
      await session.close();
    }
  }

  async checkConnection() {
    await this.driver.verifyConnectivity();

    const records = await this.executeQuery('RETURN 1 AS ok');
    const result = records[0]?.get('ok');

    return {
      status: 'ok' as const,
      queryResult: result,
    };
  }
}
