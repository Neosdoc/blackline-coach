const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await (await browser.newContext({ viewport: { width: 380, height: 800 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + require('path').resolve(__dirname, '..', 'public', 'index.html') + '');
  await page.waitForTimeout(600);
  const home = await page.textContent('#v-home');
  const okBoot = errors.length === 0 && home.includes("4'10") && home.includes('Forme du jour');
  // brief copié = version neutre + état actuel
  const brief = await page.evaluate(() => BRIEF);
  const okBrief = brief.includes('version publiée') && !/Nyons|EPMS|tendinopathie/.test(brief);
  // saisie + persistance
  await page.click('.daycard.force');
  await page.waitForTimeout(300);
  await page.fill('#bi-dur', '40'); await page.fill('#bi-rpe', '7');
  await page.click('text=Terminer'); await page.waitForTimeout(1100);
  await page.reload(); await page.waitForTimeout(500);
  await page.click('.nav button[data-v="journal"]');
  const persist = (await page.textContent('#v-journal')).includes('280 UA');
  console.log('boot:', okBoot, '| brief neutre:', okBrief, '| persistance:', persist, '| erreurs:', errors.length);
  await browser.close();
  process.exit(okBoot && okBrief && persist ? 0 : 1);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
