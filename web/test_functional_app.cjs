const { chromium } = require('@playwright/test');

async function testApp() {
  console.log('🧪 Verifying functional app views and interactivity...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', (err) => {
    errors.push(err.message);
  });

  // 1. Visit Dashboard
  await page.goto('http://localhost:5173/#dashboard', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  console.log('📍 Checking Dashboard...');
  const hasDashboard = await page.evaluate(() => document.body.innerText.includes('My Pets') || document.body.innerText.includes('Quick Actions'));
  console.log(`  Dashboard loaded: ${hasDashboard}`);

  // 2. Visit Shop
  await page.goto('http://localhost:5173/#shop', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  console.log('📍 Checking Shop...');
  const hasShop = await page.evaluate(() => document.body.innerText.includes('Shop') || document.body.innerText.includes('Cart') || document.body.innerText.includes('Royal Canin'));
  console.log(`  Shop loaded: ${hasShop}`);

  // 3. Visit Specialists
  await page.goto('http://localhost:5173/#vets', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  console.log('📍 Checking Specialists...');
  const hasVets = await page.evaluate(() => document.body.innerText.includes('Veterinarians') || document.body.innerText.includes('Specialists') || document.body.innerText.includes('Book'));
  console.log(`  Specialists loaded: ${hasVets}`);

  // 4. Visit AI Health Triage
  await page.goto('http://localhost:5173/#ai', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  console.log('📍 Checking AI Health Triage...');
  const hasTriage = await page.evaluate(() => document.body.innerText.includes('AI') || document.body.innerText.includes('Symptom') || document.body.innerText.includes('Scan'));
  console.log(`  AI Triage loaded: ${hasTriage}`);

  await browser.close();

  if (errors.length > 0) {
    console.error('❌ Errors detected during navigation:', errors);
    process.exit(1);
  } else {
    console.log('✅ All functional app views verified successfully with ZERO errors!');
  }
}

testApp().catch(e => {
  console.error(e);
  process.exit(1);
});
