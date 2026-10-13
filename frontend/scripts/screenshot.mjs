import { chromium } from '@playwright/test';
import path from 'path';

const outDir = 'C:/Users/Vaishnavi/.gemini/antigravity/brain/5bc0e726-b75d-4359-983a-0a2fe6f17533';

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // 1. Landing Page
  await page.goto('http://localhost:5173/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(outDir, 'landing_page.png'), fullPage: true });

  // 2. Library Page
  await page.goto('http://localhost:5173/library');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(outDir, 'library_page.png'), fullPage: true });

  // 3. Progress Page
  await page.goto('http://localhost:5173/progress');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(outDir, 'progress_page.png'), fullPage: true });

  // 4. Play Quick Play session
  await page.goto('http://localhost:5173/library');
  await page.waitForLoadState('networkidle');
  const startBtn = page.getByRole('button', { name: /Start Simulation/i }).first();
  await startBtn.click();
  await page.waitForURL(/\/play\//);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(outDir, 'play_page.png'), fullPage: false });

  await browser.close();
  console.log('Screenshots captured successfully.');
}

capture().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
