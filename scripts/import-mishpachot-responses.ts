/**
 * Import Mishpachot L'Ma'an Giyus Responses from CSV
 *
 * Maps CSV columns to questionnaire responses for "משפחות למען גיוס"
 *
 * CSV Structure:
 * 1. Name_Hebrew - Full name
 * 2. Phone - Phone number
 * 3. מספר מילים על עצמי - Long text about themselves
 * 4. האם אני מוכן לחתום על המכתב שפורסם בקבוצה - Sign letter (Yes/No)
 * 5. האם אסכים להתראיין בתקשורת בנושא - Media interview (Yes/No/Conditional)
 * 6. האם אסכים להתראיין בתקשורת בנושא - טקסט נוסף - Additional text
 *
 * Usage:
 * npx tsx scripts/import-mishpachot-responses.ts <csv-file-path> [--dry-run]
 *
 * Example:
 * npx tsx scripts/import-mishpachot-responses.ts ./contacts.csv --dry-run
 * npx tsx scripts/import-mishpachot-responses.ts ./contacts.csv
 */

import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import { prismaQuestionnaire } from '../lib/prisma-questionnaire';

// Questionnaire configuration
const QUESTIONNAIRE_ID = 2;
const QUESTIONNAIRE_TITLE = 'משפחות למען גיוס';

// Question IDs (from database)
const QUESTION_IDS = {
  ABOUT_SELF: 8,        // מספר מילים על עצמי (LONG_TEXT, Order 0)
  MEDIA_INTERVIEW: 10,  // האם אסכים להתראיין בתקשורת (YES_NO with explanation, Order 1)
  SIGN_LETTER: 9,       // האם אני מוכן לחתום על המכתב (YES_NO, Order 2)
};

interface CSVRow {
  Name_Hebrew: string;
  Phone: string;
  'מספר מילים על עצמי': string;
  'האם אני מוכן לחתום על המכתב שפורסם בקבוצה': string;
  'האם אסכים להתראיין בתקשורת בנושא': string;
  'האם אסכים להתראיין בתקשורת בנושא - טקסט נוסף': string;
}

interface ParsedResponse {
  fullName: string;
  phoneNumber: string;
  email: string;
  aboutSelf: string;
  signLetter: boolean | null;
  mediaInterview: boolean | null;
  mediaInterviewText: string;
}

interface ValidationError {
  row: number;
  name: string;
  errors: string[];
}

/**
 * Parse Yes/No answer with Hebrew support
 */
function parseYesNo(value: string): boolean | null {
  if (!value || !value.trim()) return null;

  const normalized = value.trim().toLowerCase();

  // Yes values
  if (normalized === 'כן' || normalized === 'yes' || normalized === 'true') {
    return true;
  }

  // No values
  if (normalized === 'לא' || normalized === 'no' || normalized === 'false') {
    return false;
  }

  // Conditional/maybe values - map to null (will be stored in explanation text)
  if (
    normalized === 'מותנה' ||
    normalized === 'אפשרי' ||
    normalized === 'אולי' ||
    normalized.includes('תלוי')
  ) {
    return null;
  }

  // Unknown value - log warning and return null
  console.warn(`⚠️ Unknown Yes/No value: "${value}" - treating as null`);
  return null;
}

/**
 * Validate and normalize Israeli phone number
 */
function validatePhoneNumber(phone: string): string | null {
  if (!phone) return null;

  const cleaned = phone.replace(/[\s-]/g, '');

  // Israeli mobile format: 05X-XXX-XXXX (10 digits)
  const israeliMobile10Digits = /^(05\d{8})$/;

  // Israeli mobile format without leading 0: 5X-XXX-XXXX (9 digits)
  const israeliMobile9Digits = /^(5\d{8})$/;

  if (israeliMobile10Digits.test(cleaned)) {
    return cleaned;
  }

  // Add leading zero if 9 digits starting with 5
  if (israeliMobile9Digits.test(cleaned)) {
    return '0' + cleaned;
  }

  return null;
}

/**
 * Generate email from phone number
 */
function generateEmail(phone: string): string {
  return `${phone}@import.mishpachot.local`;
}

/**
 * Generate placeholder phone number for missing phones
 */
