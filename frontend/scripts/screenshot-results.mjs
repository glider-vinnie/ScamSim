import { chromium } from '@playwright/test';
import path from 'path';

const outDir = 'C:/Users/Vaishnavi/.gemini/antigravity/brain/5bc0e726-b75d-4359-983a-0a2fe6f17533';

async function captureResults() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  await page.goto('http://localhost:5173/library');
  await page.waitForLoadState('networkidle');
  
  const startBtn = page.getByRole('button', { name: /start simulation/i }).first();
  await startBtn.click();
  await page.waitForURL(/\/play\//);

  // Step 1
  await page.getByRole('button', { name: /Check my own UPI app for the credit first/i }).click();
  await page.getByRole('button', { name: /Continue|See Final Results/i }).click();

  // Step 2
  await page.getByRole('button', { name: /Decline politely; offer to meet once payment shows/i }).click();
  await page.getByRole('button', { name: /Continue|See Final Results/i }).click();

  // Terminal
  await page.getByRole('button', { name: /See results/i }).click();
  await page.waitForURL(/\/results\//);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(outDir, 'results_page.png'), fullPage: true });

  await browser.close();
  console.log('Results page captured successfully.');
}

captureResults().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
