import { chromium } from 'playwright';

async function testLobbyPage() {
  console.log('Testing scrape from MK lobby page...\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    const url = 'https://main.knesset.gov.il/mk/apps/mklobby/main/current-knesset-mks/all-current-mks';
    console.log(`Navigating to: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('✓ Page loaded');

    // Wait for the page to fully render
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: 'debug-lobby.png', fullPage: true });
    console.log('✓ Screenshot saved to debug-lobby.png');

    // Look for MK cards
    const mkCards = await page.locator('.mk-card, .lobby-img, [class*="mk-"], [class*="member"]').count();
    console.log('MK card elements found:', mkCards);

    // Search for divs with background images
    const divsWithBg = await page.locator('div[style*="background-image"]').count();
    console.log('Divs with background-image:', divsWithBg);

    // Get all classes that might be relevant
    const relevantClasses = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="lobby"], [class*="mk"], [class*="member"], [class*="card"]');
      return Array.from(elements).slice(0, 20).map(el => ({
        tag: el.tagName,
        className: el.className,
        hasStyle: el.hasAttribute('style'),
        style: el.getAttribute('style')?.substring(0, 100)
      }));
    });

    console.log('\nRelevant elements:', JSON.stringify(relevantClasses, null, 2));

    // Try to find one specific MK (1063 - Avi Maoz)
    console.log('\nLooking for MK 1063 specifically...');
    const mk1063 = await page.evaluate(() => {
      // Look for any element containing "1063"
      const allElements = document.querySelectorAll('*');
      for (const el of allElements) {
        if (el.textContent?.includes('1063') || el.innerHTML?.includes('1063')) {
          return {
            tag: el.tagName,
            className: el.className,
            text: el.textContent?.substring(0, 100),
            style: el.getAttribute('style')?.substring(0, 200)
          };
        }
      }
      return null;
    });

    console.log('MK 1063 element:', mk1063);

    // Look inside profile-card-container for images
    const profileCardData = await page.evaluate(() => {
      const cards = document.querySelectorAll('.profile-card-container');
      const results = [];

      for (let i = 0; i < Math.min(cards.length, 3); i++) {
        const card = cards[i];

        // Find any div with background-image inside this card
        const imgDiv = card.querySelector('div[style*="background-image"]');

        let imageUrl = null;
        if (imgDiv) {
          const style = (imgDiv as HTMLElement).style.backgroundImage;
          const match = style.match(/url\(['"]?([^'"]+)['"]?\)/);
          imageUrl = match ? match[1] : null;
        }

        results.push({
          index: i,
          className: card.className,
          hasImgDiv: !!imgDiv,
          imgDivClass: imgDiv?.className,
          imageUrl,
          innerHTML: card.innerHTML.substring(0, 500)
        });
      }

      return results;
    });

    console.log('\nProfile card data:', JSON.stringify(profileCardData, null, 2));

    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testLobbyPage();
