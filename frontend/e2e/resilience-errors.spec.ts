import { test, expect } from '@playwright/test'

test.describe('Error Resilience & Route Interception', () => {
  test('Simulated 500 server error displays friendly error alert with retry CTA', async ({
    page,
  }) => {
    await page.goto('/library')
    const startBtn = page.getByRole('button', { name: /start simulation/i }).first()
    await startBtn.click()

    await expect(page).toHaveURL(/\/play\//)

    // Intercept decision submission to return 500
    await page.route('**/api/sessions/*/decisions', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Simulated internal server failure.',
          },
        }),
      })
    })

    // Click choice
    await page.getByRole('button', { name: /Check my own UPI app for the credit first/i }).click()

    // Expect friendly error banner
    await expect(page.getByText(/Connection Issue/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Retry/i })).toBeVisible()
  })

  test('Simulated backend down / network offline displays recoverable error state', async ({
    page,
  }) => {
    // Intercept session creation to abort network request
    await page.route('**/api/sessions', async (route) => {
      await route.abort('failed')
    })

    await page.goto('/library')
    const startBtn = page.getByRole('button', { name: /start simulation/i }).first()
    await startBtn.click()

    // Alert or error notification displayed without unhandled crash
    await expect(
      page.getByText(/Failed to fetch|Could not launch simulation session|Failed to retrieve|Unable to/i),
    ).toBeVisible()
  })
})
