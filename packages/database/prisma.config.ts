import path from 'node:path';
import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

const workspaceRoot = path.resolve(__dirname, '../..');

dotenv.config({ path: path.join(workspaceRoot, '.env') });

export default defineConfig({
  schema: path.resolve(__dirname, 'prisma/schema.prisma'),
  migrations: {
    path: path.resolve(__dirname, 'prisma/migrations'),
  },
  datasource: {
    url: process.env['DATABASE_URL'] ?? '',
  },
});
