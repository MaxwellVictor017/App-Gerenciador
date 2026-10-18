import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import ws from 'ws';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('A variável de ambiente DATABASE_URL não foi configurada.');
}

function createPrismaClient(): PrismaClient {
  const isNeon = connectionString?.includes('neon.tech');

  if (isNeon) {
    // Configura WebSocket para Neon Serverless em ambiente Node.js
    neonConfig.webSocketConstructor = ws;
    const pool = new NeonPool({ connectionString });
    const adapter = new PrismaNeon(pool);
    return new PrismaClient({ adapter });
  }

  // Conexão nativa do Prisma para PostgreSQL local ou servidores dedicados
  return new PrismaClient();
}

// Instância Singleton do PrismaClient
export const prisma = createPrismaClient();