function generatePlaceholderPhone(index: number): string {
  // Format: 0999999001, 0999999002, etc.
  const placeholder = 999999000 + index;
  return `0${placeholder}`;
}

/**
 * Parse and validate CSV row
 */
function parseRow(
  row: CSVRow,
  index: number,
  placeholderCounter: { count: number }
): { data: ParsedResponse | null; errors: string[] } {
  const errors: string[] = [];

  // Validate name
  const fullName = row.Name_Hebrew?.trim();
  if (!fullName || fullName.length < 2) {
    errors.push('שם חייב להכיל לפחות 2 תווים');
  }

  // Validate and format phone
  const rawPhone = row.Phone?.trim();
  let phoneNumber = validatePhoneNumber(rawPhone);

  // Generate placeholder if phone is missing
  if (!phoneNumber) {
    placeholderCounter.count++;
    phoneNumber = generatePlaceholderPhone(placeholderCounter.count);
    console.log(`   📞 [שורה ${index}] ${fullName}: נוצר מספר טלפון מציין - ${phoneNumber}`);
  }

  // Parse answers
  const aboutSelf = row['מספר מילים על עצמי']?.trim() || '';
  const signLetter = parseYesNo(row['האם אני מוכן לחתום על המכתב שפורסם בקבוצה']);
  const mediaInterview = parseYesNo(row['האם אסכים להתראיין בתקשורת בנושא']);
  const mediaInterviewText = row['האם אסכים להתראיין בתקשורת בנושא - טקסט נוסף']?.trim() || '';

  // Validate text length
  if (aboutSelf && aboutSelf.length > 500) {
    errors.push(`"מספר מילים על עצמי" חורג מ-500 תווים (${aboutSelf.length} תווים)`);
  }

  if (errors.length > 0) {
    return { data: null, errors };
  }

  return {
    data: {
      fullName,
      phoneNumber: phoneNumber, // Now always has a value (real or placeholder)
      email: generateEmail(phoneNumber),
      aboutSelf,
      signLetter,
      mediaInterview,
      mediaInterviewText,
    },
    errors: [],
  };
}

/**
 * Read and parse CSV file
 */
function readCSV(filePath: string): CSVRow[] {
  console.log(`📂 קורא קובץ CSV: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`קובץ לא נמצא: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  // Remove BOM if present
  const cleanContent = content.replace(/^\uFEFF/, '');

  const records = parse(cleanContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });

  console.log(`📊 נמצאו ${records.length} שורות`);

  return records;
}

/**
 * Import responses to database
 */
