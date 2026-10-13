import { test, expect } from '@playwright/test'

test.describe('Session Controls & State Persistence', () => {
  test('Refresh mid-scenario preserves current node and resumes gracefully', async ({ page }) => {
    await page.goto('/library')
    const startBtn = page.getByRole('button', { name: /start simulation/i }).first()
    await startBtn.click()

    await expect(page).toHaveURL(/\/play\//)
    await expect(page.getByText(/Step 1 of ~3/i)).toBeVisible()

    // Answer first decision point
    await page.getByRole('button', { name: /Check my own UPI app for the credit first/i }).click()
    await page.getByRole('button', { name: /Continue/i }).click()

    // Now at Step 2
    await expect(page.getByText(/Step 2 of ~3/i)).toBeVisible()
    const playUrl = page.url()

    // Reload the page
    await page.reload()

    // Should resume at Step 2 without state loss or conflict
    await expect(page).toHaveURL(playUrl)
    await expect(page.getByText(/Step 2 of ~3/i)).toBeVisible()
    await expect(
      page.getByRole('button', { name: /Decline politely; offer to meet once payment shows/i }),
    ).toBeVisible()
  })

  test('Restart simulation shows confirmation dialog and resets session to Step 1', async ({ page }) => {
    await page.goto('/library')
    const startBtn = page.getByRole('button', { name: /start simulation/i }).first()
    await startBtn.click()

    await expect(page).toHaveURL(/\/play\//)
    const initialUrl = page.url()

    // Advance to Step 2
    await page.getByRole('button', { name: /Check my own UPI app for the credit first/i }).click()
    await page.getByRole('button', { name: /Continue/i }).click()
    await expect(page.getByText(/Step 2 of ~3/i)).toBeVisible()

    // Click Restart button
    await page.getByRole('button', { name: /Restart/i }).click()
    await expect(page.getByText(/Restart Simulation\?/i)).toBeVisible()

    // Confirm restart
    await page.getByRole('button', { name: /Confirm Restart/i }).click()

    // New session started at Step 1
    await expect(page.getByText(/Step 1 of ~3/i)).toBeVisible()
    const newUrl = page.url()
    expect(newUrl).not.toEqual(initialUrl)
  })
})
