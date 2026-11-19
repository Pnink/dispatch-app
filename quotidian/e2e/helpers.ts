import { AxeBuilder } from '@axe-core/playwright';
import { expect, test as base, type Page } from '@playwright/test';

import { STORAGE_KEY } from '../src/state/reducer';

/** Every test fails on a console error or an uncaught exception. */
export const test = base.extend<{ errors: string[] }>({
  errors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
      });
      page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
      await use(errors);
      expect(errors, 'console errors').toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };

/** Start as a returning user (onboarding done) with optional saved state. */
export async function seed(page: Page, state: Record<string, unknown> = {}) {
  const value = JSON.stringify({
    version: 1,
    profile: { name: '', goals: [], onboarded: true },
    hints: { swipe: false },
    ...state,
  });
  await page.addInitScript(
    ([key, v]) => {
      if (!window.sessionStorage.getItem('seeded')) {
        window.localStorage.setItem(key, v);
        window.sessionStorage.setItem('seeded', '1');
      }
    },
    [STORAGE_KEY, value],
  );
}

export async function readState(page: Page) {
  // the store saves 250 ms after the last change
  await page.waitForTimeout(400);
  return page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? 'null'), STORAGE_KEY);
}

const pageAtPoint = (page: Page) =>
  page.evaluate(() => {
    let el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight * 0.3) as HTMLElement | null;
    while (el && !/^quote-\d+-/.test(el.dataset.testid ?? '')) el = el.parentElement;
    return el?.dataset.testid ?? null;
  });

/** data-testid of the quote page filling the screen (quote-<round>-<quoteId>). Waits out modal transitions. */
export async function currentPageId(page: Page): Promise<string> {
  await expect.poll(() => pageAtPoint(page), { message: 'a quote page in view' }).not.toBeNull();
  return (await pageAtPoint(page))!;
}

export async function currentQuote(page: Page) {
  const testId = await currentPageId(page);
  const text = await page.getByTestId(testId).getByTestId('quote-text').textContent();
  return { id: testId.replace(/^quote-\d+-/, ''), testId, text: text ?? '' };
}

export async function swipeUp(page: Page) {
  const before = await page.evaluate(() => document.querySelector('[data-testid="feed"]')?.scrollTop ?? 0);
  await page.mouse.move(195, 400);
  await page.mouse.wheel(0, 844);
  await expect
    .poll(() => page.evaluate(() => document.querySelector('[data-testid="feed"]')?.scrollTop ?? 0))
    .toBeGreaterThan(before + 400);
  await page.waitForTimeout(600); // let scroll-snap settle
}

export async function openFeed(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('feed')).toBeVisible();
  await expect(page.getByTestId('quote-text').first()).toBeVisible();
}

export async function axe(page: Page) {
  // @axe-core/playwright is typed against its own copy of playwright-core
  const results = await new AxeBuilder({ page: page as never }).withTags(['wcag2a', 'wcag2aa']).analyze();
  return results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`);
}
