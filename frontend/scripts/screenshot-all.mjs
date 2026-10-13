import { chromium } from '@playwright/test';
import path from 'path';

const outDir = 'C:/Users/Vaishnavi/.gemini/antigravity/brain/5bc0e726-b75d-4359-983a-0a2fe6f17533';

async function captureAll() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // 1. Landing Page
  console.log('Capturing Landing Page...');
  await page.goto('http://localhost:5173/');
  await page.waitForSelector('text=Learn to spot the scam');
  await page.screenshot({ path: path.join(outDir, 'landing_page.png'), fullPage: true });

  // 2. Library Page
  console.log('Capturing Library Page...');
  await page.goto('http://localhost:5173/library');
  await page.waitForSelector('text=Scenario Library');
  await page.waitForSelector('button:has-text("Start Simulation")');
  await page.screenshot({ path: path.join(outDir, 'library_page.png'), fullPage: true });

  // 3. Play Page (active scenario with interactive choices)
  console.log('Capturing Play Page...');
  const startBtn = page.getByRole('button', { name: /start simulation/i }).first();
  await startBtn.click();
  await page.waitForURL(/\/play\//);
  await page.waitForSelector('button[id^="choice-"]');
  await page.screenshot({ path: path.join(outDir, 'play_page.png'), fullPage: true });

  // 4. Results Page (completing scenario)
  console.log('Capturing Results Page...');
  await page.getByRole('button', { name: /Check my own UPI app for the credit first/i }).click();
  await page.getByRole('button', { name: /Continue|See Final Results/i }).click();
  await page.waitForTimeout(400);

  await page.getByRole('button', { name: /Decline politely; offer to meet once payment shows/i }).click();
  await page.getByRole('button', { name: /Continue|See Final Results/i }).click();
  await page.waitForTimeout(400);

  await page.getByRole('button', { name: /See results/i }).click();
  await page.waitForURL(/\/results\//);
  await page.waitForSelector('text=Simulation Results');
  await page.screenshot({ path: path.join(outDir, 'results_page.png'), fullPage: true });

  // 5. Progress Dashboard (now populated with 1 session!)
  console.log('Capturing Progress Page...');
  await page.goto('http://localhost:5173/progress');
  await page.waitForSelector('text=Your Scam Defense Profile');
  await page.screenshot({ path: path.join(outDir, 'progress_page.png'), fullPage: true });

  await browser.close();
  console.log('All full-fidelity screenshots captured successfully!');
}

captureAll().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});
