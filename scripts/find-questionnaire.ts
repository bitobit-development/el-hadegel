import { prismaQuestionnaire } from '../lib/prisma-questionnaire';

async function findQuestionnaire() {
  try {
    const questionnaires = await prismaQuestionnaire.questionnaire.findMany({
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
        _count: {
          select: { responses: true },
        },
      },
    });

    console.log('All questionnaires:\n');
    questionnaires.forEach((q) => {
      console.log(`ID: ${q.id}`);
      console.log(`Title: ${q.title}`);
      console.log(`Description: ${q.description || 'N/A'}`);
      console.log(`Active: ${q.isActive}`);
      console.log(`Responses: ${q._count.responses}`);
      console.log(`Questions: ${q.questions.length}`);
      console.log('---\n');
    });

    await prismaQuestionnaire.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prismaQuestionnaire.$disconnect();
    process.exit(1);
  }
}

findQuestionnaire();
