/**
 * Import Questions from Excel File
 *
 * This script allows bulk import of questions from an Excel file.
 * Excel format:
 * | Question Text | Question Type | Is Required | Max Length | Order |
 * |---------------|---------------|-------------|------------|-------|
 * | שאלה 1...     | YES_NO        | TRUE        | -          | 1     |
 * | שאלה 2...     | TEXT          | TRUE        | 500        | 2     |
 *
 * Usage:
 * npx tsx scripts/import-questions-from-excel.ts <questionnaire-id> <excel-file-path>
 *
 * Example:
 * npx tsx scripts/import-questions-from-excel.ts 1 ./questions.xlsx
 */

import * as XLSX from 'xlsx';
import { prismaQuestionnaire } from '../lib/prisma-questionnaire';

interface ExcelQuestionRow {
  'Question Text'?: string;
  'Question Type'?: string;
  'Is Required'?: string | boolean;
  'Max Length'?: string | number;
  'Order'?: string | number;
}

interface ParsedQuestion {
  questionText: string;
  questionType: 'YES_NO' | 'TEXT' | 'LONG_TEXT';
  isRequired: boolean;
  maxLength: number | null;
  orderIndex: number;
}

/**
 * Parse question type from Excel
 */
function parseQuestionType(value: string | undefined): 'YES_NO' | 'TEXT' | 'LONG_TEXT' {
  const normalized = value?.toUpperCase().trim();

  if (normalized === 'YES_NO' || normalized === 'YES/NO' || normalized === 'כן/לא') {
    return 'YES_NO';
  }

  if (normalized === 'TEXT' || normalized === 'SHORT' || normalized === 'קצר') {
    return 'TEXT';
  }

  if (normalized === 'LONG_TEXT' || normalized === 'LONG' || normalized === 'ארוך') {
    return 'LONG_TEXT';
  }

  // Default to TEXT if not recognized
  console.warn(`⚠️ Unrecognized question type "${value}", defaulting to TEXT`);
  return 'TEXT';
}

/**
 * Parse boolean from Excel
 */
function parseBoolean(value: string | boolean | undefined): boolean {
  if (typeof value === 'boolean') return value;
  if (!value) return true; // Default to required

  const normalized = value.toString().toUpperCase().trim();
  return normalized === 'TRUE' || normalized === 'כן' || normalized === '1' || normalized === 'YES';
}

/**
 * Parse max length from Excel
 */
function parseMaxLength(value: string | number | undefined): number | null {
  if (value === undefined || value === null || value === '' || value === '-') {
    return null;
  }

  const num = typeof value === 'number' ? value : parseInt(value.toString(), 10);
  return isNaN(num) ? null : num;
}

/**
 * Parse order index from Excel
 */
function parseOrderIndex(value: string | number | undefined, rowIndex: number): number {
  if (value === undefined || value === null || value === '') {
    return rowIndex;
  }

  const num = typeof value === 'number' ? value : parseInt(value.toString(), 10);
  return isNaN(num) ? rowIndex : num;
}

/**
 * Validate parsed question
 */
function validateQuestion(question: ParsedQuestion, rowIndex: number): string | null {
  if (!question.questionText || question.questionText.trim().length < 10) {
    return `שורה ${rowIndex}: נוסח השאלה חייב להכיל לפחות 10 תווים`;
  }

  if (question.questionText.length > 1000) {
    return `שורה ${rowIndex}: נוסח השאלה לא יכול לעלות על 1000 תווים`;
  }

  if (question.maxLength !== null && question.maxLength < 1) {
    return `שורה ${rowIndex}: אורך מקסימלי חייב להיות חיובי`;
  }

  if (question.maxLength !== null && question.maxLength > 5000) {
    return `שורה ${rowIndex}: אורך מקסימלי לא יכול לעלות על 5000 תווים`;
  }

  if (question.orderIndex < 0) {
    return `שורה ${rowIndex}: מספר סידורי חייב להיות אפס או חיובי`;
  }

  return null; // Valid
}

/**
 * Read and parse Excel file
 */
