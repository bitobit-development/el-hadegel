import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

// Data extracted from Knesset website on 2025-11-26
const mkImageData = [
  { mkId: 1029, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1029/1_1029_3_13527.jpeg", name: "משה אבוטבול" },
  { mkId: 1, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1/1_1_3_4.jpeg", name: "יולי יואל אדלשטיין" },
  { mkId: 953, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/953/1_953_3_2628.jpeg", name: "אמיר אוחנה" },
  { mkId: 970, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/970/1_970_3_2722.jpeg", name: "ינון אזולאי" },
  { mkId: 754, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/754/1_754_3_1681.jpeg", name: "ישראל אייכלר" },
  { mkId: 1116, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1116/1_1116_3_19861.jpeg", name: "דן אילוז" },
  { mkId: 1093, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1093/1_1093_3_19652.jpeg", name: "ואליד אלהואשלה" },
  { mkId: 860, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/860/1_860_3_2066.jpeg", name: "קארין אלהרר" },
  { mkId: 1096, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1096/1_1096_3_19667.jpeg", name: "עמיחי אליהו" },
  { mkId: 768, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/768/1_768_3_1721.jpeg", name: "זאב אלקין" },
  { mkId: 1008, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1008/1_1008_3_11235.jpeg", name: "משה ארבל" },
  { mkId: 861, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/861/1_861_3_2073.jpeg", name: "יעקב אשר" },
  { mkId: 1126, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1126/1_1126_3_20040.jpeg", name: "אביחי אברהם בוארון" },
  { mkId: 1039, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1039/1_1039_3_15050.jpeg", name: "אוריאל בוסו" },
  { mkId: 1088, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1088/1_1088_3_19591.jpeg", name: "מישל בוסקילה" },
  { mkId: 1094, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1094/1_1094_3_19657.jpeg", name: "דבי ביטון" },
  { mkId: 1055, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1055/1_1055_3_17783.jpeg", name: "חיים ביטון" },
  { mkId: 1003, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1003/1_1003_3_11237.jpeg", name: "מיכאל מרדכי ביטון" },
  { mkId: 914, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/914/1_914_3_2378.jpeg", name: "דוד ביטן" },
  { mkId: 1095, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1095/1_1095_3_19662.jpeg", name: "בועז ביסמוט" },
  { mkId: 1049, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1049/1_1049_3_16601.jpeg", name: "ולדימיר בליאק" },
  { mkId: 915, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/915/1_915_3_2385.jpeg", name: "מירב  בן ארי" },
  { mkId: 1022, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1022/1_1022_3_11242.jpeg", name: "רם בן ברק" },
  { mkId: 1056, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1056/1_1056_3_17788.jpeg", name: "איתמר בן גביר" },
  { mkId: 1129, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1129/1_1129_3_20971.jpeg", name: "סמיר בן סעיד" },
  { mkId: 906, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/906/1_906_3_2332.jpeg", name: "יואב בן צור" },
  { mkId: 974, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/974/1_974_3_12308.jpeg", name: "ניר ברקת" },
  { mkId: 1125, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1125/1_1125_3_20029.jpeg", name: "ששון ששי גואטה" },
  { mkId: 1098, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1098/1_1098_3_19677.jpeg", name: "טלי גוטליב" },
  { mkId: 1099, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1099/1_1099_3_19749.jpeg", name: "יצחק גולדקנופ" },
  { mkId: 1002, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1002/1_1002_3_12304.jpeg", name: "מאי גולן" },
  { mkId: 981, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/981/1_981_3_11118.jpeg", name: "איתן גינזבורג" },
  { mkId: 723, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/723/1_723_3_1586.jpeg", name: "גילה גמליאל" },
  { mkId: 988, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/988/1_988_3_12347.jpeg", name: "בני גנץ" },
  { mkId: 35, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/35/1_35_3_93.jpeg", name: "משה גפני" },
  { mkId: 1085, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1085/1_1085_3_18028.jpeg", name: "סימון דוידסון" },
  { mkId: 771, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/771/1_771_3_1732.jpeg", name: "אבי דיכטר" },
  { mkId: 1059, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1059/1_1059_3_17778.jpeg", name: "גלית דיסטל אטבריאן" },
  { mkId: 1100, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1100/1_1100_3_19682.jpeg", name: "אלי דלל" },
  { mkId: 1101, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1101/1_1101_3_19687.jpeg", name: "שלום דנינו" },
  { mkId: 41, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/41/1_41_3_110.jpeg", name: "אריה מכלוף דרעי" },
  { mkId: 1044, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1044/1_1044_3_16220.jpeg", name: "עמית הלוי" },
  { mkId: 950, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/950/1_950_3_2607.jpeg", name: "שרן מרים השכל" },
  { mkId: 1045, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1045/1_1045_3_16502.jpeg", name: "ניסים ואטורי" },
  { mkId: 1060, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1060/1_1060_3_17793.jpeg", name: "מיכל מרים וולדיגר" },
  { mkId: 1102, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1102/1_1102_3_19692.jpeg", name: "יצחק שמעון וסרלאוף" },
  { mkId: 1032, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1032/1_1032_3_13745.jpeg", name: "אימאן ח'טיב יאסין" },
  { mkId: 1103, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1103/1_1103_3_19697.jpeg", name: "יאסר חוג'יראת" },
  { mkId: 854, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/854/1_854_3_2044.jpeg", name: "אכרם  חסון" },
  { mkId: 1026, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1026/1_1026_3_13539.jpeg", name: "ווליד טאהא" },
  { mkId: 872, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/872/1_872_3_2141.jpeg", name: "בועז טופורובסקי" },
  { mkId: 1050, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1050/1_1050_3_16606.jpeg", name: "משה טור פז" },
  { mkId: 208, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/208/1_208_3_520.jpeg", name: "אחמד טיבי" },
  { mkId: 1043, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1043/1_1043_3_15131.jpeg", name: "יוסף טייב" },
  { mkId: 1090, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1090/1_1090_3_19702.jpeg", name: "אוהד טל" },
  { mkId: 996, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/996/1_996_3_11221.jpeg", name: "יעקב טסלר" },
  { mkId: 1000, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1000/1_1000_3_11227.jpeg", name: "חילי טרופר" },
  { mkId: 874, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/874/1_874_3_2153.jpeg", name: "מאיר כהן" },
  { mkId: 1006, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1006/1_1006_3_11251.jpeg", name: "מירב כהן" },
  { mkId: 1013, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1013/1_1013_3_12312.jpeg", name: "עופר כסיף" },
  { mkId: 976, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/976/1_976_3_12324.jpeg", name: "אופיר כץ" },
  { mkId: 69, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/69/1_69_3_191.jpeg", name: "ישראל כץ" },
  { mkId: 1061, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1061/1_1061_3_17813.jpeg", name: "רון כץ" },
  { mkId: 998, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/998/1_998_3_11225.jpeg", name: "יוראי להב הרצנו" },
  { mkId: 1127, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1127/1_1127_3_20229.png", name: "ירון לוי" },
  { mkId: 876, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/876/1_876_3_2167.jpeg", name: "מיקי לוי" },
  { mkId: 826, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/826/1_826_3_1921.jpeg", name: "יריב לוין" },
  { mkId: 1082, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1082/1_1082_3_17989.jpeg", name: "נעמה לזימי" },
  { mkId: 214, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/214/1_214_3_548.jpeg", name: "אביגדור ליברמן" },
  { mkId: 878, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/878/1_878_3_2178.jpeg", name: "יאיר לפיד" },
  { mkId: 1076, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1076/1_1076_3_17974.jpeg", name: "טטיאנה מזרסקי" },
  { mkId: 881, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/881/1_881_3_2196.jpeg", name: "מרב מיכאלי" },
  { mkId: 1118, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1118/1_1118_3_19926.jpeg", name: "שלי טל מירון" },
  { mkId: 1115, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1115/1_1115_3_19849.jpeg", name: "יונתן מישרקי" },
  { mkId: 1105, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1105/1_1105_3_19712.jpeg", name: "חנוך דב מלביצקי" },
  { mkId: 956, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/956/1_956_3_2649.jpeg", name: "יוליה מלינובסקי" },
  { mkId: 957, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/957/1_957_3_2656.jpeg", name: "מיכאל  מלכיאלי" },
  { mkId: 1122, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1122/1_1122_3_19962.jpeg", name: "צגה צגנש מלקו" },
  { mkId: 1063, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1063/1_1063_3_17738.jpeg", name: "אבי מעוז" },
  { mkId: 814, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/814/1_814_3_1874.jpeg", name: "אורי מקלב" },
  { mkId: 751, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/751/1_751_3_1669.jpeg", name: "יעקב מרגי" },
  { mkId: 1106, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1106/1_1106_3_19718.jpeg", name: "שרון ניר" },
  { mkId: 90, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/90/1_90_3_248.jpeg", name: "בנימין נתניהו" },
  { mkId: 995, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/995/1_995_3_11219.jpeg", name: "יואב סגלוביץ" },
  { mkId: 994, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/994/1_994_3_11217.jpeg", name: "יבגני סובה" },
  { mkId: 1121, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1121/1_1121_3_19949.jpeg", name: "צבי ידידיה סוכות" },
  { mkId: 1107, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1107/1_1107_3_19723.jpeg", name: "משה סולומון" },
  { mkId: 1108, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1108/1_1108_3_19728.jpeg", name: "לימור סון הר מלך" },
  { mkId: 977, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/977/1_977_3_11108.jpeg", name: "אופיר סופר" },
  { mkId: 884, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/884/1_884_3_2213.jpeg", name: "אורית סטרוק" },
  { mkId: 1109, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1109/1_1109_3_19733.jpeg", name: "משה סעדה" },
  { mkId: 1007, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1007/1_1007_3_12320.jpeg", name: "מנסור עבאס" },
  { mkId: 1128, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1128/1_1128_3_20759.jpeg", name: "עפיף עבד" },
  { mkId: 938, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/938/1_938_3_2537.jpeg", name: "איימן עודה" },
  { mkId: 1130, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1130/1_1130_3_21032.jpeg", name: "עדי עזוז" },
  { mkId: 992, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/992/1_992_3_11212.jpeg", name: "חוה אתי עטייה" },
  { mkId: 837, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/837/1_837_3_1973.jpeg", name: "חמד עמאר" },
  { mkId: 1110, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1110/1_1110_3_19738.jpeg", name: "צביקה פוגל" },
  { mkId: 951, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/951/1_951_3_2614.jpeg", name: "עודד פורר" },
  { mkId: 1124, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1124/1_1124_3_20007.jpeg", name: "משה פסל" },
  { mkId: 103, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/103/1_103_3_285.jpeg", name: "מאיר פרוש" },
  { mkId: 1079, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1079/1_1079_3_17943.jpeg", name: "יסמין פרידמן" },
  { mkId: 978, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/978/1_978_3_11111.jpeg", name: "אורית פרקש הכהן" },
  { mkId: 1091, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1091/1_1091_3_19743.jpeg", name: "מטי צרפתי הרכבי" },
  { mkId: 987, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/987/1_987_3_11129.jpeg", name: "אריאל קלנר" },
  { mkId: 1114, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1114/1_1114_3_19866.jpeg", name: "יצחק קרויזר" },
  { mkId: 1066, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1066/1_1066_3_17753.jpeg", name: "גלעד קריב" },
  { mkId: 1011, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1011/1_1011_3_12326.jpeg", name: "שלמה קרעי" },
  { mkId: 1111, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1111/1_1111_3_19753.jpeg", name: "אליהו רביבו" },
  { mkId: 1067, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1067/1_1067_3_17818.jpeg", name: "שמחה רוטמן" },
  { mkId: 1048, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1048/1_1048_3_16568.jpeg", name: "יעל רון בן משה" },
  { mkId: 1068, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1068/1_1068_3_17773.jpeg", name: "אפרת רייטן מרום" },
  { mkId: 982, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/982/1_982_3_11099.jpeg", name: "אלון שוסטר" },
  { mkId: 1018, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1018/1_1018_3_12330.jpeg", name: "קטי קטרין שטרית" },
  { mkId: 899, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/899/1_899_3_2289.jpeg", name: "אלעזר שטרן" },
  { mkId: 1004, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1004/1_1004_3_12334.jpeg", name: "מיכל שיר סגמן" },
  { mkId: 1112, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1112/1_1112_3_19758.jpeg", name: "נאור שירי" },
  { mkId: 1123, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/1123/1_1123_3_19975.jpeg", name: "אושר שקלים" },
  { mkId: 948, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/948/1_948_3_2597.jpeg", name: "עאידה תומא סלימאן" },
  { mkId: 905, imageUrl: "https://fs.knesset.gov.il/globaldocs/MK/905/1_905_3_2327.jpeg", name: "פנינה תמנו" }
];

async function main() {
  console.log('🚀 Updating MK Images from Scraped Data\n');
  console.log(`📊 Total images to update: ${mkImageData.length}\n`);

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const data of mkImageData) {
    try {
      // Check if MK exists
      const mk = await prisma.mK.findUnique({
        where: { mkId: data.mkId },
        select: { mkId: true, nameHe: true, photoUrl: true }
      });

      if (!mk) {
        console.log(`⚠️  MK ${data.mkId} (${data.name}) not found in database`);
        notFound++;
        continue;
      }

      // Skip if already has the same URL
      if (mk.photoUrl === data.imageUrl) {
        console.log(`⏭️  ${mk.nameHe} (${data.mkId}) - Already current`);
        skipped++;
        continue;
      }

      // Update
      await prisma.mK.update({
        where: { mkId: data.mkId },
        data: { photoUrl: data.imageUrl }
      });

      console.log(`✅ ${mk.nameHe} (${data.mkId}) - Updated`);
      updated++;

    } catch (error) {
      console.error(`❌ Error updating MK ${data.mkId}:`, error);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📈 UPDATE SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Updated: ${updated}`);
  console.log(`⏭️  Skipped (already current): ${skipped}`);
  console.log(`⚠️  Not found in database: ${notFound}`);
  console.log(`📊 Total processed: ${mkImageData.length}`);
  console.log('\n✨ Done!\n');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
