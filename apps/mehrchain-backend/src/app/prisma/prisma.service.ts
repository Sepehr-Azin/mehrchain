import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    if (process.env['NODE_ENV'] === 'production') {
      try {
        // Read no account data. Refuse to serve the new contract against a
        // database missing the calendar/lifecycle columns in this revision.
        await this.$queryRaw`SELECT "timeZone" FROM "users" LIMIT 0`;
        await this.$queryRaw`SELECT "dayKey", "timeZone" FROM "commitment_logs" LIMIT 0`;
        await this.$queryRaw`SELECT "inactivityAnchorAt" FROM "commitments" LIMIT 0`;
      } catch {
        await this.$disconnect();
        throw new Error(
          'Database readiness check failed. Verify DATABASE_URL and apply the reviewed release migrations before deployment; see docs/database_migration_procedure.md.',
        );
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
