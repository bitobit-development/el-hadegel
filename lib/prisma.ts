import { PrismaClient } from '@prisma/client';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

// Configure WebSocket for Neon (required for serverless)
neonConfig.webSocketConstructor = ws;

// Singleton pattern for Prisma client
const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Create Prisma adapter for Neon with connection string
  const adapter = new PrismaNeon(connectionString);

  // Return Prisma client with Neon adapter
  return new PrismaClient({ adapter });
};

// Global singleton instance (prevents multiple instances in development)
declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
