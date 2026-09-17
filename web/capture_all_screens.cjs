// capture_all_screens.cjs
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5173';
const EXPORT_DIR = path.resolve(__dirname, '..', 'figma_exports');
if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR, { recursive: true });

const SCREENS = [
  // ── DESKTOP SCREENS (1440 × 960) ──────────────────────────────────────────
  { id: '01_landing_desktop',     name: 'Landing Page (Desktop)',       tab: 'landing',   viewport: { width: 1440, height: 960 }, guest: false },
  { id: '02_dashboard_desktop',   name: 'Dashboard & Pets (Desktop)',   tab: 'dashboard', viewport: { width: 1440, height: 960 }, guest: true  },
  { id: '03_shop_desktop',        name: 'Care Shop & Pharmacy',         tab: 'shop',      viewport: { width: 1440, height: 960 }, guest: true  },
  { id: '04_ai_scanner_desktop',  name: 'AI Health Triage & Scanner',   tab: 'ai',        viewport: { width: 1440, height: 960 }, guest: true  },
  { id: '05_specialists_desktop', name: 'Specialists & Veterinarians',  tab: 'vets',      viewport: { width: 1440, height: 960 }, guest: true  },
  { id: '06_community_desktop',   name: 'Pet Parent Community',         tab: 'community', viewport: { width: 1440, height: 960 }, guest: true  },
  { id: '07_tracker_desktop',     name: 'Live GPS Radar & Collar',      tab: 'tracker',   viewport: { width: 1440, height: 960 }, guest: true  },
  { id: '08_reminders_desktop',   name: 'Reminders & Vaccinations',     tab: 'vaccines',  viewport: { width: 1440, height: 960 }, guest: true  },
  { id: '09_nutrition_desktop',   name: 'Nutrition & Scientific Diets', tab: 'food',      viewport: { width: 1440, height: 960 }, guest: true  },
  { id: '10_profile_desktop',     name: 'User Profile & EHR Vault',     tab: 'profile',   viewport: { width: 1440, height: 960 }, guest: true  },
  { id: '11_admin_desktop',       name: 'Admin Portal & Analytics',     customUrl: `${BASE_URL}/?portal=admin`, viewport: { width: 1440, height: 960 }, guest: true },
  { id: '12_teleconsult_modal',   name: 'Teleconsultation Video Call',  tab: 'vets',      modalAction: 'open_teleconsult', viewport: { width: 1440, height: 960 }, guest: true },

  // ── MOBILE SCREENS (393 × 852 iPhone 14 Pro) ─────────────────────────────
  { id: '13_landing_mobile',      name: 'Landing Page (Mobile)',        tab: 'landing',   viewport: { width: 393, height: 852 },  guest: false },
  { id: '14_dashboard_mobile',    name: 'Dashboard (Mobile)',           tab: 'dashboard', viewport: { width: 393, height: 852 },  guest: true  },
  { id: '15_shop_mobile',         name: 'Care Shop (Mobile)',           tab: 'shop',      viewport: { width: 393, height: 852 },  guest: true  },
  { id: '16_ai_mobile',           name: 'AI Triage (Mobile)',           tab: 'ai',        viewport: { width: 393, height: 852 },  guest: true  },
  { id: '17_specialists_mobile',  name: 'Specialists (Mobile)',         tab: 'vets',      viewport: { width: 393, height: 852 },  guest: true  },
  { id: '18_community_mobile',    name: 'Community (Mobile)',           tab: 'community', viewport: { width: 393, height: 852 },  guest: true  },
];

