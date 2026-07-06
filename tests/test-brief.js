const { chromium } = require('playwright-core');
const path = require('path');
const FILE = 'file://' + require('path').resolve(__dirname, '..', 'blackline-coach.html');
const SHOT = p => path.join(__dirname, p);

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const results = [];
  const ok = (name, cond, extra) => { results.push((cond ? 'PASS' : 'FAIL') + ' — ' + name + (extra ? ' [' + extra + ']' : '')); };

  const ctx = await browser.newContext({ viewport: { width: 380, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(FILE);
  await page.waitForTimeout(500);

  // données réalistes pour les scènes charge/garde-fous
  await page.evaluate(() => {
    const now = Date.now();
    for (let w = 0; w < 6; w++) {
      for (let d = 0; d < 4; d++) {
        App.journal.push({ date: now - (w * 7 + d) * 864e5, week: 8 - w, title: d % 2 ? 'VMA' : 'Force A · Bas du corps', cat: d % 2 ? 'run' : 'force', dur: 45 + d * 5, rpe: 6 + (d % 3), km: d % 2 ? 8 : 0, load: (45 + d * 5) * (6 + (d % 3)), done: 5, tot: 5, note: '' });
      }
    }
    App.achilles.unshift({ date: now, score: 2 });
    App.persist(); App.renderHome();
  });

  ok('bouton Lancer le briefing présent', (await page.textContent('#v-home')).includes('Mode briefing'));
  await page.click('text=Lancer le briefing');
  await page.waitForTimeout(600);
  ok('briefing ouvert', await page.$eval('#briefing', el => el.classList.contains('show')));
  let stage = await page.textContent('#bf-stage');
  ok('S1 : wordmark BLACKLINE', stage.includes('BLACK'));
  ok('dots de progression (6 scènes)', (await page.$$('.bf-dot')).length === 6);
  await page.screenshot({ path: SHOT('bf-s1.png') });

  // avance manuelle : S2 mission
  await page.click('#bf-stage');
  await page.waitForTimeout(1600);
  stage = await page.textContent('#bf-stage');
  ok('S2 : ordre de mission + objectif', stage.includes('Ordre de mission') && stage.includes("4'10"));
  ok('S2 : compteurs VMA', stage.includes('19,5') || stage.includes('19'), '');
  await page.screenshot({ path: SHOT('bf-s2.png') });

  // S3 semaine
  await page.click('#bf-stage');
  await page.waitForTimeout(2600);
  stage = await page.textContent('#bf-stage');
  ok('S3 : architecture hebdo (8 lignes)', stage.includes('Architecture hebdomadaire') && stage.includes('Force A') && stage.includes('Repos complet'));
  await page.screenshot({ path: SHOT('bf-s3.png') });

  // S4 charge
  await page.click('#bf-stage');
  await page.waitForTimeout(2600);
  ok('S4 : canvas charge rendu', !!(await page.$('#bf-chart')));
  await page.screenshot({ path: SHOT('bf-s4.png') });

  // S5 garde-fous
  await page.click('#bf-stage');
  await page.waitForTimeout(2600);
  stage = await page.textContent('#bf-stage');
  ok('S5 : 4 garde-fous', stage.includes('MONOTONIE') && stage.includes('ACWR') && stage.includes('ACHILLE') && stage.includes('HSR'));
  await page.screenshot({ path: SHOT('bf-s5.png') });

  // S6 final + fermeture par tap
  await page.click('#bf-stage');
  await page.waitForTimeout(1600);
  stage = await page.textContent('#bf-stage');
  ok('S6 : tampon final', stage.includes('En ordre de marche') || stage.includes('EN ORDRE DE MARCHE'));
  await page.screenshot({ path: SHOT('bf-s6.png') });
  await page.click('#bf-stage');
  await page.waitForTimeout(400);
  ok('tap final ferme le briefing', !(await page.$eval('#briefing', el => el.classList.contains('show'))));

  // réouverture + Échap
  await page.click('text=Lancer le briefing');
  await page.waitForTimeout(400);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  ok('Échap ferme', !(await page.$eval('#briefing', el => el.classList.contains('show'))));

  // bouton son
  await page.click('text=Lancer le briefing');
  await page.waitForTimeout(300);
  await page.click('#bf-snd');
  ok('toggle son', (await page.textContent('#bf-snd')).toLowerCase().includes('off'));
  await page.keyboard.press('Escape');

  // reduced motion : rendu statique sans erreur
  const ctx2 = await browser.newContext({ viewport: { width: 380, height: 800 }, reducedMotion: 'reduce' });
  const page2 = await ctx2.newPage();
  const errors2 = [];
  page2.on('pageerror', e => errors2.push(String(e)));
  await page2.goto(FILE);
  await page2.waitForTimeout(400);
  await page2.click('text=Lancer le briefing');
  await page2.waitForTimeout(600);
  ok('reduced-motion : briefing s\'ouvre', await page2.$eval('#briefing', el => el.classList.contains('show')));
  await page2.click('#bf-stage'); await page2.waitForTimeout(300);
  const st2 = await page2.textContent('#bf-stage');
  ok('reduced-motion : contenu statique complet', st2.includes('Ordre de mission'));
  ok('reduced-motion : zéro erreur', errors2.length === 0, errors2.join('|').slice(0, 200));
  await ctx2.close();

  // desktop screenshot
  const ctx3 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page3 = await ctx3.newPage();
  await page3.goto(FILE);
  await page3.waitForTimeout(400);
  await page3.evaluate(() => {
    const now = Date.now();
    for (let w = 0; w < 6; w++) for (let d = 0; d < 4; d++)
      App.journal.push({ date: now - (w * 7 + d) * 864e5, week: 8 - w, title: 'VMA', cat: 'run', dur: 50, rpe: 7, km: 8, load: 350, done: 5, tot: 5, note: '' });
    App.persist();
  });
  await page3.click('text=Lancer le briefing');
  await page3.waitForTimeout(400);
  await page3.click('#bf-stage'); await page3.waitForTimeout(200);
  await page3.click('#bf-stage'); await page3.waitForTimeout(200);
  await page3.click('#bf-stage'); await page3.waitForTimeout(2200); // S4 charge
  await page3.screenshot({ path: SHOT('bf-s4-desktop.png') });
  await ctx3.close();

  ok('zéro erreur JS sur tout le parcours', errors.length === 0, errors.join(' | ').slice(0, 400));

  await browser.close();
  console.log(results.join('\n'));
  const fails = results.filter(r => r.startsWith('FAIL'));
  console.log('\n=== ' + (results.length - fails.length) + '/' + results.length + ' PASS ===');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
