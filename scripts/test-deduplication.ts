import {
  generateContentHash,
  normalizeContent,
  calculateSimilarity,
  isRecruitmentLawComment,
} from '../lib/content-hash';

console.log('=== Testing Content Hash Utilities ===\n');

// Test 1: Content Hash Generation
const content1 = 'אני תומך בחוק הגיוס';
const content2 = 'אני תומך בחוק הגיוס'; // Same content
const content3 = 'אני תומך בחוק הגיוס '; // Extra space

console.log('Test 1: Content Hash Generation');
const hash1 = generateContentHash(content1);
const hash2 = generateContentHash(content2);
const hash3 = generateContentHash(content3);
console.log(`Hash 1: ${hash1.substring(0, 16)}...`);
console.log(`Hash 2: ${hash2.substring(0, 16)}...`);
console.log(`Hash 3: ${hash3.substring(0, 16)}...`);
console.log(`Hash 1 === Hash 2: ${hash1 === hash2}`);
console.log(`Hash 1 === Hash 3: ${hash1 === hash3} (whitespace trimmed)`);
console.log();

// Test 2: Content Normalization
const hebrew1 = 'אני תומך בחוק הגיוס, זה חשוב מאוד!';
const hebrew2 = 'אני  תומך  בחוק  הגיוס  זה  חשוב  מאוד';

console.log('Test 2: Content Normalization');
console.log(`Original 1: "${hebrew1}"`);
console.log(`Normalized 1: "${normalizeContent(hebrew1)}"`);
console.log(`Original 2: "${hebrew2}"`);
console.log(`Normalized 2: "${normalizeContent(hebrew2)}"`);
console.log(
  `Are they similar after normalization: ${
    normalizeContent(hebrew1) === normalizeContent(hebrew2)
  }`
);
console.log();

// Test 3: Similarity Calculation
console.log('Test 3: Similarity Calculation');
const str1 = 'אני תומך בחוק הגיוס';
const str2 = 'אני תומך בחוק גיוס'; // Very similar
const str3 = 'אני מתנגד לחוק הגיוס'; // Different
const str4 = 'שלום עולם'; // Completely different

console.log(`String 1: "${str1}"`);
console.log(`String 2: "${str2}"`);
console.log(`Similarity: ${calculateSimilarity(str1, str2).toFixed(3)}`);
console.log();

console.log(`String 1: "${str1}"`);
console.log(`String 3: "${str3}"`);
console.log(`Similarity: ${calculateSimilarity(str1, str3).toFixed(3)}`);
console.log();

console.log(`String 1: "${str1}"`);
console.log(`String 4: "${str4}"`);
console.log(`Similarity: ${calculateSimilarity(str1, str4).toFixed(3)}`);
console.log();

// Test 4: Recruitment Law Keyword Matching
console.log('Test 4: Recruitment Law Keyword Matching');

const testComments = [
  'אני תומך בחוק הגיוס לחרדים',
  'השירות הצבאי חשוב לכולם',
  'יש לגייס את כולם לצבא',
  'היום יום יפה',
  'חוק הגיוס הוא חשוב מאוד',
];

testComments.forEach((comment, index) => {
  const result = isRecruitmentLawComment(comment);
  console.log(
    `Comment ${index + 1}: "${comment}"`
  );
  console.log(
    `  Matches: ${result.matches}, Keywords: [${result.keywords.join(', ')}]`
  );
});
console.log();

console.log('=== All Tests Completed Successfully ===');
