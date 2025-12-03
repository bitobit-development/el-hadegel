import { prismaQuestionnaire } from '../lib/prisma-questionnaire';

async function viewQuestionnaireDetails() {
  try {
    const questionnaire = await prismaQuestionnaire.questionnaire.findUnique({
      where: { id: 2 },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
        responses: {
          include: {
            answers: {
              include: {
                question: true,
              },
            },
          },
        },
      },
    });

    if (!questionnaire) {
      console.log('Questionnaire not found');
      return;
    }

    console.log('Questionnaire Details:');
    console.log(`Title: ${questionnaire.title}`);
    console.log(`ID: ${questionnaire.id}`);
    console.log(`Active: ${questionnaire.isActive}`);
    console.log(`\nQuestions (${questionnaire.questions.length}):`);

    questionnaire.questions.forEach((q, idx) => {
      console.log(`\n${idx + 1}. [Order ${q.orderIndex}] ${q.questionText}`);
      console.log(`   Type: ${q.questionType}`);
      console.log(`   Required: ${q.isRequired}`);
      console.log(`   Question ID: ${q.id}`);
    });

    console.log(`\n\nExisting Responses: ${questionnaire.responses.length}`);

    if (questionnaire.responses.length > 0) {
      console.log('\nSample response format:');
      const sampleResponse = questionnaire.responses[0];
      console.log(`- Full Name: ${sampleResponse.fullName}`);
      console.log(`- Phone: ${sampleResponse.phoneNumber}`);
      console.log(`- Email: ${sampleResponse.email}`);
      console.log(`- Submitted At: ${sampleResponse.submittedAt}`);
      console.log('- Answers:');
      sampleResponse.answers.forEach((answer) => {
        console.log(
          `  Q${answer.question.orderIndex}: ${
            answer.answer !== null ? (answer.answer ? 'כן' : 'לא') : answer.textAnswer
          }`
        );
      });
    }

    await prismaQuestionnaire.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prismaQuestionnaire.$disconnect();
    process.exit(1);
  }
}

viewQuestionnaireDetails();
