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

  // ---------- (9) Forme du jour + (4) HSR sur l'accueil ----------
  let home = await page.textContent('#v-home');
  ok('carte Forme du jour', home.includes('Forme du jour'));
  ok('carte Tendon HSR', home.includes('Tendon — HSR') && home.includes('0/3'));
  ok('readiness VERT par défaut', !!(await page.$('.ready.vert')));
  // sommeil mauvais + jambes lourdes → 4 pts → ROUGE
  await page.click('.wrow >> nth=0 >> .wbtn >> nth=2');
  await page.waitForTimeout(200);
  await page.click('.wrow >> nth=1 >> .wbtn >> nth=2');
  await page.waitForTimeout(200);
  ok('readiness ROUGE après 2 mauvais', !!(await page.$('.ready.rouge')));
  // désélection par re-tap
  await page.click('.wrow >> nth=0 >> .wbtn >> nth=2');
  await page.waitForTimeout(200);
  await page.click('.wrow >> nth=1 >> .wbtn >> nth=2');
  await page.waitForTimeout(200);
  ok('re-tap désélectionne (retour VERT)', !!(await page.$('.ready.vert')));
  // HSR
  await page.click('text=Consigner HSR');
  await page.waitForTimeout(200);
  home = await page.textContent('#v-home');
  ok('HSR consigné 1/3', home.includes('1/3'));
  ok('bouton HSR désactivé après tap', !!(await page.$('.panel button[disabled]')));

  // ---------- (1) Adaptation auto : Achille 4 → VMA remplacée ----------
  await page.click('.achbtn >> nth=4');
  await page.waitForTimeout(300);
  await page.click('.daycard:has-text("VMA")');
  await page.waitForTimeout(300);
  let wk = await page.textContent('#v-week');
  ok('bandeau ORDRE MODIFIÉ (Achille 4/10)', !!(await page.$('.adapt')) && wk.includes('ACHILLE 4/10'));
  ok('séance remplacée (sous-seuil léger)', wk.includes('sous-seuil léger'));
  ok('titre marqué ADAPTÉ', wk.includes('ADAPTÉ'));
  await page.screenshot({ path: SHOT('v31-adapt-380.png') });
  // réversible
  await page.click('.a-x');
  await page.waitForTimeout(300);
  wk = await page.textContent('#v-week');
  ok('ordre initial restauré (ADAPTATION DISPONIBLE)', wk.includes('ADAPTATION DISPONIBLE'));
  const chronoChips = await page.$$('#v-week .rest.chrono');
  ok('(3) chrono par rép présent sur séance course', chronoChips.length >= 4, chronoChips.length + ' chips');
  const vins = await page.$$('#v-week .vin[data-kind="s"]');
  ok('(2) champ temps réel par rép', vins.length >= 4, vins.length + ' inputs');

  // ---------- (3) Chrono : start → STOP → temps consigné + repos ----------
  await page.click('#v-week .rest.chrono >> nth=0');
  await page.waitForTimeout(2400); // ~2 s de chrono
  ok('chrono ouvert (STOP affiché)', (await page.textContent('#t-pause')) === 'STOP');
  await page.click('#t-pause'); // STOP
  await page.waitForTimeout(400);
  const v0 = await page.$eval('#v-week .vin >> nth=0', el => el.value).catch(() => null);
  ok('temps consigné dans la rép', v0 !== null && parseInt(v0, 10) >= 1, 'v=' + v0);
  ok('rép marquée faite', !!(await page.$('#v-week .set.done')));
  const tname = await page.textContent('#t-name');
  ok('repos enchaîné avec écart', tname.includes('REPOS') && tname.includes('ÉCART'), tname);
  await page.click('.tb button.m');

  // ---------- (5) Mode terrain ----------
  await page.click('text=Mode terrain');
  await page.waitForTimeout(300);
  ok('terrain ouvert', await page.$eval('#terrain', el => el.classList.contains('show')));
  const prog0 = await page.textContent('#tr-prog');
  await page.click('#tr-btns .btn-g'); // FAIT
  await page.waitForTimeout(300);
  const prog1 = await page.textContent('#tr-prog');
  ok('terrain FAIT avance', prog0 !== prog1, prog0 + ' → ' + prog1);
  await page.screenshot({ path: SHOT('v31-terrain-380.png') });
  await page.click('.terrain .t-close');
  await page.click('.tb button.m').catch(() => {}); // ferme le repos éventuel

  // ---------- (2) Force : saisie par série, save, dernière fois, e1RM ----------
  await page.click('.nav button[data-v="home"]');
  await page.waitForTimeout(200);
  await page.click('.daycard.force >> nth=0'); // Force A (S1 = squat → Achille 4 déclenche tempo -20 %)
  await page.waitForTimeout(300);
  wk = await page.textContent('#v-week');
  ok('adaptation squat→tempo (Achille 4, S1=squat)', wk.includes('ORDRE MODIFIÉ') && wk.includes('tempo'));
  await page.click('#v-week .adapt .a-x'); // maintenir l'ordre initial pour tester le top set
  await page.waitForTimeout(300);
  wk = await page.textContent('#v-week');
  ok('ordre initial force restauré', wk.includes('ADAPTATION DISPONIBLE') && wk.includes('Top set'));
  const topInput = await page.$('#v-week .vin[data-top="1"]');
  ok('champ charge sur le top set', !!topInput);
  // squat 3 reps @ 140 → e1RM 154 > 1RM profil 110 → suggestion de mise à jour
  await topInput.fill('140');
  await page.fill('#bi-dur', '45');
  await page.fill('#bi-rpe', '8');
  await page.click('text=Terminer');
  await page.waitForTimeout(1100);
  const entry = await page.evaluate(() => App.journal[0]);
  ok('series[] enregistré', entry.series && entry.series.length === 1 && entry.series[0].v === '140' && entry.series[0].ex === 'Squat', JSON.stringify(entry.series));
  // rouvrir la même séance → Dernière fois
  await page.click('.nav button[data-v="home"]');
  await page.click('.daycard.force >> nth=0');
  await page.waitForTimeout(300);
  wk = await page.textContent('#v-week');
  ok('rappel Dernière fois', wk.includes('Dernière fois') && wk.includes('140'), '');
  // analyse : e1RM + dérives
  await page.click('.nav button[data-v="coach"]');
  await page.waitForTimeout(300);
  const an = await page.textContent('#an-out');
  ok('(10) carte Dérives présente', an.includes('Dérives — détection'));
  await page.click('.chips .pill >> nth=3'); // Charges
  await page.waitForTimeout(300);
  const ch = await page.textContent('#an-out');
  ok('(9bis) e1RM estimé + bouton maj', ch.includes('e1RM estimé') && ch.includes('Mettre à jour le 1RM'), '');
  await page.click('text=Mettre à jour le 1RM');
  await page.waitForTimeout(300);
  const sq = await page.evaluate(() => App.P.squat);
  ok('1RM squat mis à jour', sq > 110, 'squat=' + sq);

  // ---------- (4) Vélo Z1 : carte + séance ----------
  await page.click('.nav button[data-v="week"]');
  await page.waitForTimeout(300);
  const wkList = await page.textContent('#v-week');
  ok('cartes Vélo Z1 mer + dim', (wkList.match(/Vélo Z1/g) || []).length >= 2);
  await page.click('#v-week .daycard.bike >> nth=0');
  await page.waitForTimeout(300);
  wk = await page.textContent('#v-week');
  ok('séance vélo ouverte', wk.includes('Z1 continu') && wk.includes('bpm'));

  // ---------- (6/7) graphiques ----------
  // 2e note Achille (hier) pour la sparkline
  await page.evaluate(() => { App.achilles.push({ date: Date.now() - 864e5, score: 3 }); App.persist(); App.renderHome(); });
  await page.click('.nav button[data-v="home"]');
  await page.waitForTimeout(300);
  ok('(6) sparkline Achille rendue', !!(await page.$('#achSpark')));
  await page.click('.nav button[data-v="journal"]');
  await page.waitForTimeout(300);
  ok('(7) graphique 8 semaines rendu', !!(await page.$('#loadChart8')));
  await page.screenshot({ path: SHOT('v31-journal-380.png'), fullPage: true });

  // ---------- (11) programme externalisable ----------
  const prog = await page.evaluate(() => {
    App._staged = migrate({
      app: 'blackline-coach', profile: App.P, journal: [], achilles: [],
      program: { name: 'HYROX P2', nWeeks: 10,
        weeks: { 1: { vma: { txt: '8×1 km compromised', note: 'post-station' }, ss: { sets: [[6, 1000, 85]], rec: 60, note: 'pivot' }, sp: { txt: 'sled push/pull lourd', note: 'stations' }, long: { min: 60, note: 'EF' } } },
        toppct: { 1: 70 }, reps: { 1: 8 }, bo: { 1: 2 }, deload: {} }
    });
    App.applyImport('replace');
    return { n: App.progN(), meso: App.mesoL(1), sum: App.week(1)[1].sum };
  });
  ok('(11) programme importé : 10 semaines', prog.n === 10);
  ok('(11) meso label = nom du bloc', prog.meso.includes('HYROX P2'), prog.meso);
  ok('(11) séances du bloc utilisées', prog.sum.includes('compromised'), prog.sum);

  ok('zéro erreur JS sur tout le parcours', errors.length === 0, errors.join(' | ').slice(0, 400));

  await browser.close();
  console.log(results.join('\n'));
  const fails = results.filter(r => r.startsWith('FAIL'));
  console.log('\n=== ' + (results.length - fails.length) + '/' + results.length + ' PASS ===');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
