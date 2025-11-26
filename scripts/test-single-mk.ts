async function testScrape(mkId: number) {
  try {
    const url = `https://m.knesset.gov.il/mk/apps/mk/mk-personal-details/${mkId}`;
    console.log(`Fetching: ${url}\n`);

    const response = await fetch(url);
    const html = await response.text();

    // Save HTML to file for inspection
    const fs = require('fs');
    fs.writeFileSync('/Users/haim/Projects/el-hadegel/debug-mk-1063.html', html);
    console.log('HTML saved to debug-mk-1063.html');

    // Search for parts of the expected URL
    if (html.includes('lobby-img')) {
      console.log('✓ Found "lobby-img" in HTML');
    } else {
      console.log('✗ "lobby-img" not found');
    }

    if (html.includes('fs.knesset.gov.il')) {
      console.log('✓ Found "fs.knesset.gov.il" in HTML');
      // Find context around it
      const idx = html.indexOf('fs.knesset.gov.il');
      console.log('Context:', html.substring(idx - 50, idx + 150));
    } else {
      console.log('✗ "fs.knesset.gov.il" not found');
    }

    if (html.includes('1063')) {
      console.log('✓ Found "1063" in HTML');
    } else {
      console.log('✗ "1063" not found');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testScrape(1063);