async function capture() {
  console.log('🚀 Pet Maya High-Fidelity Capture for Figma Export\n');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    deviceScaleFactor: 2, // 2x Retina quality
  });
  
  await context.grantPermissions(['camera', 'microphone']);
  const page = await context.newPage();

  // Pre-seed storage before navigation
  await page.addInitScript(() => {
    sessionStorage.setItem('pm_hide_perm_prompt', 'true');
  });

  const captured = [];

  for (const item of SCREENS) {
    process.stdout.write(`📸 [${item.id}] ${item.name} (${item.viewport.width}x${item.viewport.height})... `);
    try {
      await page.setViewportSize(item.viewport);

      // Pre-set user state
      if (item.guest) {
        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
          localStorage.removeItem('pm_signed_out');
          localStorage.setItem('pm_demo_user', JSON.stringify({
            uid: 'demo_guest_figma',
            name: 'Anika Rahman',
            email: 'anika.rahman@petmaya.app',
            photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
            role: 'Pet Parent (VIP)',
            points: 140,
            referralCode: 'PMANIKA9',
            isVerified: true,
            favoriteVetIds: ['v1', 'v2']
          }));
          sessionStorage.setItem('pm_hide_perm_prompt', 'true');
        });
      } else {
        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
          localStorage.removeItem('pm_demo_user');
          sessionStorage.setItem('pm_hide_perm_prompt', 'true');
        });
      }

      // Target URL
      const target = item.customUrl || `${BASE_URL}/#${item.tab}`;
      await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);

      // If this screen requires opening the teleconsult modal
      if (item.modalAction === 'open_teleconsult') {
        await page.evaluate(() => {
          // Look for any video consult button in the specialists view
          const buttons = Array.from(document.querySelectorAll('button'));
          const videoBtn = buttons.find(b => 
            (b.textContent || '').includes('Video') || 
            (b.textContent || '').includes('Consult') ||
            (b.textContent || '').includes('Instant Video Triage')
          );
          if (videoBtn) {
            videoBtn.click();
          }
        });
        await page.waitForTimeout(1500);
      } else {
        // Ensure no stray modals are obscuring
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }

      const filePath = path.join(EXPORT_DIR, `${item.id}.png`);
      await page.screenshot({ path: filePath, fullPage: false });

      const sizeKB = Math.round(fs.statSync(filePath).size / 1024);
      console.log(`✅ ${sizeKB} KB`);
      captured.push({
        ...item,
        filePath,
        fileName: `${item.id}.png`,
        sizeKB,
        base64: fs.readFileSync(filePath).toString('base64'),
      });
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
    }
  }

  await browser.close();

  console.log(`\n🎉 Total ${captured.length} screens captured successfully!`);
  return captured;
}

capture().then(captured => {
  const meta = captured.map(({ base64, ...rest }) => rest);
  fs.writeFileSync(path.join(EXPORT_DIR, 'manifest.json'), JSON.stringify(meta, null, 2));
  generateFigmaArtifacts(captured);
});

