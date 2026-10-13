import { test, expect } from '@playwright/test'

test.describe('Scenario Journeys (Best Path & Loss Path)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/library')
    await expect(page.locator('h1')).toContainText('Scenario Library')
  })

  // Scenario A: payment-screenshot
  test('Scenario A (Payment Screenshot): Best Path to Safe Terminal', async ({ page }) => {
    // Start payment-screenshot scenario
    const startBtn = page.getByRole('button', { name: /start simulation/i }).first()
    await startBtn.click()

    await expect(page).toHaveURL(/\/play\//)
    await expect(page.getByText(/Step 1 of ~3/i)).toBeVisible()

    // Step A1: Choose A1-b (Check my own UPI app for credit)
    await page.getByRole('button', { name: /Check my own UPI app for the credit first/i }).click()
    await expect(page.getByRole('heading', { name: /Decision Outcome/i })).toBeVisible()
    await page.getByRole('button', { name: /Continue|See Final Results/i }).click()

    // Step A3: Choose A3-b (Decline politely; offer to meet once payment shows)
    await expect(page.getByText(/Step 2 of ~3/i)).toBeVisible()
    await page.getByRole('button', { name: /Decline politely; offer to meet once payment shows/i }).click()
    await expect(page.getByRole('heading', { name: /Decision Outcome/i })).toBeVisible()
    await page.getByRole('button', { name: /Continue|See Final Results/i }).click()

    // Terminal: Safe
    await expect(page.getByText(/Threat Prevented Successfully/i)).toBeVisible()
    await page.getByRole('button', { name: /See results/i }).click()

    await expect(page).toHaveURL(/\/results\//)
    await expect(page.getByText(/Simulation Results/i)).toBeVisible()
    await expect(page.getByText(/Safe Handler/i)).toBeVisible()
  })

  test('Scenario A (Payment Screenshot): Loss Path to Simulated Loss Terminal', async ({ page }) => {
    const startBtn = page.getByRole('button', { name: /start simulation/i }).first()
    await startBtn.click()

    await expect(page).toHaveURL(/\/play\//)

    // Step A1: Choose A1-a (Hand it over — screenshot looks fine) -> direct loss
    await page.getByRole('button', { name: /Hand it over — screenshot looks fine/i }).click()
    await expect(page.getByRole('heading', { name: /Decision Outcome/i })).toBeVisible()
    await page.getByRole('button', { name: /Continue|See Final Results/i }).click()

    // Terminal: Loss
    await expect(page.getByText(/Simulated Financial Loss/i)).toBeVisible()
    await page.getByRole('button', { name: /See results/i }).click()

    await expect(page).toHaveURL(/\/results\//)
    await expect(page.getByText(/Simulation Results/i)).toBeVisible()
    await expect(page.getByText(/Critical Risk/i)).toBeVisible()
  })

  // Scenario B: refund-qr
  test('Scenario B (Refund QR): Best Path to Safe Terminal', async ({ page }) => {
    // 2nd scenario card on library
    await page.getByRole('button', { name: /start simulation/i }).nth(1).click()

    await expect(page).toHaveURL(/\/play\//)

    // B1: Choose B1-b
    await page.getByRole('button', { name: /Ask: why do I need to scan to receive money\?/i }).click()
    await expect(page.getByRole('heading', { name: /Decision Outcome/i })).toBeVisible()
    await page.getByRole('button', { name: /Continue|See Final Results/i }).click()

    // B3: Choose B3-b
    await page.getByRole('button', { name: /Stop replying; check the official app/i }).click()
    await expect(page.getByRole('heading', { name: /Decision Outcome/i })).toBeVisible()
    await page.getByRole('button', { name: /Continue|See Final Results/i }).click()

    // B4: Choose B4-a
    await page.getByRole('button', { name: /Block and report the sender/i }).click()
    await expect(page.getByRole('heading', { name: /Decision Outcome/i })).toBeVisible()
    await page.getByRole('button', { name: /Continue|See Final Results/i }).click()

    // Terminal: Safe
    await expect(page.getByText(/Threat Prevented Successfully/i)).toBeVisible()
    await page.getByRole('button', { name: /See results/i }).click()
    await expect(page).toHaveURL(/\/results\//)
  })

  test('Scenario B (Refund QR): Loss Path to Simulated Loss Terminal', async ({ page }) => {
    await page.getByRole('button', { name: /start simulation/i }).nth(1).click()

    await expect(page).toHaveURL(/\/play\//)

    // B1: Choose B1-a
    await page.getByRole('button', { name: /Scan the QR to claim the refund/i }).click()
    await expect(page.getByRole('heading', { name: /Decision Outcome/i })).toBeVisible()
    await page.getByRole('button', { name: /Continue|See Final Results/i }).click()

    // B2: Choose B2-a
    await page.getByRole('button', { name: /Approve — it's needed for the refund/i }).click()
    await expect(page.getByRole('heading', { name: /Decision Outcome/i })).toBeVisible()
    await page.getByRole('button', { name: /Continue|See Final Results/i }).click()

    // Terminal: Loss
    await expect(page.getByText(/Simulated Financial Loss/i)).toBeVisible()
    await page.getByRole('button', { name: /See results/i }).click()
    await expect(page).toHaveURL(/\/results\//)
  })

  // Scenario C: urgent-bank-call
  test('Scenario C (Urgent Bank Call): Best Path to Safe Terminal', async ({ page }) => {
    // 3rd scenario card on library
    await page.getByRole('button', { name: /start simulation/i }).nth(2).click()

    await expect(page).toHaveURL(/\/play\//)

    // C1: Choose C1-b
    await page.getByRole('button', { name: /I'll hang up and call the number on my card/i }).click()
    await expect(page.getByRole('heading', { name: /Decision Outcome/i })).toBeVisible()
    await page.getByRole('button', { name: /Continue|See Final Results/i }).click()

    // C3: Choose C3-a
    await page.getByRole('button', { name: /Report the number via 1930/i }).click()
    await expect(page.getByRole('heading', { name: /Decision Outcome/i })).toBeVisible()
    await page.getByRole('button', { name: /Continue|See Final Results/i }).click()

    // Terminal: Safe
    await expect(page.getByText(/Threat Prevented Successfully/i)).toBeVisible()
    await page.getByRole('button', { name: /See results/i }).click()
    await expect(page).toHaveURL(/\/results\//)
  })

  test('Scenario C (Urgent Bank Call): Loss Path to Simulated Loss Terminal', async ({ page }) => {
    await page.getByRole('button', { name: /start simulation/i }).nth(2).click()

    await expect(page).toHaveURL(/\/play\//)

    // C1: Choose C1-a
    await page.getByRole('button', { name: /Answer questions and confirm my details/i }).click()
    await expect(page.getByRole('heading', { name: /Decision Outcome/i })).toBeVisible()
    await page.getByRole('button', { name: /Continue|See Final Results/i }).click()

    // C2: Choose C2-a
    await page.getByRole('button', { name: /Read the OTP out/i }).click()
    await expect(page.getByRole('heading', { name: /Decision Outcome/i })).toBeVisible()
    await page.getByRole('button', { name: /Continue|See Final Results/i }).click()

    // Terminal: Loss
    await expect(page.getByText(/Simulated Financial Loss/i)).toBeVisible()
    await page.getByRole('button', { name: /See results/i }).click()
    await expect(page).toHaveURL(/\/results\//)
  })
})
