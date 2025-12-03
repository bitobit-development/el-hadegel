#!/usr/bin/env tsx

import prisma from '../lib/prisma';

async function queryMKs() {
  const mks = await prisma.mK.findMany({
    where: {
      faction: {
        in: ['הליכוד', 'התאחדות הספרדים שומרי תורה', 'יהדות התורה', 'הציונות הדתית', 'עוצמה יהודית', 'נעם - בראשות אבי מעוז']
      }
    },
    select: { id: true, nameHe: true, faction: true },
    orderBy: { id: 'asc' },
    take: 10
  });

  console.log('Sample Coalition MKs (first 10):');
  console.log(JSON.stringify(mks, null, 2));

  const count = await prisma.mK.count({
    where: {
      faction: {
        in: ['הליכוד', 'התאחדות הספרדים שומרי תורה', 'יהדות התורה', 'הציונות הדתית', 'עוצמה יהודית', 'נעם - בראשות אבי מעוז']
      }
    }
  });

  console.log(`\nTotal coalition MKs: ${count}`);

  await prisma.$disconnect();
}

queryMKs().catch(console.error);
