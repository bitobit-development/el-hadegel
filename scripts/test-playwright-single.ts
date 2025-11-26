import { chromium } from 'playwright';

async function testSingleMK(mkId: number) {
  console.log(`Testing scrape for MK ${mkId}...\n`);

  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  });
  const page = await context.newPage();

  try {
    const url = `https://m.knesset.gov.il/mk/apps/mk/mk-personal-details/${mkId}`;
    console.log(`Navigating to: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('✓ Page loaded');

    // Wait a bit for Angular to render
    await page.waitForTimeout(3000);

    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
    console.log('✓ Screenshot saved to debug-screenshot.png');

    // Check what's on the page
    const pageContent = await page.content();
    console.log('Page includes "lobby-img":', pageContent.includes('lobby-img'));
    console.log('Page includes "background-image":', pageContent.includes('background-image'));

    // Try to find the element
    const lobbyImgExists = await page.locator('.lobby-img').count();
    console.log('Number of .lobby-img elements:', lobbyImgExists);

    // Try different selectors
    const divWithBg = await page.locator('div[style*="background-image"]').count();
    console.log('Divs with background-image:', divWithBg);

    // Try to find imgMkDetails instead
    const imgMkDetailsExists = await page.locator('.imgMkDetails').count();
    console.log('Number of .imgMkDetails elements:', imgMkDetailsExists);

    if (imgMkDetailsExists > 0) {
      console.log('✓ Found .imgMkDetails element');

      const imageUrl = await page.evaluate(() => {
        const img = document.querySelector('.imgMkDetails');
        if (!img) return null;

        // Check if it's an img element with src
        if (img.tagName === 'IMG') {
          return (img as HTMLImageElement).src;
        }

        // Check if it has background-image
        const style = (img as HTMLElement).style.backgroundImage;
        if (style) {
          const match = style.match(/url\(['"]?([^'"]+)['"]?\)/);
          return match ? match[1] : null;
        }

        return null;
      });

      console.log('Image URL from .imgMkDetails:', imageUrl);
      const cleanUrl = imageUrl ? imageUrl.split('?')[0] : null;
      console.log('Clean URL:', cleanUrl);
      await page.waitForTimeout(2000);
      return;
    }

    if (lobbyImgExists === 0 && imgMkDetailsExists === 0) {
      console.log('\n⚠️ Neither .lobby-img nor .imgMkDetails found');
      console.log('Current URL:', page.url());
      return;
    }

    console.log('✓ Found .lobby-img element');

    // Extract the background-image URL
    const imageUrl = await page.evaluate(() => {
      const lobbyImg = document.querySelector('.lobby-img');
      if (!lobbyImg) return null;

      const style = lobbyImg.getAttribute('style');
      console.log('Style attribute:', style);

      if (!style) return null;

      // Extract URL from style="background-image: url('...')"
      const match = style.match(/url\(['"]?([^'"]+)['"]?\)/);
      return match ? match[1] : null;
    });

    console.log('\n✓ Extracted image URL:', imageUrl);

    // Clean URL
    const cleanUrl = imageUrl ? imageUrl.split('?')[0] : null;
    console.log('✓ Clean URL:', cleanUrl);

    // Wait a bit so we can see the browser
    await page.waitForTimeout(2000);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testSingleMK(1063);
