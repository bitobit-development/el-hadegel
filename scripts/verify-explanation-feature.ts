import { prismaQuestionnaire } from '../lib/prisma-questionnaire';

async function verifyExplanationFeature() {
  try {
    console.log('Verifying explanation feature implementation...\n');

    // Get Question ID 10 with all fields
    const question = await prismaQuestionnaire.question.findUnique({
      where: { id: 10 },
      select: {
        id: true,
        questionText: true,
        questionType: true,
        allowTextExplanation: true,
        explanationMaxLength: true,
        explanationLabel: true,
      },
    });

    if (!question) {
      console.error('❌ Question ID 10 not found');
      process.exit(1);
    }

    console.log('✅ Question ID 10 Details:');
    console.log(`   ID: ${question.id}`);
    console.log(`   Text: "${question.questionText}"`);
    console.log(`   Type: ${question.questionType}`);
    console.log(`   Allow Text Explanation: ${question.allowTextExplanation}`);
    console.log(`   Explanation Max Length: ${question.explanationMaxLength}`);
    console.log(`   Explanation Label: "${question.explanationLabel}"`);

    // Verify the feature is enabled
    if (question.allowTextExplanation === true) {
      console.log('\n✅ SUCCESS: Explanation feature is ENABLED for Question ID 10');
    } else {
      console.log('\n❌ ERROR: Explanation feature is NOT enabled for Question ID 10');
      process.exit(1);
    }

    // Check all questions in the questionnaire
    console.log('\n\nAll questions in questionnaire (ID: 2):');
    const allQuestions = await prismaQuestionnaire.question.findMany({
      where: { questionnaireId: 2 },
      orderBy: { orderIndex: 'asc' },
      select: {
        id: true,
        questionText: true,
        questionType: true,
        allowTextExplanation: true,
      },
    });

    allQuestions.forEach((q, idx) => {
      const hasExplanation = q.allowTextExplanation ? '✓' : '✗';
      console.log(`   ${idx + 1}. [Q${q.id}] ${q.questionText.substring(0, 50)}...`);
      console.log(`      Type: ${q.questionType} | Explanation: ${hasExplanation}`);
    });

    console.log('\n✅ All verifications passed!');
    await prismaQuestionnaire.$disconnect();
  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    await prismaQuestionnaire.$disconnect();
    process.exit(1);
  }
}

verifyExplanationFeature();
