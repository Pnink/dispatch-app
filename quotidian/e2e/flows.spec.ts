import { QUOTES } from '../src/data/quotes';
import { axe, currentQuote, expect, openFeed, readState, seed, swipeUp, test } from './helpers';

const calmTexts = new Set(QUOTES.filter((q) => q.categories.includes('calm')).map((q) => q.text));

test.describe('F07 first launch', () => {
  test('H1: onboarding sets name, goals, theme and lands on a greeting', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Words for the days you need them.')).toBeVisible();
    await page.getByTestId('onboarding-next').click();
    await page.getByRole('textbox', { name: 'Your name' }).fill('Sam');
    await page.getByTestId('onboarding-next').click();
    await page.getByTestId('goal-calm').click();
    await expect(page.getByTestId('goal-calm')).toHaveAttribute('aria-checked', 'true');
    await page.getByTestId('onboarding-next').click();
    await page.getByTestId('onboarding-next').click(); // turn on reminders (web: stored for the phone)
    await page.getByTestId('theme-paper').click();
    await page.getByTestId('onboarding-finish').click();

    await expect(page.getByText(/^(Good (morning|afternoon|evening)|Still up), Sam\.$/)).toBeVisible();
    const s = await readState(page);
    expect(s.profile).toMatchObject({ name: 'Sam', goals: ['calm'], onboarded: true });
    expect(s.themeId).toBe('paper');
    expect(s.reminders.enabled).toBe(true);
  });

  test('E1: skipping every step still works', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('onboarding-next').click();
    await page.getByTestId('onboarding-skip').click();
    await page.getByTestId('onboarding-skip').click();
    await page.getByTestId('onboarding-skip').click();
    await page.getByTestId('onboarding-finish').click();
    await expect(page.getByTestId('feed')).toBeVisible();
    await expect(page.getByTestId('quote-text').first()).toBeVisible(); // no name, no greeting page
    const s = await readState(page);
    expect(s.reminders.enabled).toBe(false);
  });

  test('E2: a returning user skips onboarding', async ({ page }) => {
    await seed(page);
    await openFeed(page);
    await expect(page.getByText('Words for the days you need them.')).toHaveCount(0);
  });
});

test.describe('F01 read and like', () => {
  test('H1: swipe to the next quote, heart it, and it is saved', async ({ page }) => {
    await seed(page);
    await openFeed(page);
    const first = await currentQuote(page);
    await swipeUp(page);
    const second = await currentQuote(page);
    expect(second.text).not.toBe(first.text);

    const like = page.getByTestId(second.testId).getByTestId('like');
    await expect(like).toHaveAccessibleName('Add to favorites');
    await like.click();
    await expect(like).toHaveAccessibleName('Remove from favorites');
    expect((await readState(page)).favorites.map((f: { quoteId: string }) => f.quoteId)).toEqual([second.id]);
  });

  test('H2: double tap likes; a second double tap does not unlike', async ({ page }) => {
    await seed(page);
    await openFeed(page);
    const q = await currentQuote(page);
    const quotePage = page.getByTestId(q.testId);
    await quotePage.dblclick({ position: { x: 40, y: 120 } });
    await expect(quotePage.getByTestId('like')).toHaveAccessibleName('Remove from favorites');
    await quotePage.dblclick({ position: { x: 40, y: 120 } });
    await expect(quotePage.getByTestId('like')).toHaveAccessibleName('Remove from favorites');
  });

  test('E1: favorites and history survive a reload', async ({ page }) => {
    await seed(page);
    await openFeed(page);
    const q = await currentQuote(page);
    await page.getByTestId(q.testId).getByTestId('like').click();
    await readState(page);
    await page.reload();
    await expect(page.getByTestId('feed')).toBeVisible();
    const s = await readState(page);
    expect(s.favorites[0].quoteId).toBe(q.id);
    expect(s.history.length).toBeGreaterThan(0);
  });

  test('E2: an endless feed keeps going past the last quote', async ({ page }) => {
    await seed(page, { feed: { mode: 'source', source: 'hard-times', mix: [], seed: 5 } });
    await openFeed(page);
    const count = QUOTES.filter((q) => q.categories.includes('hard-times')).length;
    for (let i = 0; i < count + 2; i++) await swipeUp(page);
    await expect(page.getByTestId('quote-text').first()).toBeVisible();
    expect((await currentQuote(page)).text.length).toBeGreaterThan(0);
  });
});

test.describe('F02 share', () => {
  test('H1: on desktop web, share copies the quote to the clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await seed(page);
    await openFeed(page);
    const q = await currentQuote(page);
    await page.getByTestId(q.testId).getByTestId('share').click();
    await expect(page.getByText('Copied to clipboard')).toBeVisible();
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toContain(q.text);
  });
});