async function importResponses(
  responses: ParsedResponse[],
  dryRun: boolean = false
): Promise<void> {
  if (dryRun) {
    console.log('\n🔍 DRY RUN MODE - לא מבצע שינויים במסד הנתונים\n');
  } else {
    console.log('\n💾 מייבא תשובות למסד הנתונים...\n');
  }

  // Verify questionnaire exists
  const questionnaire = await prismaQuestionnaire.questionnaire.findUnique({
    where: { id: QUESTIONNAIRE_ID },
    include: {
      questions: true,
      _count: { select: { responses: true } },
    },
  });

  if (!questionnaire) {
    throw new Error(`שאלון מספר ${QUESTIONNAIRE_ID} לא נמצא`);
  }

  console.log(`📋 שאלון: "${questionnaire.title}"`);
  console.log(`📊 תשובות קיימות: ${questionnaire._count.responses}`);
  console.log(`❓ שאלות: ${questionnaire.questions.length}`);

  // Verify question IDs
  const questionIds = questionnaire.questions.map((q) => q.id);
  const missingQuestions = Object.values(QUESTION_IDS).filter((id) => !questionIds.includes(id));

  if (missingQuestions.length > 0) {
    throw new Error(
      `שאלות חסרות במסד הנתונים: ${missingQuestions.join(', ')}\n` +
        `שאלות קיימות: ${questionIds.join(', ')}`
    );
  }

  if (dryRun) {
    console.log('\n✅ תיקוף עבר בהצלחה!');
    console.log(`\n📝 היו מיובאים ${responses.length} תשובות (DRY RUN - לא בוצע ייבוא)`);
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const [index, responseData] of responses.entries()) {
    try {
      await prismaQuestionnaire.$transaction(async (tx) => {
        // Create response
        const response = await tx.questionnaireResponse.create({
          data: {
            questionnaireId: QUESTIONNAIRE_ID,
            fullName: responseData.fullName,
            phoneNumber: responseData.phoneNumber,
            email: responseData.email,
            ipAddress: 'CSV_IMPORT',
            userAgent: 'CSV Import Script',
          },
        });

        // Create answers
        const answers = [];

        // Q8: About self (LONG_TEXT)
        if (responseData.aboutSelf) {
          answers.push(
            tx.responseAnswer.create({
              data: {
                responseId: response.id,
                questionId: QUESTION_IDS.ABOUT_SELF,
                textAnswer: responseData.aboutSelf,
              },
            })
          );
        }

        // Q10: Media interview (YES_NO with explanation)
        answers.push(
          tx.responseAnswer.create({
            data: {
              responseId: response.id,
              questionId: QUESTION_IDS.MEDIA_INTERVIEW,
              answer: responseData.mediaInterview,
              explanationText: responseData.mediaInterviewText || null,
            },
          })
        );

        // Q9: Sign letter (YES_NO)
        answers.push(
          tx.responseAnswer.create({
            data: {
              responseId: response.id,
              questionId: QUESTION_IDS.SIGN_LETTER,
              answer: responseData.signLetter,
            },
          })
        );

        await Promise.all(answers);
      });

      successCount++;
      console.log(`   ✓ [${index + 1}/${responses.length}] ${responseData.fullName}`);
    } catch (error) {
      errorCount++;
      console.error(
        `   ✗ [${index + 1}/${responses.length}] ${responseData.fullName}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  console.log(`\n✅ ייבוא הושלם!`);
  console.log(`   הצלחות: ${successCount}`);
  console.log(`   שגיאות: ${errorCount}`);
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log('שימוש:');
    console.log('  npx tsx scripts/import-mishpachot-responses.ts <csv-file> [--dry-run]');
    console.log('\nדוגמאות:');
    console.log('  npx tsx scripts/import-mishpachot-responses.ts ./contacts.csv --dry-run');
    console.log('  npx tsx scripts/import-mishpachot-responses.ts ./contacts.csv');
    process.exit(0);
  }

  const csvFilePath = args[0];
  const dryRun = args.includes('--dry-run');

  try {
    // Read CSV
    const rows = readCSV(csvFilePath);

    // Parse and validate
    console.log('\n🔍 מאמת נתונים...\n');

    const parsedResponses: ParsedResponse[] = [];
    const validationErrors: ValidationError[] = [];
    const placeholderCounter = { count: 0 };

    rows.forEach((row, index) => {
      const { data, errors } = parseRow(row, index + 2, placeholderCounter); // +2 for 1-indexed + header row

      if (errors.length > 0) {
        validationErrors.push({
          row: index + 2,
          name: row.Name_Hebrew || 'לא ידוע',
          errors,
        });
      } else if (data) {
        parsedResponses.push(data);
      }
    });

    // Report validation errors
    if (validationErrors.length > 0) {
      console.error('\n❌ שגיאות בתיקוף:\n');
      validationErrors.forEach((err) => {
        console.error(`שורה ${err.row} (${err.name}):`);
        err.errors.forEach((e) => console.error(`   - ${e}`));
      });
      console.error(`\n${validationErrors.length} שורות נכשלו בתיקוף`);

      if (parsedResponses.length === 0) {
        throw new Error('אין שורות תקינות לייבוא');
      }

      console.log(`\n⚠️ ${parsedResponses.length} שורות תקינות ימשיכו לייבוא`);
    } else {
      console.log(`✅ כל ${parsedResponses.length} השורות תקינות`);
    }

    // Show placeholder phone summary
    if (placeholderCounter.count > 0) {
      console.log(`\n📞 נוצרו ${placeholderCounter.count} מספרי טלפון מציינים לשורות ללא מספר`);
    }

    // Import responses
    await importResponses(parsedResponses, dryRun);

    console.log('\n🎉 סיום!');
  } catch (error) {
    console.error('\n❌ שגיאה:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await prismaQuestionnaire.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { parseRow, readCSV, importResponses, generatePlaceholderPhone };
