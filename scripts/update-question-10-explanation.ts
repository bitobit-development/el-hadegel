import { prismaQuestionnaire } from '../lib/prisma-questionnaire';

async function updateQuestion10() {
  try {
    console.log('Updating Question ID 10 to enable text explanation...');

    // Check if question exists
    const question = await prismaQuestionnaire.question.findUnique({
      where: { id: 10 },
    });

    if (!question) {
      console.error('❌ Question ID 10 not found');
      await prismaQuestionnaire.$disconnect();
      process.exit(1);
    }

    console.log(`Found question: "${question.questionText}"`);
    console.log(`Current allowTextExplanation: ${question.allowTextExplanation}`);

    // Update the question
    const updated = await prismaQuestionnaire.question.update({
      where: { id: 10 },
      data: {
        allowTextExplanation: true,
        explanationLabel: 'הוסף הסבר (אופציונלי)',
        explanationMaxLength: 500,
      },
    });

    console.log('\n✅ Successfully updated Question ID 10:');
    console.log(`   - allowTextExplanation: ${updated.allowTextExplanation}`);
    console.log(`   - explanationLabel: ${updated.explanationLabel}`);
    console.log(`   - explanationMaxLength: ${updated.explanationMaxLength}`);

    await prismaQuestionnaire.$disconnect();
  } catch (error) {
    console.error('❌ Error updating question:', error);
    await prismaQuestionnaire.$disconnect();
    process.exit(1);
  }
}

updateQuestion10();
