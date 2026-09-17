const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5173';

const PAGES_TO_CAPTURE = [
  {
    url: `${BASE_URL}/`,
    file: 'homepage_redesign_desktop.png',
    viewport: { width: 1440, height: 900 },
    title: 'Homepage Desktop',
  },
  {
    url: `${BASE_URL}/`,
    file: 'homepage_redesign_mobile.png',
    viewport: { width: 390, height: 844 },
    title: 'Homepage Mobile',
  },
  {
    url: `${BASE_URL}/digital-pet-passport`,
    file: 'digital_passport_page_desktop.png',
    viewport: { width: 1440, height: 900 },
    title: 'Digital Pet Passport',
  },
  {
    url: `${BASE_URL}/ai-pet-care`,
    file: 'ai_pet_care_page_desktop.png',
    viewport: { width: 1440, height: 900 },
    title: 'AI Pet Care',
  },
  {
    url: `${BASE_URL}/pet-gps`,
    file: 'pet_gps_page_desktop.png',
    viewport: { width: 1440, height: 900 },
    title: 'Pet GPS Radar',
  },
  {
    url: `${BASE_URL}/pet-health`,
    file: 'pet_health_hub_desktop.png',
    viewport: { width: 1440, height: 900 },
    title: 'Pet Health Hub',
  },
  {
    url: `${BASE_URL}/features`,
    file: 'features_page_desktop.png',
    viewport: { width: 1440, height: 900 },
    title: 'Product Features',
  },
  {
    url: `${BASE_URL}/for-pet-parents`,
    file: 'for_pet_parents_desktop.png',
    viewport: { width: 1440, height: 900 },
    title: 'For Pet Parents',
  },
];

async function run() {
  console.log('🚀 Starting high-fidelity screenshot capture...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  for (const item of PAGES_TO_CAPTURE) {
    console.log(`📸 Capturing ${item.title}...`);
    await page.setViewportSize(item.viewport);

    // Navigate to page
    await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Ensure light theme is active for the Duna aesthetic
    await page.evaluate(() => {
      localStorage.setItem('pm_theme', 'light');
      document.documentElement.removeAttribute('data-theme');
    });

    // Wait for animations and fonts to settle
    await page.waitForTimeout(1800);

    const targetPath = path.resolve(__dirname, item.file);
    await page.screenshot({
      path: targetPath,
      fullPage: false,
    });
    console.log(`✅ Saved: ${item.file}`);
  }

  await browser.close();
  console.log('🎉 All captures complete!');
}

run().catch((err) => {
  console.error('❌ Error during capture:', err);
  process.exit(1);
});
