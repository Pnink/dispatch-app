const { chromium } = require('playwright');
const OUT = process.argv[2];
const B = 'http://localhost:3100';
(async () => {
  for (let i = 0; i < 30; i++) { try { await fetch(B); break; } catch { await new Promise(r => setTimeout(r, 500)); } }
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  const shot = (n, full = true) => page.screenshot({ path: `${OUT}/${n}.png`, fullPage: full });
  const step = (s) => console.log('✓', s);

  for (const [n, u] of [['S01-home', '/'], ['S02-costs', '/costs'], ['S03-faq', '/faq'], ['S04-about', '/about'], ['S05-examples', '/examples']]) {
    await page.goto(B + u); await page.waitForLoadState('networkidle'); await shot(n); step(n);
  }
  // costs calculator + old /pricing redirect
  await page.goto(B + '/pricing'); await page.waitForURL(/\/costs/);
  await page.getByRole('button', { name: 'Free tier' }).first().click();
  await page.getByText('fixed +').waitFor(); step('costs page + /pricing redirect');

  // F01 create from homepage prompt
  await page.goto(B + '/');
  await page.getByLabel('Describe your store idea').first().fill('A cosy coffee roaster with subscriptions, warm and earthy');
  await page.getByRole('button', { name: 'Generate store' }).first().click();
  await page.waitForURL(/\/create/); await page.waitForTimeout(1500); await shot('S06-generating', false);
  await page.getByText('Your store is ready to review').waitFor({ timeout: 15000 });
  await shot('S07-review', false); step('generated + review');
  await page.getByRole('button', { name: /Publish & open dashboard/ }).click();
  await page.waitForURL(/\/dashboard/); await page.waitForTimeout(500); await shot('S08-dashboard', false); step('dashboard');

  // assistant: discount
  const panel = page.getByRole('complementary', { name: 'Store assistant' });
  await panel.getByLabel('Message the assistant').fill('Create a 25% discount');
  await panel.getByRole('button', { name: 'Send' }).click();
  await panel.getByRole('button', { name: 'Create SAVE25' }).click();
  await panel.getByText('✓ Done').waitFor(); step('assistant created SAVE25');

  // products: add with AI draft
  await page.goto(B + '/dashboard/products');
  await page.getByRole('button', { name: 'Add product' }).first().click();
  await page.getByLabel('Product name').fill('Travel Mug');
  await page.getByRole('button', { name: /Draft with AI/ }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('dialog').getByRole('button', { name: 'Add product' }).click();
  await page.getByText('Travel Mug').first().waitFor(); await shot('S09-products', false); step('product added');

  // apps: turn on loyalty
  await page.goto(B + '/dashboard/apps');
  await page.getByRole('switch', { name: /Loyalty points off/ }).click();
  await shot('S11-apps', false); step('loyalty on');
  await page.goto(B + '/dashboard/email'); await shot('S12-email', false);
  await page.goto(B + '/dashboard/design'); await shot('S13-design', false);
  await page.goto(B + '/dashboard/settings'); await shot('S19-settings', false);

  // storefront
  const slug = await page.evaluate(() => JSON.parse(localStorage.getItem('wharf:v1')).stores[0].slug);
  await page.goto(`${B}/store/${slug}`);
  await page.getByRole('dialog').waitFor({ timeout: 6000 }); await shot('S14-popup', false);
  await page.keyboard.press('Escape'); step('popup shown + Esc closes');
  await shot('S14-storefront');
  await page.locator('#shop a').first().click(); await page.waitForURL(/\/p\//);
  await page.getByRole('button', { name: 'Add to cart' }).click(); await shot('S15-product');
  await page.goto(`${B}/store/${slug}/cart`); await shot('S16-cart', false); step('cart');
  await page.getByRole('link', { name: 'Check out' }).click(); await page.waitForURL(/checkout/);
  // validation
  await page.getByRole('button', { name: /^Pay/ }).click();
  await page.getByText('Enter a valid email.').waitFor(); step('checkout validation');
  await page.getByLabel('Email').fill('demo.shopper@test.dev');
  await page.getByLabel('Full name').fill('Demo Shopper');
  await page.getByLabel('Address').fill('1 Test Lane');
  await page.getByLabel('City').fill('Austin');
  await page.getByLabel('Postal code').fill('78701');
  await page.getByLabel('Discount code').fill('save25'); await page.getByRole('button', { name: 'Apply' }).click();
  await page.getByText('SAVE25 applied').waitFor(); step('discount applied');
  await page.getByLabel('Card number').fill('4000 0000 0000 0002');
  await page.getByLabel('Expiry (MM/YY)').fill('12/30'); await page.getByLabel('Security code').fill('123');
  await page.getByRole('button', { name: /^Pay/ }).click();
  await page.getByText('Your card was declined').waitFor(); await shot('S17-checkout-declined', false); step('decline shown');
  await page.getByLabel('Card number').fill('4242 4242 4242 4242');
  await page.getByRole('button', { name: /^Pay/ }).click();
  await page.waitForURL(/\/order\//); await page.getByText(/You earned \d+ points/).waitFor();
  await shot('S18-confirmed', false); step('order placed + loyalty points');

  await page.getByRole('link', { name: /See it in the merchant dashboard/ }).click();
  await page.getByRole('dialog').getByText('Demo Shopper').waitFor(); await shot('S10-orders', false);
  await page.getByRole('button', { name: 'Mark as fulfilled' }).click();
  await page.getByRole('dialog').getByText('Fulfilled', { exact: true }).waitFor(); step('fulfilled in dashboard');

  // mobile
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
  m.on('pageerror', e => errors.push('mobile pageerror: ' + e.message));
  await m.goto(B + '/'); await m.screenshot({ path: `${OUT}/S01-home-mobile.png`, fullPage: true });
  const overflow = await m.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  console.log('mobile horizontal overflow on home:', overflow);

  console.log('console errors:', errors.length ? errors : 'none');
  await browser.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
