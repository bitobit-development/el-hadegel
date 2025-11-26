# Batch Contact Scraping Guide

This guide will help you scrape contact information for all 120 MKs in batches.

## MK IDs (Batches of 10)

### Batch 1 (IDs 1-10)
- 1, 35, 41, 69, 90, 103, 208, 214, 723, 751

### Batch 2 (IDs 11-20)
- 754, 768, 771, 814, 826, 837, 854, 860, 861, 872

### Batch 3 (IDs 21-30)
- 874, 876, 878, 881, 884, 899, 905, 906, 914, 915

### Batch 4 (IDs 31-40)
- 938, 948, 950, 951, 953, 956, 957, 970, 974, 976

### Batch 5 (IDs 41-50)
- 977, 978, 981, 982, 987, 988, 992, 994, 995, 996

### Batch 6 (IDs 51-60)
- 998, 1000, 1002, 1003, 1004, 1006, 1007, 1008, 1011, 1013

### Batch 7 (IDs 61-70)
- 1018, 1022, 1026, 1029, 1032, 1039, 1043, 1044, 1045, 1048

### Batch 8 (IDs 71-80)
- 1049, 1050, 1055, 1056, 1059, 1060, 1061, 1063, 1066, 1067

### Batch 9 (IDs 81-90)
- 1068, 1076, 1079, 1082, 1085, 1088, 1090, 1091, 1093, 1094

### Batch 10 (IDs 91-100)
- 1095, 1096, 1098, 1099, 1100, 1101, 1102, 1103, 1105, 1106

### Batch 11 (IDs 101-110)
- 1107, 1108, 1109, 1110, 1111, 1112, 1114, 1115, 1116, 1118

### Batch 12 (IDs 111-120)
- 1121, 1122, 1123, 1124, 1125, 1126, 1127, 1128, 1129, 1130

## Scraping Instructions

For each batch, run this code in Claude Code using Playwright MCP:

```javascript
// Array of MK IDs for this batch
const mkIds = [1, 35, 41, 69, 90, 103, 208, 214, 723, 751]; // Replace with batch IDs

const results = [];

for (const mkId of mkIds) {
  try {
    // Navigate to MK page
    await page.goto(`https://m.knesset.gov.il/mk/apps/mk/mk-personal-details/${mkId}`);

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Extract contact info
    const contact = await page.evaluate(() => {
      const contactDiv = document.querySelector('.mk-contact');
      if (!contactDiv) return { mkId: null, phone: null, email: null };

      const phoneSpan = contactDiv.querySelector('span');
      const phone = phoneSpan ? phoneSpan.textContent?.trim() : null;

      const emailLink = contactDiv.querySelector('a[href^="mailto:"]');
      const email = emailLink ? emailLink.textContent?.trim() : null;

      return { phone, email };
    });

    results.push({ mkId, ...contact });
    console.log(`✓ MK ${mkId}: ${contact.phone || 'No phone'} | ${contact.email || 'No email'}`);

  } catch (error) {
    console.log(`✗ MK ${mkId}: Error - ${error.message}`);
    results.push({ mkId, phone: null, email: null });
  }
}

// Print results in format ready to paste into scrape-mk-contacts.ts
console.log('\n\n// Paste this into contactData array:');
results.forEach(r => {
  console.log(`  { mkId: ${r.mkId}, phone: ${r.phone ? `"${r.phone}"` : 'null'}, email: ${r.email ? `"${r.email}"` : 'null'} },`);
});

return results;
```

## Update Process

1. Run the scraping code for a batch
2. Copy the output data
3. Paste into `scripts/scrape-mk-contacts.ts` in the `contactData` array
4. After collecting all batches, run: `npx tsx scripts/scrape-mk-contacts.ts`

## Progress Tracking

- [x] Batch 1: ___
- [ ] Batch 2: ___
- [ ] Batch 3: ___
- [ ] Batch 4: ___
- [ ] Batch 5: ___
- [ ] Batch 6: ___
- [ ] Batch 7: ___
- [ ] Batch 8: ___
- [ ] Batch 9: ___
- [ ] Batch 10: ___
- [ ] Batch 11: ___
- [ ] Batch 12: ___