function generateFigmaArtifacts(screens) {
  const PLUGIN_DIR = path.resolve(__dirname, '..', 'figma_plugin');
  if (!fs.existsSync(PLUGIN_DIR)) fs.mkdirSync(PLUGIN_DIR, { recursive: true });

  const manifest = {
    name: "Pet Maya — Website Design Importer",
    id: "pet-maya-web-importer",
    api: "1.0.0",
    main: "code.js",
    capabilities: [],
    enableProposedApi: false,
    editorType: ["figma"]
  };
  fs.writeFileSync(path.join(PLUGIN_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

  const screenEntries = screens.map(s => `  {
    id: ${JSON.stringify(s.id)},
    name: ${JSON.stringify(s.name)},
    w: ${s.viewport.width},
    h: ${s.viewport.height},
    isMobile: ${s.viewport.width < 1000},
    data: ${JSON.stringify(s.base64)}
  }`).join(',\n');

  const figmaCode = `// Pet Maya Web App Design Importer for Figma
// Generated automatically from production web build

(async () => {
  const SCREENS = [
${screenEntries}
  ];

  function b64ToUint8Array(b64) {
    const raw = atob(b64);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
  }

  let page = figma.root.children.find(p => p.name.includes('Pet Maya — Web App'));
  if (!page) {
    page = figma.createPage();
    page.name = '🌐 Pet Maya — Web App Design';
  }
  figma.currentPage = page;

  for (const child of [...page.children]) {
    child.remove();
  }

  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });

  // Header Banner
  const titleFrame = figma.createFrame();
  titleFrame.name = "Banner / Header";
  titleFrame.resize(2200, 160);
  titleFrame.x = 0;
  titleFrame.y = 0;
  titleFrame.fills = [{ type: 'SOLID', color: { r: 0.05, g: 0.12, b: 0.1 } }];
  titleFrame.cornerRadius = 24;

  const headerTitle = figma.createText();
  headerTitle.fontName = { family: 'Inter', style: 'Bold' };
  headerTitle.characters = "🐾 Pet Maya — Web Portal & Design System";
  headerTitle.fontSize = 44;
  headerTitle.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  headerTitle.x = 40;
  headerTitle.y = 36;
  titleFrame.appendChild(headerTitle);

  const headerSub = figma.createText();
  headerSub.fontName = { family: 'Inter', style: 'Medium' };
  headerSub.characters = "High-fidelity exports of all web screens: Care Shop, AI Triage, Specialists, Live Radar, Community, and Passport.";
  headerSub.fontSize = 18;
  headerSub.fills = [{ type: 'SOLID', color: { r: 0.6, g: 0.85, b: 0.7 } }];
  headerSub.x = 40;
  headerSub.y = 96;
  titleFrame.appendChild(headerSub);

  let curY = 240;
  const GAP_X = 100;
  const GAP_Y = 140;
  const COLS = 3;

  const desktopList = SCREENS.filter(s => !s.isMobile);
  const mobileList = SCREENS.filter(s => s.isMobile);

  // Desktop Header
  const desktopSec = figma.createText();
  desktopSec.fontName = { family: 'Inter', style: 'Bold' };
  desktopSec.characters = "🖥️ DESKTOP SCREENS (1440 × 960)";
  desktopSec.fontSize = 28;
  desktopSec.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.25, b: 0.3 } }];
  desktopSec.x = 0;
  desktopSec.y = curY;
  curY += 50;

  for (let i = 0; i < desktopList.length; i++) {
    const s = desktopList[i];
    const col = i % COLS;
    const row = Math.floor(i / COLS);

    const x = col * (s.w + GAP_X);
    const y = curY + row * (s.h + GAP_Y);

    const frame = figma.createFrame();
    frame.name = s.name;
    frame.resize(s.w, s.h);
    frame.x = x;
    frame.y = y;
    frame.cornerRadius = 16;
    frame.clipsContent = true;

    frame.effects = [{
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.15 },
      offset: { x: 0, y: 16 },
      radius: 36,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL'
    }];

    const imgBytes = b64ToUint8Array(s.data);
    const img = figma.createImage(imgBytes);
    frame.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: img.hash }];

    const label = figma.createText();
    label.fontName = { family: 'Inter', style: 'Bold' };
    label.characters = s.name;
    label.fontSize = 22;
    label.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.15, b: 0.2 } }];
    label.x = x;
    label.y = y - 36;
  }

  const maxDesktopRows = Math.ceil(desktopList.length / COLS);
  curY += maxDesktopRows * (960 + GAP_Y) + 60;

  // Mobile Header
  const mobileSec = figma.createText();
  mobileSec.fontName = { family: 'Inter', style: 'Bold' };
  mobileSec.characters = "📱 MOBILE SCREENS (393 × 852 iPhone 14 Pro)";
  mobileSec.fontSize = 28;
  mobileSec.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.25, b: 0.3 } }];
  mobileSec.x = 0;
  mobileSec.y = curY;
  curY += 50;

  let mobX = 0;
  for (let j = 0; j < mobileList.length; j++) {
    const s = mobileList[j];
    const x = mobX;
    const y = curY;

    const frame = figma.createFrame();
    frame.name = s.name;
    frame.resize(s.w, s.h);
    frame.x = x;
    frame.y = y;
    frame.cornerRadius = 32;
    frame.clipsContent = true;

    frame.effects = [{
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.2 },
      offset: { x: 0, y: 12 },
      radius: 28,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL'
    }];

    const imgBytes = b64ToUint8Array(s.data);
    const img = figma.createImage(imgBytes);
    frame.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: img.hash }];

    const label = figma.createText();
    label.fontName = { family: 'Inter', style: 'Bold' };
    label.characters = s.name;
    label.fontSize = 18;
    label.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.15, b: 0.2 } }];
    label.x = x;
    label.y = y - 30;

    mobX += s.w + 60;
  }

  figma.viewport.scrollAndZoomIntoView(page.children);
  figma.notify("🎉 Pet Maya website exported to Figma successfully! (" + SCREENS.length + " screens)", { timeout: 6000 });
  figma.closePlugin();
})();
`;

  fs.writeFileSync(path.join(PLUGIN_DIR, 'code.js'), figmaCode);
  fs.writeFileSync(path.join(EXPORT_DIR, 'Figma_Import_Script.js'), figmaCode);

  console.log(`\n📦 Figma Plugin generated at:`);
  console.log(`   ${PLUGIN_DIR}`);
  console.log(`   - manifest.json`);
  console.log(`   - code.js`);
  console.log(`\n📋 Standalone Console Script generated at:`);
  console.log(`   ${path.join(EXPORT_DIR, 'Figma_Import_Script.js')}`);
}
