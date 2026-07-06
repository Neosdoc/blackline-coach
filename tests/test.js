const { chromium } = require('playwright-core');
const path = require('path');
const FILE = 'file://' + require('path').resolve(__dirname, '..', 'blackline-coach.html');
const SHOT = p => path.join(__dirname, p);

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const results = [];
  const ok = (name, cond, extra) => { results.push((cond ? 'PASS' : 'FAIL') + ' — ' + name + (extra ? ' [' + extra + ']' : '')); };

  // ---------- Contexte 1 : boot vierge + erreurs console ----------
  let ctx = await browser.newContext({ viewport: { width: 380, height: 800 } });
  let page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(FILE);
  await page.waitForTimeout(600);
  ok('boot sans erreur JS', errors.length === 0, errors.join(' | ').slice(0, 300));
  ok('header status affiché', (await page.textContent('#fl-txt')).includes('NON LIÉ'));
  ok('objectif affiché', (await page.textContent('#v-home')).includes("4'10"));
  await page.screenshot({ path: SHOT('01-home-380.png'), fullPage: false });

  // ---------- Saisie séance : accueil → séance → cocher → bilan → save ----------
  await page.click('.daycard.force'); // Force A
  await page.waitForTimeout(300);
  const bandTxt = await page.textContent('#v-week .fiche .band');
  ok("fiche d'ordre avec bande + ORD", /BLACKLINE \/\/ SUIVI PERSONNEL \/\/ S1/.test(bandTxt) && /ORD \d{4}-\d{2}-\d{2}\/A/.test(bandTxt), bandTxt);
  await page.screenshot({ path: SHOT('02-session-380.png') });
  // cocher 3 séries
  const sets = await page.$$('#v-week .set .sl');
  for (let i = 0; i < Math.min(3, sets.length); i++) await sets[i].click();
  const doneCount = await page.$$eval('.set.done', els => els.length);
  ok('3 séries cochées', doneCount === 3, String(doneCount));
  // timer repos
  await page.click('#v-week .rest >> nth=0');
  await page.waitForTimeout(300);
  ok('timer ouvert', await page.$eval('#timer', el => el.classList.contains('show')));
  await page.click('.tb button.m'); // OK ferme
  // bilan
  await page.fill('#bi-dur', '50');
  await page.fill('#bi-rpe', '8');
  await page.fill('#bi-note', 'squat 92,5×3 RPE8 · Achille OK');
  await page.click('text=Terminer');
  await page.waitForTimeout(300);
  ok('tampon EFFECTUÉ apparu', !!(await page.$('#bilan-card .stamp')));
  await page.screenshot({ path: SHOT('03-stamp-380.png') });
  await page.waitForTimeout(900); // navigation auto vers journal
  const jrn = await page.textContent('#v-journal');
  ok('séance dans le journal (400 UA)', jrn.includes('400 UA') && jrn.includes('Force A'), '');
  ok('horodatage militaire', /\d{2} (JAN|FÉV|MAR|AVR|MAI|JUIN|JUIL|AOÛT|SEP|OCT|NOV|DÉC) \d{2} — \d{2}:\d{2}/.test(jrn));
  await page.screenshot({ path: SHOT('04-journal-380.png'), fullPage: true });

  // Achille
  await page.click('.nav button[data-v="home"]');
  await page.click('.achbtn >> nth=4'); // note 4
  await page.waitForTimeout(200);
  ok('Achille noté 4/10', (await page.textContent('#v-home')).includes('4/10'));

  // ---------- Persistance : fermeture → réouverture ----------
  const stored = await page.evaluate(() => localStorage.getItem('blc:data'));
  ok('blc:data écrit avec schemaVersion 5', stored && JSON.parse(stored).schemaVersion === 5);
  await page.close();
  page = await ctx.newPage();
  await page.goto(FILE);
  await page.waitForTimeout(500);
  await page.click('.nav button[data-v="journal"]');
  const jrn2 = await page.textContent('#v-journal');
  ok('données survivent à la réouverture', jrn2.includes('400 UA'));
  // snapshot créé au boot
  const snaps = await page.evaluate(() => JSON.parse(localStorage.getItem('blc:snaps') || '[]'));
  ok('snapshot pris au boot', snaps.length >= 1, snaps.length + ' snapshots');
  ok('écran restauration liste les snapshots', jrn2.includes('Restaurer'));

  // ---------- FSA non supporté : fallback propre ----------
  // (file:// n'expose pas showSaveFilePicker dans ce chromium headless → cas Firefox/Safari)
  const fsaSupported = await page.evaluate(() => 'showSaveFilePicker' in window);
  const dataCard = await page.textContent('#data-file-card');
  if (!fsaSupported) {
    ok('fallback sans FSA affiché', dataCard.includes('API FICHIER NON DISPONIBLE'));
  } else {
    ok('carte LIER FICHIER affichée', dataCard.includes('LIER') || dataCard.includes('Lier'));
  }

  // ---------- Import : staging + fusion / remplacement ----------
  const importResult = await page.evaluate(() => {
    // backup v2.x (ancien format, sans schemaVersion) → doit être migré
    const old = { app: 'blackline-coach', version: 'v2.9', profile: { vma: 20, obj: "4'05", week: 9 },
      journal: [{ date: Date.now() - 3 * 864e5, week: 8, title: 'Sous-seuil', cat: 'run', dur: 40, rpe: 6, km: 8, load: 240, done: 5, tot: 5, note: 'test import' }],
      achilles: [{ date: Date.now() - 3 * 864e5, score: 2 }] };
    const d = migrate(JSON.parse(JSON.stringify(old)));
    App._staged = d;
    const before = App.journal.length;
    App.applyImport('merge');
    return { migratedVersion: d.schemaVersion, before, after: App.journal.length, ach: App.achilles.length, obj: App.P.obj };
  });
  ok('backup v2.x migré vers schéma 5', importResult.migratedVersion === 5);
  ok('fusion : séance importée ajoutée', importResult.after === importResult.before + 1, importResult.before + '→' + importResult.after);
  ok('fusion : profil actuel conservé', importResult.obj === "4'10", importResult.obj);
  const replaceResult = await page.evaluate(() => {
    const old = { app: 'blackline-coach', profile: { vma: 20, obj: "4'05", week: 9 }, journal: [], achilles: [] };
    App._staged = migrate(old);
    App.applyImport('replace');
    return { n: App.journal.length, obj: App.P.obj };
  });
  ok('remplacement : tout écrasé', replaceResult.n === 0 && replaceResult.obj === "4'05");

  // ---------- Restauration snapshot ----------
  const restoreResult = await page.evaluate(() => {
    App.doRestore(0);
    return { n: App.journal.length, obj: App.P.obj };
  });
  ok('restauration snapshot ramène les données', restoreResult.n >= 1 && restoreResult.obj === "4'10", JSON.stringify(restoreResult));
  await ctx.close();

  // ---------- Contexte 2 : migration depuis clés héritées v2.x ----------
  ctx = await browser.newContext({ viewport: { width: 380, height: 800 } });
  page = await ctx.newPage();
  await page.goto(FILE);
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('blc:profile', JSON.stringify({ vma: 19.8, obj: "4'12", week: 7 }));
    localStorage.setItem('blc:journal', JSON.stringify([{ date: Date.now() - 864e5, week: 7, title: 'VMA', cat: 'run', dur: 45, rpe: 7, km: 9, load: 315, done: 6, tot: 6, note: 'ancien format' }]));
    localStorage.setItem('blc:achilles', JSON.stringify([{ date: Date.now() - 864e5, score: 3 }]));
  });
  await page.reload();
  await page.waitForTimeout(500);
  const mig = await page.evaluate(() => ({
    data: JSON.parse(localStorage.getItem('blc:data')),
    legacy: localStorage.getItem('blc:journal') !== null,
    home: document.getElementById('v-home').textContent
  }));
  ok('migration héritage : blc:data créé', mig.data && mig.data.schemaVersion === 5 && mig.data.journal.length === 1);
  ok('migration héritage : anciennes clés gardées en filet', mig.legacy);
  ok('migration héritage : profil repris (VMA 19,8)', mig.home.includes('19,8'));
  ok('migration héritage : objectif repris', mig.home.includes("4'12"));
  await ctx.close();

  // ---------- Desktop 1280 ----------
  ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  page = await ctx.newPage();
  await page.goto(FILE);
  await page.waitForTimeout(500);
  const hscroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  ok('desktop : pas de scroll horizontal', !hscroll);
  await page.screenshot({ path: SHOT('05-home-desktop.png') });
  await page.click('.nav button[data-v="tools"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: SHOT('06-tools-desktop.png'), fullPage: true });
  await page.click('.nav button[data-v="coach"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: SHOT('07-analyse-desktop.png'), fullPage: true });
  // mobile : pas de scroll horizontal non plus
  await ctx.close();
  ctx = await browser.newContext({ viewport: { width: 380, height: 800 } });
  page = await ctx.newPage();
  await page.goto(FILE);
  await page.waitForTimeout(400);
  const hscrollM = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  ok('mobile 380 : pas de scroll horizontal', !hscrollM);
  // modal projet
  await page.click('text=Le projet');
  await page.waitForTimeout(300);
  ok('modal projet ouvert', await page.$eval('#modal-plan', el => el.classList.contains('show')));
  await page.screenshot({ path: SHOT('08-plan-380.png') });
  await ctx.close();

  await browser.close();
  console.log(results.join('\n'));
  const fails = results.filter(r => r.startsWith('FAIL'));
  console.log('\n=== ' + (results.length - fails.length) + '/' + results.length + ' PASS ===');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
