/**
 * Seed Test Questionnaire
 *
 * Creates a sample questionnaire with questions for testing
 *
 * Usage:
 * npx tsx scripts/seed-test-questionnaire.ts
 */

import { prismaQuestionnaire } from '../lib/prisma-questionnaire';

async function main() {
  console.log('🌱 Creating test questionnaire...\n');

  try {
    // Deactivate all existing questionnaires
    await prismaQuestionnaire.questionnaire.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create questionnaire
    const questionnaire = await prismaQuestionnaire.questionnaire.create({
      data: {
        title: 'שאלון דעת הקהל - תנועת אל-הדגל',
        description: 'עזרו לנו להבין את דעתכם על נושאים חשובים בחברה הישראלית',
        isActive: true,
      },
    });

    console.log(`✅ Created questionnaire: ${questionnaire.title}`);
    console.log(`   ID: ${questionnaire.id}`);

    // Create questions
    const questions = [
      {
        questionText: 'האם אתה תומך בחוק הגיוס במתכונתו הנוכחית?',
        questionType: 'YES_NO' as const,
        isRequired: true,
        maxLength: null,
        orderIndex: 0,
      },
      {
        questionText: 'מהי עמדתך לגבי שירות צבאי שווה לכל אזרחי ישראל?',
        questionType: 'YES_NO' as const,
        isRequired: true,
        maxLength: null,
        orderIndex: 1,
      },
      {
        questionText: 'איזה סוג של שירות לאומי היית מעדיף?',
        questionType: 'TEXT' as const,
        isRequired: false,
        maxLength: 500,
        orderIndex: 2,
      },
      {
        questionText: 'האם אתה מתנגד לשינויים בחוק?',
        questionType: 'YES_NO' as const,
        isRequired: true,
        maxLength: null,
        orderIndex: 3,
      },
      {
        questionText: 'הסבר את עמדתך בפירוט',
        questionType: 'LONG_TEXT' as const,
        isRequired: false,
        maxLength: 2000,
        orderIndex: 4,
      },
      {
        questionText: 'האם אתה מאמין ששיוויון בנטל הוא ערך חשוב?',
        questionType: 'YES_NO' as const,
        isRequired: true,
        maxLength: null,
        orderIndex: 5,
      },
      {
        questionText: 'מה לדעתך הפתרון הטוב ביותר?',
        questionType: 'TEXT' as const,
        isRequired: false,
        maxLength: 500,
        orderIndex: 6,
      },
    ];

    for (const questionData of questions) {
      const question = await prismaQuestionnaire.question.create({
        data: {
          questionnaireId: questionnaire.id,
          ...questionData,
        },
      });

      console.log(`   ✓ Question ${questionData.orderIndex + 1}: ${questionData.questionText.substring(0, 50)}...`);
    }

    console.log(`\n✅ Created ${questions.length} questions`);

    // Create some test responses
    console.log('\n🧪 Creating test responses...\n');

    const testResponses = [
      {
        fullName: 'דוד כהן',
        phoneNumber: '0501234567',
        email: 'david.cohen@example.com',
        answers: [
          { questionId: 1, answer: true },
          { questionId: 2, answer: true },
          { questionId: 3, textAnswer: 'שירות צבאי מלא' },
          { questionId: 4, answer: false },
          { questionId: 5, textAnswer: 'אני מאמין ששירות צבאי הוא חובה לכל אזרח ישראלי. זה מחזק את האחדות הלאומית.' },
          { questionId: 6, answer: true },
          { questionId: 7, textAnswer: 'גיוס הדרגתי עם תמריצים' },
        ],
      },
      {
        fullName: 'שרה לוי',
        phoneNumber: '0529876543',
        email: 'sarah.levi@example.com',
        answers: [
          { questionId: 1, answer: false },
          { questionId: 2, answer: true },
          { questionId: 4, answer: true },
          { questionId: 6, answer: true },
        ],
      },
      {
        fullName: 'משה אברהם',
        phoneNumber: '0547654321',
        email: 'moshe.a@example.com',
        answers: [
          { questionId: 1, answer: true },
          { questionId: 2, answer: false },
          { questionId: 3, textAnswer: 'שירות לאומי-אזרחי' },
          { questionId: 4, answer: false },
          { questionId: 5, textAnswer: 'יש למצוא פשרה שמכבדת את כל הציבורים' },
          { questionId: 6, answer: false },
          { questionId: 7, textAnswer: 'דיאלוג ופשרה' },
        ],
      },
    ];

    // Get the created question IDs
    const createdQuestions = await prismaQuestionnaire.question.findMany({
      where: { questionnaireId: questionnaire.id },
      orderBy: { orderIndex: 'asc' },
      select: { id: true, orderIndex: true },
    });

    const questionIdMap = new Map(createdQuestions.map(q => [q.orderIndex + 1, q.id]));

    for (const responseData of testResponses) {
      const response = await prismaQuestionnaire.questionnaireResponse.create({
        data: {
          questionnaireId: questionnaire.id,
          fullName: responseData.fullName,
          phoneNumber: responseData.phoneNumber,
          email: responseData.email,
          ipAddress: '127.0.0.1',
          userAgent: 'Test Script',
        },
      });

      // Create answers
      for (const answerData of responseData.answers) {
        const realQuestionId = questionIdMap.get(answerData.questionId);
        if (!realQuestionId) continue;

        await prismaQuestionnaire.responseAnswer.create({
          data: {
            responseId: response.id,
            questionId: realQuestionId,
            answer: 'answer' in answerData ? answerData.answer : null,
            textAnswer: 'textAnswer' in answerData ? answerData.textAnswer : null,
          },
        });
      }

      console.log(`   ✓ Response from: ${responseData.fullName}`);
    }

    console.log(`\n✅ Created ${testResponses.length} test responses`);

    console.log('\n🎉 Test questionnaire seeded successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Questionnaire ID: ${questionnaire.id}`);
    console.log(`   Title: ${questionnaire.title}`);
    console.log(`   Questions: ${questions.length}`);
    console.log(`   Test Responses: ${testResponses.length}`);
    console.log(`   Status: ${questionnaire.isActive ? 'Active ✓' : 'Inactive'}`);
    console.log('\n👉 You can now:');
    console.log('   1. Visit http://localhost:3000/questionnaire to fill the form');
    console.log('   2. Visit http://localhost:3000/admin/questionnaires to manage it');
    console.log('   3. Try importing questions from Excel with the template');

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await prismaQuestionnaire.$disconnect();
  }
}

main();
