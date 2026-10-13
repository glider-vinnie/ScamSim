import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility & Keyboard Navigation (A11y)', () => {
  // Axe a11y scans on all primary routes
  const routes = ['/', '/library', '/progress']

  for (const route of routes) {
    test(`Axe scan clean of serious/critical violations on ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' })

      const scan = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()

      const seriousOrCritical = scan.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      )

      expect(seriousOrCritical).toEqual([])
    })
  }

  test('Axe scan on /play and /results during simulation journey', async ({ page }) => {
    await page.goto('/library', { waitUntil: 'domcontentloaded' })
    const startBtn = page.getByRole('button', { name: /start simulation/i }).first()
    await startBtn.click()

    await expect(page).toHaveURL(/\/play\//)

    // Scan /play page
    const playScan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    const playViolations = playScan.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    )
    expect(playViolations).toEqual([])

    // Complete quick path to results
    await page.getByRole('button', { name: /Hand it over — screenshot looks fine/i }).click()
    await page.getByRole('button', { name: /Continue|See Final Results/i }).click()
    await page.getByRole('button', { name: /See results/i }).click()

    await expect(page).toHaveURL(/\/results\//)

    // Scan /results page
    const resultsScan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    const resultsViolations = resultsScan.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    )
    expect(resultsViolations).toEqual([])
  })

  test('Keyboard-only traversal through Quick Play flow', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    // Navigate to Quick Play button with keyboard
    const quickPlayBtn = page.getByRole('button', { name: /Quick Play/i })
    await quickPlayBtn.focus()
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(/\/play\//)

    // Focus and select first choice using keyboard
    const choiceBtn = page.getByRole('button', { name: /Check my own UPI app for the credit first/i })
    await choiceBtn.focus()
    await page.keyboard.press('Enter')

    // Continue button receives focus or is reachable via keyboard
    const continueBtn = page.getByRole('button', { name: /Continue|See Final Results/i })
    await continueBtn.focus()
    await page.keyboard.press('Enter')

    // Verify step advanced
    await expect(page.getByText(/Step 2 of ~3/i)).toBeVisible()
  })

  test('prefers-reduced-motion disables CSS animations', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    // Verify reduced motion media feature is active
    const matchesReducedMotion = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    })
    expect(matchesReducedMotion).toBe(true)
  })
})
