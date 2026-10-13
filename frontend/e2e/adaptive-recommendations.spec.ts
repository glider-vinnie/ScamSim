import { test, expect } from '@playwright/test'

test.describe('Adaptive Learning & Recommendations', () => {
  test('Poor performance on Scenario A recommends Scenario A for reinforcement', async ({
    page,
  }) => {
    // Fresh client
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem('scamsim_client_id', crypto.randomUUID())
    })

    await page.goto('/library')
    const startBtn = page.getByRole('button', { name: /start simulation/i }).first()
    await startBtn.click()

    // Poor decision path: A1-a -> Loss
    await page.getByRole('button', { name: /Hand it over — screenshot looks fine/i }).click()
    await page.getByRole('button', { name: /Continue|See Final Results/i }).click()
    await page.getByRole('button', { name: /See results/i }).click()
    await expect(page).toHaveURL(/\/results\//)
    await expect(page.getByText('Simulation Results')).toBeVisible()

    // Check Progress page recommendation
    await page.goto('/progress')
    const recSection = page.locator('div', { hasText: 'Recommended Next' })
    await expect(recSection.getByText(/The "Payment Screenshot" Ruse/i).first()).toBeVisible()
    await expect(page.getByText(/You're weakest at/i)).toBeVisible()
  })

  test('High performance on Scenario A recommends Scenario C based on lowest skill', async ({
    page,
  }) => {
    // Fresh client
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem('scamsim_client_id', crypto.randomUUID())
    })

    await page.goto('/library')
    const startBtn = page.getByRole('button', { name: /start simulation/i }).first()
    await startBtn.click()

    // Perfect decision path: A1-b -> A3-b -> Safe (score 100)
    await page.getByRole('button', { name: /Check my own UPI app for the credit first/i }).click()
    await page.getByRole('button', { name: /Continue|See Final Results/i }).click()

    await page.getByRole('button', { name: /Decline politely; offer to meet once payment shows/i }).click()
    await page.getByRole('button', { name: /Continue|See Final Results/i }).click()

    await expect(page.getByText(/Threat Prevented Successfully/i)).toBeVisible()
    await page.getByRole('button', { name: /See results/i }).click()
    await expect(page).toHaveURL(/\/results\//)
    await expect(page.getByText('Simulation Results')).toBeVisible()

    // Check Progress page recommendation
    await page.goto('/progress')
    await expect(page.getByRole('heading', { name: /Your Scam Defense Profile/i })).toBeVisible()
    const recSection = page.locator('div', { hasText: 'Recommended Next Practice' })
    await expect(recSection.getByText(/The Urgent Fraud Department Call/i).first()).toBeVisible()
  })
})
