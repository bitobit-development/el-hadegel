/**
 * Separate Prisma Client for Questionnaire Database
 *
 * This client is completely isolated from the main database (lib/prisma.ts).
 * It connects to a separate Neon Postgres database using DATABASE_URL_QUESTIONNAIRE.
 *
 * Tables in this database:
 * - Questionnaire
 * - Question
 * - QuestionnaireResponse
 * - ResponseAnswer
 *
 * NO tables from main database (MK, LawDocument, etc.) are accessible here.
 *
 * Database Endpoints:
 * - Main DB: ep-quiet-truth-ah8me5gh (existing data)
 * - Questionnaire DB: ep-fancy-wave-ahtkrogj (separate, isolated)
 */

import { PrismaClient as QuestionnaireClient } from '../node_modules/.prisma/questionnaire-client';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

// Configure WebSocket for Neon (required for serverless)
neonConfig.webSocketConstructor = ws;

declare global {
  // eslint-disable-next-line no-var
  var prismaQuestionnaire: QuestionnaireClient | undefined;
}

// Singleton pattern for Prisma client with Neon adapter
const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL_QUESTIONNAIRE;

  if (!connectionString) {
    throw new Error('DATABASE_URL_QUESTIONNAIRE environment variable is not set');
  }

  // Create Prisma adapter for Neon with questionnaire connection string
  const adapter = new PrismaNeon({ connectionString });

  // Return Prisma client with Neon adapter
  return new QuestionnaireClient({ adapter });
};

export const prismaQuestionnaire =
  globalThis.prismaQuestionnaire || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaQuestionnaire = prismaQuestionnaire;
}

/**
 * Graceful shutdown
 */
export async function disconnectQuestionnaire() {
  await prismaQuestionnaire.$disconnect();
}

/**
 * Health check for questionnaire database
 */
export async function checkQuestionnaireDbHealth(): Promise<boolean> {
  try {
    await prismaQuestionnaire.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Questionnaire database health check failed:', error);
    return false;
  }
}
