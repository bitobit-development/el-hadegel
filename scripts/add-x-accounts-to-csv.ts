import { config } from 'dotenv';
config();

import prisma from '@/lib/prisma';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

// Known X/Twitter accounts for coalition members
// This can be expanded as more accounts are discovered
const KNOWN_X_ACCOUNTS: Record<string, string> = {
  // Likud (32 members) - 11 accounts found
  '90': '@netanyahu',  // Benjamin Netanyahu
  '1095': '@BismuthBoaz', // Boaz Bismuth
  '69': '@Israel_katz', // Israel Katz (Minister of Defense)
  '826': '@yariv_levin', // Yariv Levin (Minister of Justice)
  '953': '@AmirOhana', // Amir Ohana (Knesset Speaker)
  '974': '@NirBarkat', // Nir Barkat (Minister of Economy)
  '1': '@YuliEdelstein', // Yuli Edelstein
  '1002': '@GolanMay', // May Golan (Minister of Social Equality)
  '723': '@GilaGamliel', // Gila Gamliel (Minister of Science & Technology)
  '1098': '@TallyGotliv', // Tally Gotliv
  '914': '@davidbitan', // David Bitan

  // Shas (11 members) - 1 account found
  '41': '@ariyederi', // Aryeh Deri (leader of Shas)

  // Religious Zionism (7 members) - 2 accounts found
  '1067': '@rothmar', // Simcha Rothman

  // Otzma Yehudit (6 members) - 1 account found
  '1056': '@itamarbengvir', // Itamar Ben-Gvir

  // UTJ (7 members) - 1 account found
  '1099': '@DOVRUTGoldknopf', // Yitzhak Goldknopf (leader of UTJ)

  // Note: Bezalel Smotrich (@bezalelsm) is not currently in the Knesset as a member
  // but leads Religious Zionism party

  // Add more as they are discovered...
};

// Coalition parties
const COALITION_PARTIES = [
  'הליכוד',
  'התאחדות הספרדים שומרי תורה תנועתו של מרן הרב עובדיה יוסף זצ"ל',
  'יהדות התורה',
  'הציונות הדתית בראשות בצלאל סמוטריץ\'',
  'עוצמה יהודית בראשות איתמר בן גביר',
  'נעם - בראשות אבי מעוז',
];

async function updateCoalitionCSVWithXAccounts() {
  console.log('📊 Updating Coalition MKs CSV with X/Twitter accounts...\n');

  try {
    // Fetch all MKs from coalition parties
    const coalitionMKs = await prisma.mK.findMany({
      where: {
        faction: {
          in: COALITION_PARTIES,
        },
      },
      orderBy: [
        { faction: 'asc' },
        { nameHe: 'asc' },
      ],
    });

    console.log(`✅ Found ${coalitionMKs.length} coalition members\n`);

    // Count how many have X accounts
    const withXAccount = coalitionMKs.filter(mk => KNOWN_X_ACCOUNTS[mk.mkId.toString()]);
    console.log(`📱 ${withXAccount.length} MKs have known X/Twitter accounts`);
    console.log(`❓ ${coalitionMKs.length - withXAccount.length} MKs need X account research\n`);

    // Generate CSV content with UTF-8 BOM for Hebrew support
    const BOM = '\uFEFF';
    const headers = ['MK_ID', 'Name_Hebrew', 'Faction', 'Position', 'X_Account', 'Phone', 'Email', 'Profile_URL'];

    const csvRows = [
      headers.join(','),
      ...coalitionMKs.map(mk => {
        const xAccount = KNOWN_X_ACCOUNTS[mk.mkId.toString()] || '';
        return [
          mk.mkId,
          `"${mk.nameHe}"`,
          `"${mk.faction}"`,
          mk.currentPosition,
          xAccount ? `"${xAccount}"` : '""',
          `"${mk.phone || ''}"`,
          `"${mk.email || ''}"`,
          mk.profileUrl,
        ].join(',');
      }),
    ];

    const csvContent = BOM + csvRows.join('\n');

    // Save to file
    const outputPath = join(process.cwd(), 'docs', 'mk-coalition', 'coalition-members.csv');
    writeFileSync(outputPath, csvContent, 'utf-8');

    console.log(`✅ CSV file updated successfully at: ${outputPath}`);
    console.log(`📊 Total coalition members: ${coalitionMKs.length}`);
    console.log(`📱 X/Twitter accounts added: ${withXAccount.length}`);

    // List MKs with X accounts
    if (withXAccount.length > 0) {
      console.log(`\n✅ MKs with X accounts:`);
      withXAccount.forEach(mk => {
        console.log(`   - ${mk.nameHe} (${mk.faction}): ${KNOWN_X_ACCOUNTS[mk.mkId.toString()]}`);
      });
    }

    console.log(`\n💡 Note: To add more X accounts, update the KNOWN_X_ACCOUNTS object in this script`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCoalitionCSVWithXAccounts();
