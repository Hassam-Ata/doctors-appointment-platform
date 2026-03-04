import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from 'src/generated/prisma/client.js';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
