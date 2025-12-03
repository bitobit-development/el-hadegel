#!/usr/bin/env tsx

import prisma from '../lib/prisma';

async function verifyImports() {
  // Count all historical comments
  const total = await prisma.historicalComment.count();
  console.log(`📊 Total Historical Comments: ${total}`);

  // Get the 3 most recent comments
  const recent = await prisma.historicalComment.findMany({
    take: 3,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      mkId: true,
      content: true,
      sourcePlatform: true,
      commentDate: true,
      isVerified: true,
      duplicateOf: true,
      createdAt: true,
      mk: {
        select: { nameHe: true }
      }
    }
  });

  console.log('\n📝 Most Recent 3 Comments:');
  recent.forEach(c => {
    console.log(`\nID: ${c.id}`);
    console.log(`MK: ${c.mk.nameHe} (ID: ${c.mkId})`);
    console.log(`Platform: ${c.sourcePlatform}`);
    console.log(`Content: ${c.content.substring(0, 80)}...`);
    console.log(`Date: ${c.commentDate}`);
    console.log(`Verified: ${c.isVerified ? '✅' : '❌'}`);
    console.log(`Duplicate: ${c.duplicateOf ? `Yes (of #${c.duplicateOf})` : 'No'}`);
    console.log(`Created: ${c.createdAt}`);
  });

  await prisma.$disconnect();
}

verifyImports().catch(console.error);
