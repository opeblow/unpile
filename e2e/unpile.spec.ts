import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Freeze the date (Thursday 22 Oct 2026) so due-date logic is deterministic. Timers still run.
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-22T10:00:00'));
});

async function loadSample(page: Page) {
  await page.goto('/#dump');
  await page.getByRole('button', { name: 'Try it with a sample messy list' }).click();
  await expect(page.getByRole('heading', { name: 'Here’s what I found' })).toBeVisible();
  await page.getByRole('button', { name: /Add 12 things to my pile/ }).click();
  await expect(page.getByRole('heading', { name: 'What fits right now?' })).toBeVisible();
}

async function setCheckin(page: Page, energy: string, minutes: string) {
  await page.getByRole('radio', { name: energy, exact: true }).check();
  await page.getByRole('radio', { name: minutes, exact: true }).check();
}

const oneTitle = (page: Page) => page.locator('#one-title');

test('landing page explains the product and leads into the app', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Your list is long.');
  await expect(page.getByText('Three steps. One at a time.')).toBeVisible();
  await page.getByRole('button', { name: 'Try a sample list' }).click();
  await expect(page.getByRole('heading', { name: 'What’s on your mind?' })).toBeVisible();
  await expect(page.locator('#dump')).toHaveValue(/history essay due friday/);
});

test('brain dump parses messy text into clean tasks', async ({ page }) => {
  await page.goto('/#dump');
  await page.locator('#dump').fill('ugh ok\nI need to finish history essay by friday!! #school\nread chapter 4 (40 min)\nlaundry, dishes, bins');
  const found = page.locator('.preview .row-title');
  await expect(found).toHaveText(['Finish history essay', 'Read chapter 4', 'Laundry', 'Dishes', 'Bins']);
  const first = page.locator('.preview .row').first();
  await expect(first).toContainText('Urgent');
  await expect(first).toContainText('Due tomorrow');
  await expect(first).toContainText('#school');
  await expect(page.locator('.preview .row').nth(1)).toContainText('~40 min');
});

test('the one thing changes with energy and time', async ({ page }) => {
  await loadSample(page);
  await setCheckin(page, 'Running low', '5 minutes');
  await expect(oneTitle(page)).toHaveText('Pay school fees');
  await setCheckin(page, 'Sharp', '90 minutes or more');
  await expect(oneTitle(page)).toHaveText('History essay');
  await page.getByText('Why this one?').click();
  await expect(page.locator('.why p')).toContainText('weighed deadlines');
});

test('show me another, park and undo', async ({ page }) => {
  await loadSample(page);
  const first = await oneTitle(page).textContent();
  await page.getByRole('button', { name: /Show me another/ }).click();
  await expect(oneTitle(page)).not.toHaveText(first!);

  const second = await oneTitle(page).textContent();
  await page.getByRole('button', { name: /Park it for later/ }).click();
  await expect(page.locator('.toast')).toContainText('Parked');
  await expect(oneTitle(page)).not.toHaveText(second!);
  await page.locator('.toast').getByRole('button', { name: 'Undo' }).click();
  await page.getByRole('button', { name: /^Pile/ }).click();
  await expect(page.getByRole('region', { name: 'Parked' })).toHaveCount(0);
});

test('shrink a big task, then work through its steps with the timer', async ({ page }) => {
  await loadSample(page);
  await setCheckin(page, 'Sharp', '90 minutes or more');
  await page.getByRole('button', { name: /Too big — shrink it/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('“History essay” in tiny steps');
  await dialog.getByLabel('Step 1', { exact: true }).fill('Open the essay doc');
  await dialog.getByRole('button', { name: 'Use these steps' }).click();

  await expect(oneTitle(page)).toHaveText('Open the essay doc');
  await expect(page.locator('.one')).toContainText('Step 1 of 5');

  await page.getByRole('button', { name: /^Start · 3 min/ }).click();
  const focus = page.getByRole('dialog', { name: 'Open the essay doc' });
  await expect(focus.getByRole('timer')).toBeVisible();
  await focus.getByRole('button', { name: 'Pause' }).click();
  await expect(focus.getByRole('button', { name: 'Resume' })).toBeVisible();
  await focus.getByRole('button', { name: 'I did it' }).click();

  await expect(page.locator('.one')).toContainText('Step 2 of 5');
  await expect(oneTitle(page)).toHaveText('Dump 5 messy bullet points — no full sentences yet');

  await page.getByRole('button', { name: /^Wins/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('You did 1 thing today.');
});

test('keyboard shortcuts work on the Now screen', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard shortcuts are a desktop feature');
  await loadSample(page);
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  const before = await oneTitle(page).textContent();
  await page.keyboard.press('d');
  await expect(page.locator('.toast')).toContainText(`Done: “${before}”`);
  await page.keyboard.press('s');
  await expect(page.getByRole('dialog')).toContainText('in tiny steps');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('pile edits persist after reload', async ({ page }) => {
  await loadSample(page);
  await page.getByRole('button', { name: /^Pile/ }).click();
  await page.getByRole('button', { name: 'Edit “Call mum”' }).click();
  await page.locator('.row form input').first().fill('Call mum back about Sunday');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Call mum back about Sunday')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Call mum back about Sunday')).toBeVisible();
});

test('share writes a formal update from real progress', async ({ page }) => {
  await loadSample(page);
  await page.getByRole('button', { name: /Already done/ }).click();
  await page.getByRole('button', { name: /^Share/ }).click();
  await page.getByLabel('Who’s it for?').fill('Dr. Okafor');
  await page.getByLabel('Your name').fill('Ada');
  await page.getByRole('radio', { name: 'Formal' }).check();
  await page.getByLabel(/Anything you need help with/).fill('the essay question');
  const letter = page.locator('#letter');
  await expect(letter).toHaveValue(/^Hello Dr\. Okafor,/);
  await expect(letter).toHaveValue(/Completed:\n• Pay school fees/);
  await expect(letter).toHaveValue(/I would appreciate help with: the essay question/);
  await expect(letter).toHaveValue(/Thank you,\nAda$/);
});

test('comfort settings apply and persist', async ({ page }) => {
  await loadSample(page);
  await page.getByRole('button', { name: /Comfort/ }).click();
  await page.getByRole('radio', { name: 'Extra large' }).check();
  await page.getByRole('switch', { name: /High contrast/ }).check();
  await page.getByRole('radio', { name: 'Lexend' }).check();
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-contrast', 'high');
  await expect(html).toHaveAttribute('data-font', 'lexend');
  await page.reload();
  await expect(html).toHaveAttribute('data-contrast', 'high');
  expect(await html.evaluate((el) => getComputedStyle(el).getPropertyValue('--scale').trim())).toBe('1.3');
});

test('no page scrolls sideways', async ({ page }) => {
  await page.goto('/');
  for (const hash of ['home', 'dump', 'now', 'pile', 'done', 'share']) {
    if (hash === 'now') await loadSample(page);
    else await page.goto(`/#${hash}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `#${hash} overflows by ${overflow}px`).toBeLessThanOrEqual(1);
  }
});

test('no serious accessibility violations on any screen', async ({ page }) => {
  await page.goto('/');
  const check = async (name: string) => {
    await page.waitForTimeout(1200); // let entrance animations finish
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).exclude('.hero-art').analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => `${name}: ${v.id} — ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  };
  await check('landing');
  await loadSample(page);
  await check('now');
  for (const tab of [/^Pile/, /^Wins/, /^Share/]) {
    await page.getByRole('button', { name: tab }).click();
    await check(String(tab));
  }
});
