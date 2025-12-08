import { getMKs } from '@/app/actions/mk-actions';
import { isCoalitionMember } from '@/lib/coalition';
import { canContactViaWhatsApp } from '@/lib/whatsapp-utils';

async function testWhatsAppIcon() {
  console.log('🔍 Testing WhatsApp Icon Display Logic\n');

  try {
    // Fetch all MKs
    const mks = await getMKs(undefined, true, true, true);

    console.log(`Total MKs fetched: ${mks.length}\n`);

    // Check coalition members with mobile numbers
    const coalitionWithMobile = mks.filter(mk =>
      isCoalitionMember(mk.faction) && mk.mobileNumber
    );

    console.log(`Coalition members with mobileNumber field set: ${coalitionWithMobile.length}\n`);

    if (coalitionWithMobile.length === 0) {
      console.log('❌ NO coalition members have mobileNumber set in database!');
      console.log('\nSample of coalition members (first 5):');
      mks
        .filter(mk => isCoalitionMember(mk.faction))
        .slice(0, 5)
        .forEach(mk => {
          console.log(
            `  - ${mk.nameHe} (${mk.faction}): mobileNumber = ${mk.mobileNumber || 'NULL'}`
          );
        });
    } else {
      console.log('✅ Found coalition members with mobile numbers:\n');
      coalitionWithMobile.slice(0, 10).forEach(mk => {
        const canContact = canContactViaWhatsApp(
          isCoalitionMember(mk.faction),
          mk.mobileNumber
        );
        console.log(
          `  - ${mk.nameHe} (${mk.faction})`
        );
        console.log(`    Mobile: ${mk.mobileNumber}`);
        console.log(`    Can contact: ${canContact ? '✅ YES' : '❌ NO'}\n`);
      });

      // Test the WhatsApp icon logic
      console.log('\n📊 Summary:');
      const eligible = mks.filter(mk =>
        canContactViaWhatsApp(isCoalitionMember(mk.faction), mk.mobileNumber)
      );
      console.log(`Total MKs eligible for WhatsApp icon: ${eligible.length}`);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testWhatsAppIcon();