test.describe('F03 categories', () => {
  test('H1: pick a topic and the feed only shows that topic', async ({ page }) => {
    await seed(page);
    await openFeed(page);
    await page.getByTestId('open-categories').click();
    await page.getByTestId('topic-calm').click();
    await expect(page.getByTestId('open-categories')).toContainText('Calm');
    for (let i = 0; i < 3; i++) {
      expect(calmTexts.has((await currentQuote(page)).text)).toBe(true);
      await swipeUp(page);
    }
  });

  test('H2: make a mix of two topics', async ({ page }) => {
    await seed(page);
    await openFeed(page);
    await page.getByTestId('open-categories').click();
    await page.getByTestId('mix-toggle').click();
    await expect(page.getByTestId('apply-mix')).toBeDisabled();
    await page.getByTestId('topic-calm').click();
    await page.getByTestId('topic-courage').click();
    await page.getByTestId('apply-mix').click();
    await expect(page.getByTestId('open-categories')).toContainText('Your mix');
    const text = (await currentQuote(page)).text;
    const found = QUOTES.find((x) => x.text === text)!;
    expect(found.categories.some((c) => c === 'calm' || c === 'courage')).toBe(true);
  });

  test('H3: search, then open a result at the top of the feed', async ({ page }) => {
    await seed(page);
    await openFeed(page);
    await page.getByTestId('open-categories').click();
    await page.getByTestId('search').fill('seneca');
    await expect(page.getByTestId('search-results')).toContainText('results');
    await page.getByText('No man was ever wise by chance.').click();
    await expect(page.getByTestId('feed')).toBeVisible();
    expect((await currentQuote(page)).text).toBe('No man was ever wise by chance.');
  });

  test('E1: a search with no match says so', async ({ page }) => {
    await seed(page);
    await page.goto('/categories');
    await page.getByTestId('search').fill('zzzqqq');
    await expect(page.getByText('Nothing matches')).toBeVisible();
  });

  test('E2: favorites with nothing saved shows an empty state with a way out', async ({ page }) => {
    await seed(page);
    await openFeed(page);
    await page.getByTestId('open-categories').click();
    await page.getByTestId('source-favorites').click();
    await expect(page.getByText('No favorites yet')).toBeVisible();
    await page.getByRole('button', { name: 'Read all quotes' }).click();
    await expect(page.getByTestId('open-categories')).toContainText('All quotes');
  });
});

test.describe('F04 themes', () => {
  test('H1: pick a built-in theme', async ({ page }) => {
    await seed(page);
    await openFeed(page);
    await page.getByTestId('open-themes').click();
    await page.getByTestId('theme-paper').click();
    await expect(page.getByTestId('quote-text').first()).toHaveCSS('color', 'rgb(28, 26, 23)');
  });

  test('H2: build a custom theme; low contrast is flagged', async ({ page }) => {
    await seed(page);
    await openFeed(page);
    await page.getByTestId('open-themes').click();
    await page.getByTestId('create-theme').click();
    await page.getByRole('radio', { name: 'Background #ffffff' }).click();
    await page.getByTestId('text-ffffff').click();
    await expect(page.getByTestId('contrast-warning')).toBeVisible();
    await page.getByTestId('text-000000').click();
    await expect(page.getByTestId('contrast-warning')).toHaveCount(0);
    await page.getByTestId('font-mono').click();
    await page.getByTestId('save-theme').click();
    await expect(page.getByTestId('feed')).toBeVisible();
    await expect(page.getByTestId('quote-text').first()).toHaveCSS('color', 'rgb(0, 0, 0)');
    const s = await readState(page);
    expect(s.themeId).toBe('custom');
    expect(s.custom.font).toBe('mono');
  });
});

test.describe('F05 your own quotes', () => {
  test('H1: write, read in the feed, edit, delete', async ({ page }) => {
    page.on('dialog', (d) => d.accept());
    await seed(page);
    await openFeed(page);
    await page.getByTestId('open-profile').click();
    await page.getByTestId('row-own').click();
    await page.getByTestId('add-own-empty').click();

    await page.getByTestId('own-save').click();
    await expect(page.getByText('Write something first.')).toBeVisible();

    await page.getByTestId('own-text').fill('Keep the promise you made at 6 a.m.');
    await page.getByTestId('own-author').fill('Me');
    await page.getByTestId('own-save').click();
    await expect(page.getByTestId('own-row')).toHaveCount(1);

    await page.getByRole('button', { name: 'Read them in the feed' }).click();
    await expect(page.getByTestId('open-categories')).toContainText('Your quotes');
    expect((await currentQuote(page)).text).toBe('Keep the promise you made at 6 a.m.');

    await page.getByTestId('open-profile').click();
    await page.getByTestId('row-own').click();
    await page.getByRole('button', { name: 'Edit quote' }).click();
    await page.getByTestId('own-text').fill('Keep the promise you made at 7 a.m.');
    await page.getByTestId('own-save').click();
    await expect(page.getByTestId('own-row')).toContainText('7 a.m.');

    await page.getByRole('button', { name: 'Edit quote' }).click();
    await page.getByTestId('own-delete').click();
    await expect(page.getByText('Nothing written yet')).toBeVisible();
  });

  test('E1: too long is refused with a counter', async ({ page }) => {
    await seed(page);
    await page.goto('/own-quote');
    await page.getByTestId('own-text').fill('x'.repeat(300));
    await page.getByTestId('own-save').click();
    await expect(page.getByText('Keep it under 280 characters.')).toBeVisible();
    await expect(page.getByText('300/280')).toBeVisible();
  });
});

