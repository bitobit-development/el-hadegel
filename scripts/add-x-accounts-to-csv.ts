import { config } from 'dotenv';
config();

import prisma from '@/lib/prisma';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

// Known X/Twitter accounts for coalition members
// This can be expanded as more accounts are discovered
const KNOWN_X_ACCOUNTS: Record<string, string> = {
  // Likud (32 members) - 32 accounts found (100% coverage!)
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
  '771': '@avidichter', // Avi Dichter
  '1126': '@AvichayBuaron', // Avihai Boaron
  '976': '@OfirKatzMK', // Ofir Katz
  '1123': '@OsherShkalim', // Osher Shkalim
  '1100': '@elidallal32', // Eli Dallal
  '1111': '@revivoeliyahu', // Eliyahu Revivo
  '987': '@ArielKallner', // Ariel Kallner
  '1059': '@GalitDistel', // Galit Distel Atbaryan
  '1116': '@dillouz', // Dan Illouz
  '992': '@ettyatia', // Hava Etty Atia
  '1105': '@hanochmilwidsky', // Hanoch Milwidsky
  '1109': '@MosheSaada1', // Moshe Saada
  '1124': '@moshiko_passal', // Moshe Passal
  '1045': '@nissimv', // Nissim Vaturi
  '1044': '@HaleviAmit', // Amit Halevi
  '1128': '@afefameenabed', // Afef Abed
  '1122': '@Tsega__Melaku', // Tsega Melaku
  '1018': '@shitrit_keti', // Keti Shitrit
  '1101': '@ShalomDanino', // Shalom Danino
  '1011': '@shlomo_karhi', // Shlomo Karhi
  '1125': '@sassong24', // Sasson Guetta

  // Shas (11 members) - 9 accounts found
  '41': '@ariyederi', // Aryeh Deri (leader of Shas)
  '1039': '@BussoUriel', // Uriel Busso
  '1055': '@haiimaemek', // Haim Biton
  '906': '@BentzurYoav', // Yoav Ben Tzur
  '1043': '@yossitaieb', // Yosef Taieb
  '751': '@yakmargi', // Yaakov Margi
  '957': '@malkielim82', // Michael Malkieli
  '1029': '@Abutbulm', // Moshe Abutbul
  '1008': '@rbl_msh38078', // Moshe Arbel

  // Religious Zionism (7 members) - 7 accounts found (100% coverage!)
  '1067': '@rothmar', // Simcha Rothman
  '1090': '@MKOhadTal', // Ohad Tal
  '977': '@ofir_sofer', // Ofir Sofer
  '884': '@oritstrock', // Orit Strock
  '1060': '@michalwoldiger', // Michal Woldiger
  '1107': '@Moshe_solomon_', // Moshe Solomon
  '1121': '@tzvisuccot', // Tzvi Succot

  // Otzma Yehudit (6 members) - 6 accounts found (100% coverage!)
  '1056': '@itamarbengvir', // Itamar Ben-Gvir
  '1114': '@Yitzik_kroizer', // Yitzak Kroyzer
  '1102': '@ItshakWaserlauf', // Itzhak Wasserlauf
  '1108': '@limor_sonhrmelh', // Limor Son Har Melech
  '1096': '@Eliyahu_a', // Amichai Eliyahu
  '1110': '@tzvikafoghel', // Tzvika Foghel

  // UTJ (7 members) - 5 accounts found
  '1099': '@DOVRUTGoldknopf', // Yitzhak Goldknopf (leader of UTJ)
  '861': '@Pikeaccount', // Yaakov Asher
  '996': '@TESLERYANKY', // Yaakov Tesler
  '754': '@YisraelEichler', // Yisrael Eichler
  '35': '@mk_moshe_gafni', // Moshe Gafni

  // Noam (1 member) - 1 account found (100% coverage!)
  '1063': '@AVI_MAOZ', // Avi Maoz

  // Note: Bezalel Smotrich (@bezalelsm) is not currently in the Knesset as a member
  // but leads Religious Zionism party

  // Total: 60 out of 64 coalition members have X accounts (93.75% coverage)
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