function readExcelFile(filePath: string): ParsedQuestion[] {
  console.log(`📂 קורא קובץ Excel: ${filePath}`);

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error('הקובץ אינו מכיל גליונות');
  }

  console.log(`📄 מעבד גליון: ${sheetName}`);

  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<ExcelQuestionRow>(worksheet, {
    defval: '',
  });

  if (rows.length === 0) {
    throw new Error('הגליון אינו מכיל שורות נתונים');
  }

  console.log(`📊 נמצאו ${rows.length} שורות`);

  const parsedQuestions: ParsedQuestion[] = [];
  const errors: string[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because Excel is 1-indexed and row 1 is header

    try {
      const question: ParsedQuestion = {
        questionText: row['Question Text']?.toString().trim() || '',
        questionType: parseQuestionType(row['Question Type']?.toString()),
        isRequired: parseBoolean(row['Is Required']),
        maxLength: parseMaxLength(row['Max Length']),
        orderIndex: parseOrderIndex(row['Order'], index),
      };

      const validationError = validateQuestion(question, rowNumber);
      if (validationError) {
        errors.push(validationError);
      } else {
        parsedQuestions.push(question);
      }
    } catch (error) {
      errors.push(`שורה ${rowNumber}: שגיאה בעיבוד - ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  if (errors.length > 0) {
    console.error('\n❌ שגיאות בעיבוד הקובץ:');
    errors.forEach((err) => console.error(`   ${err}`));
    throw new Error(`${errors.length} שגיאות נמצאו בקובץ`);
  }

  console.log(`✅ ${parsedQuestions.length} שאלות עברו תיקוף`);
  return parsedQuestions;
}

/**
 * Import questions to database
 */
async function importQuestions(questionnaireId: number, questions: ParsedQuestion[]) {
  console.log(`\n💾 מייבא שאלות לשאלון מספר ${questionnaireId}...`);

  // Verify questionnaire exists
  const questionnaire = await prismaQuestionnaire.questionnaire.findUnique({
    where: { id: questionnaireId },
    include: { _count: { select: { questions: true } } },
  });

  if (!questionnaire) {
    throw new Error(`שאלון מספר ${questionnaireId} לא נמצא במסד הנתונים`);
  }

  console.log(`📋 שאלון: "${questionnaire.title}"`);
  console.log(`📊 שאלות קיימות: ${questionnaire._count.questions}`);

  // Import questions in transaction
  const createdQuestions = await prismaQuestionnaire.$transaction(
    questions.map((q) =>
      prismaQuestionnaire.question.create({
        data: {
          questionnaireId,
          questionText: q.questionText,
          questionType: q.questionType,
          isRequired: q.isRequired,
          maxLength: q.maxLength,
          orderIndex: q.orderIndex,
        },
      })
    )
  );

  console.log(`\n✅ ${createdQuestions.length} שאלות נוספו בהצלחה!`);

  // Show summary
  const byType = createdQuestions.reduce(
    (acc, q) => {
      acc[q.questionType] = (acc[q.questionType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  console.log('\n📊 סיכום לפי סוג:');
  console.log(`   כן/לא (YES_NO): ${byType.YES_NO || 0}`);
  console.log(`   תשובה קצרה (TEXT): ${byType.TEXT || 0}`);
  console.log(`   תשובה ארוכה (LONG_TEXT): ${byType.LONG_TEXT || 0}`);

  return createdQuestions;
}

/**
 * Generate Excel template
 */
function generateTemplate(outputPath: string) {
  console.log(`📝 יוצר תבנית Excel: ${outputPath}`);

  const templateData = [
    {
      'Question Text': 'האם אתה תומך בחוק הגיוס?',
      'Question Type': 'YES_NO',
      'Is Required': 'TRUE',
      'Max Length': '-',
      'Order': 1,
    },
    {
      'Question Text': 'מה דעתך על החוק?',
      'Question Type': 'TEXT',
      'Is Required': 'TRUE',
      'Max Length': 500,
      'Order': 2,
    },
    {
      'Question Text': 'הסבר את עמדתך בפירוט',
      'Question Type': 'LONG_TEXT',
      'Is Required': 'FALSE',
      'Max Length': 2000,
      'Order': 3,
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 50 }, // Question Text
    { wch: 15 }, // Question Type
    { wch: 12 }, // Is Required
    { wch: 12 }, // Max Length
    { wch: 8 },  // Order
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');

  XLSX.writeFile(workbook, outputPath);

  console.log('✅ תבנית נוצרה בהצלחה!');
  console.log('\nהוראות:');
  console.log('1. פתח את הקובץ ב-Excel');
  console.log('2. מלא את השאלות (שמור על שמות העמודות)');
  console.log('3. Question Type יכול להיות: YES_NO, TEXT, LONG_TEXT');
  console.log('4. Is Required יכול להיות: TRUE, FALSE');
  console.log('5. Max Length: מספר או - לברירת מחדל');
  console.log('6. Order: מספר סידורי (אוטומטי אם ריק)');
  console.log('\nשמור את הקובץ והרץ:');
  console.log(`npx tsx scripts/import-questions-from-excel.ts <questionnaire-id> ${outputPath}`);
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  // Check for --template flag
  if (args[0] === '--template' || args[0] === '-t') {
    const outputPath = args[1] || './question-template.xlsx';
    generateTemplate(outputPath);
    return;
  }

  // Import mode
  if (args.length < 2) {
    console.error('❌ שגיאה: חסרים פרמטרים');
    console.log('\nשימוש:');
    console.log('  npx tsx scripts/import-questions-from-excel.ts <questionnaire-id> <excel-file>');
    console.log('\nדוגמה:');
    console.log('  npx tsx scripts/import-questions-from-excel.ts 1 ./questions.xlsx');
    console.log('\nלייצור תבנית:');
    console.log('  npx tsx scripts/import-questions-from-excel.ts --template [output-path]');
    process.exit(1);
  }

  const questionnaireId = parseInt(args[0], 10);
  const excelFilePath = args[1];

  if (isNaN(questionnaireId) || questionnaireId < 1) {
    console.error('❌ שגיאה: מזהה שאלון חייב להיות מספר חיובי');
    process.exit(1);
  }

  try {
    // Read and parse Excel file
    const questions = readExcelFile(excelFilePath);

    // Import to database
    await importQuestions(questionnaireId, questions);

    console.log('\n🎉 הייבוא הושלם בהצלחה!');
  } catch (error) {
    console.error('\n❌ שגיאה בייבוא:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await prismaQuestionnaire.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { readExcelFile, importQuestions, generateTemplate };