test.describe('F06 reminders', () => {
  test('H1: on web, times are saved for the phone app and shown in the profile', async ({ page }) => {
    await seed(page);
    await openFeed(page);
    await page.getByTestId('open-profile').click();
    await page.getByTestId('row-reminders').click();
    await expect(page.getByTestId('reminders-web')).toBeVisible();
    await page.getByTestId('reminders-enabled').click();
    await page.getByRole('button', { name: 'Increase how many' }).click();
    await expect(page.getByTestId('reminders-summary')).toHaveText('4 quotes a day between 9:00 AM and 9:00 PM.');
    await page.getByTestId('reminders-save').click();
    await expect(page.getByTestId('row-reminders')).toContainText('4× a day');
    expect((await readState(page)).reminders).toMatchObject({ enabled: true, perDay: 4 });
  });

  test('E1: start after end is blocked', async ({ page }) => {
    await seed(page, { reminders: { enabled: true, perDay: 3, start: 9 * 60, end: 9 * 60 + 30, source: 'all' } });
    await page.goto('/reminders');
    await page.getByRole('button', { name: 'Decrease end at' }).click();
    await expect(page.getByTestId('reminders-error')).toBeVisible();
    await expect(page.getByTestId('reminders-save')).toBeDisabled();
  });
});

test.describe('library screens', () => {
  test('favorites list: unlike and open in the feed', async ({ page }) => {
    await seed(page, {
      favorites: [
        { quoteId: 'c9', at: 2 },
        { quoteId: 'o2', at: 1 },
      ],
    });
    await page.goto('/favorites');
    await expect(page.getByTestId('favorite-row')).toHaveCount(2);
    await page.getByRole('button', { name: 'Remove from favorites' }).first().click();
    await expect(page.getByTestId('favorite-row')).toHaveCount(1);
    await page.getByText('This is a chapter, not the whole book.').click();
    await expect(page.getByTestId('open-categories')).toContainText('Favorites');
    expect((await currentQuote(page)).text).toBe('This is a chapter, not the whole book.');
    await swipeUp(page);
    await expect(page.getByText("That's all of them.")).toBeVisible();
  });

  test('history lists what was read and can be cleared', async ({ page }) => {
    page.on('dialog', (d) => d.accept());
    await seed(page);
    await openFeed(page);
    await swipeUp(page);
    await swipeUp(page);
    await page.getByTestId('open-profile').click();
    await page.getByTestId('row-history').click();
    await expect(page.getByTestId('history-row')).toHaveCount(3);
    await page.getByTestId('clear-history').click();
    await expect(page.getByText('Nothing read yet')).toBeVisible();
  });

  test('name edits from the profile', async ({ page }) => {
    await seed(page);
    await page.goto('/profile');
    await page.getByTestId('name-input').fill('Riley');
    await page.getByTestId('name-input').blur();
    expect((await readState(page)).profile.name).toBe('Riley');
  });
});

test.describe('layout and accessibility', () => {
  for (const path of ['/', '/categories', '/themes', '/profile', '/reminders', '/theme-editor']) {
    test(`no WCAG A/AA violations on ${path}`, async ({ page }) => {
      await seed(page);
      await page.goto(path);
      await page.waitForTimeout(600);
      expect(await axe(page)).toEqual([]);
    });
  }

  test('no WCAG A/AA violations in onboarding', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(600);
    expect(await axe(page)).toEqual([]);
  });

  test('a very long quote still fits one screen', async ({ page }) => {
    await seed(page);
    await page.goto('/categories');
    await page.getByTestId('search').fill('advances confidently');
    await page.getByText(/If one advances confidently/).click();
    const box = await page.getByTestId('quote-text').first().boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThan(0);
    expect(box!.y + box!.height).toBeLessThan(844 - 120); // clear of the bottom bar
  });
});
