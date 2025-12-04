/**
 * Clear Invalid Photo URLs Script (Simple Version)
 *
 * Issue: Only Avi Dichter's image (MK 771) loads successfully.
 * All other 119 MK images return 404 from fs.knesset.gov.il
 *
 * Solution: Set photoUrl to NULL for ALL MKs, allowing initials fallback.
 * (If we need images in the future, we can scrape them properly or find a different source)
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from project root
config({ path: resolve(process.cwd(), '.env') });

import { PrismaClient } from '@prisma/client';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function clearAllPhotoUrls() {
  console.log('🔍 Clearing all MK photoUrl values...\n');

  try {
    const result = await prisma.mK.updateMany({
      where: {
        photoUrl: {
          not: null,
        },
      },
      data: {
        photoUrl: null,
      },
    });

    console.log(`✅ Cleared photoUrl for ${result.count} MKs`);
    console.log('\n✨ All MK cards will now display initials fallback');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllPhotoUrls();
