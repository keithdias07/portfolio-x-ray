// Records the live Investor Assistant at a phone viewport via CDP screencast.
// Output: frames/NNNNNN.jpg + frames.json (timestamps) + markers.json
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { URL, EDGE, helpers, intro, connect } from './flow.mjs';

const OUT = process.argv[2] || 'take1';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT + '/frames', { recursive: true });

const b = await chromium.launch({ executablePath: EDGE, headless: true });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
// visual tap indicator only (does not change app behaviour)
await ctx.addInitScript(() => {
  addEventListener('pointerdown', (e) => {
    const d = document.createElement('div');
    Object.assign(d.style, { position: 'fixed', left: e.clientX - 22 + 'px', top: e.clientY - 22 + 'px', width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(16,185,129,.28)', border: '2px solid rgba(16,185,129,.7)', pointerEvents: 'none', zIndex: 99999, transition: 'transform .45s ease-out, opacity .45s ease-out' });
    document.documentElement.appendChild(d);
    requestAnimationFrame(() => { d.style.transform = 'scale(1.6)'; d.style.opacity = '0'; });
    setTimeout(() => d.remove(), 500);
  }, true);
});
const p = await ctx.newPage();
await p.goto(URL); await p.waitForTimeout(1500);

const cdp = await ctx.newCDPSession(p);
const frames = []; let n = 0; const t0 = Date.now();
cdp.on('Page.screencastFrame', async (f) => {
  const name = String(n++).padStart(6, '0') + '.jpg';
  fs.writeFileSync(`${OUT}/frames/${name}`, Buffer.from(f.data, 'base64'));
  frames.push({ name, t: (Date.now() - t0) / 1000 });
  cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: 780, maxHeight: 1688, everyNthFrame: 1 });

const markers = [];
const mark = async (name, dumpIt = false) => { markers.push({ name, t: (Date.now() - t0) / 1000 }); console.log('MARK', name, ((Date.now() - t0) / 1000).toFixed(1)); if (dumpIt) await h.dump(name); };
const h = helpers(p, 1);
const { S, tap, btn } = h;
// keep the screen alive so idle periods still produce frames
const keepAlive = setInterval(() => p.evaluate(() => { document.documentElement.style.outlineColor = 'rgba(0,0,0,' + (Math.random() * 0.001) + ')'; }).catch(() => {}), 200);
const smoothScroll = async (sel, by, ms = 1200) => {
  await p.evaluate(async ({ sel, by, ms }) => {
    const els = sel ? [...document.querySelectorAll(sel)].filter((e) => e.offsetParent || e.getClientRects().length) : [];
    const el = els[els.length - 1];
    const scrollable = (e) => e && e.scrollHeight > e.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(e).overflowY);
    let target = null;
    if (el) {
      target = [el, ...el.querySelectorAll('*')].find(scrollable);
      for (let a = el.parentElement; !target && a; a = a.parentElement) if (scrollable(a)) target = a;
    }
    target = target || document.scrollingElement || document.documentElement;
    const start = target.scrollTop, t0 = performance.now();
    await new Promise((res) => { const step = (t) => { const k = Math.min(1, (t - t0) / ms); const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; target.scrollTop = start + by * e; k < 1 ? requestAnimationFrame(step) : res(); }; requestAnimationFrame(step); });
  }, { sel, by, ms });
};
globalThis.__rec = { p, h, mark, smoothScroll };

// ---------- Scene 3: welcome, a few questions, simulated connect ----------
await mark('welcome'); await S(2500);
await mark('get-started');
await p.getByRole('button', { name: 'Get started', exact: true }).click(); await S(1200);
await mark('questions');
await intro(p, h);
await mark('connect', true);
await S(1500);
await connect(p, h);
await mark('fetching');
await p.locator('#screen button:visible', { hasText: /^\s*Continue\s*$/ }).waitFor({ timeout: 20000 }); await S(1200);
await tap('Continue', true, 300);
// ---------- Scene 4 opener: data checks ----------
await mark('data-check');
await p.locator('#screen button:visible', { hasText: /^\s*Continue\s*$/ }).waitFor({ timeout: 20000 });
await S(3500);
await mark('data-check-done', true);
await tap('Continue', true, 1200);
await mark('looks-right', true);
await S(3500);
await tap('Looks right', true, 1200);

// ---------- later questions (fast, mostly cut) ----------
await mark('later');
for (let i = 0; i < 3; i++) await tap('Next', true, 800); // take-home, expenses, EMIs (prefilled)
await tap('Use 6 months', false, 500); await tap('Next', true, 800); // emergency months
await tap('No — I’m growing it for later', false, 900);
await tap('Health insurance', false, 300); await tap('Term life insurance', false, 300); await tap('Next', true, 900);
await tap('2 to 5 years', false, 900);
await tap('Do nothing', false, 900);
await tap('Balanced', false, 900);
await h.dump('last-q');
const last = await p.locator('#screen button:visible').allInnerTexts();
const pick = last.find((x) => /held|Held|stayed|Did nothing|kept/i.test(x)) || last.find((x) => x.trim() && !/^(Why we ask|Next|Not sure)$/.test(x.trim()));
await btn(pick.split('\n')[0]).click(); await S(1500);
if (await btn('Next', true).isVisible().catch(() => false) && await btn('Next', true).isEnabled()) await tap('Next', true, 1500);

// ---------- Scene 5: risk reveal + suitability ----------
await mark('reveal', true);
await S(3000);
await smoothScroll('#screen', 420, 1800); await S(2500);
await mark('reveal-scrolled');
await tap('See what this means', false, 1500);
await mark('home', true);
await S(3500);
await mark('advice-open');
await tap('Talk it through', false, 1800);
await mark('advice-chat', true);
await S(2500);
if (await p.locator('button:visible', { hasText: /^\s*Got it\s*$/ }).count()) { await p.locator('button:visible', { hasText: /^\s*Got it\s*$/ }).first().click(); await S(2500); }
await mark('advice-chat2', true);
await S(1500);

// ---------- Scene 4: X-Ray finding in My money ----------
const nav = (i) => p.locator('nav button').nth(i);
await nav(2).click(); await S(1500);
await mark('money', true);
await S(1200);
await p.locator('#screen button:visible').filter({ hasText: 'Data checks (X-Ray)' }).first().click(); await S(1600);
await mark('finding', true);
await S(2500);
await smoothScroll('[role=dialog]', 360, 2200); await S(2500);
await mark('finding-mid');
await smoothScroll('[role=dialog]', 820, 2600); await S(3500);
await mark('finding-end');
await p.locator('[role=dialog] [aria-label=Close]').first().click(); await S(1000);

// ---------- Scene 6: Learn & Explore ----------
await nav(3).click(); await S(1800);
await mark('learn', true);
await S(2000);
await smoothScroll('#screen', 700, 2400); await S(1200);
await smoothScroll('#screen', 900, 2400); await S(1500);
await mark('lessons-list', true);
await S(1500);
await p.locator('#screen button:visible').filter({ hasText: 'Tax basics' }).first().click(); await S(1800);
await mark('lesson-open', true);
await S(2000);
await smoothScroll('[role=dialog]', 500, 2200); await S(2000);
await p.locator('[role=dialog] button:visible').filter({ hasText: /^\s*1\.|Quick check/ }).first().scrollIntoViewIfNeeded().catch(() => {});
await p.evaluate(() => { const el = [...document.querySelectorAll('[role=dialog] *')].find((e) => /^Quick check$/i.test((e.textContent || '').trim())); el && el.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
await S(1800);
await mark('quiz');
const dlg = p.locator('[role=dialog]').filter({ hasText: 'Quick check' });
for (const a of ['At your slab rate each year', 'Shared across all your equity holdings', 'Shows no estimate and asks you to confirm officially']) {
  const o = dlg.locator('button').filter({ hasText: new RegExp('^\\s*' + a + '\\s*$') }).first();
  await o.scrollIntoViewIfNeeded(); await S(500); await o.click(); await S(900);
}
await dlg.locator('button').filter({ hasText: 'Check answers' }).first().scrollIntoViewIfNeeded(); await S(400);
await dlg.locator('button').filter({ hasText: 'Check answers' }).first().click(); await S(800);
await p.evaluate(() => { const el = [...document.querySelectorAll('[role=dialog] *')].find((e) => /Mastered|\d\/3/.test((e.textContent || '').trim()) && e.children.length === 0); el && el.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
await S(3000);
await mark('quiz-done', true);
await p.locator('[role=dialog] [aria-label=Close]').first().click(); await S(1200);

// ---------- Scene 7a: Explore investments ----------
await p.evaluate(() => { const el = [...document.querySelectorAll('#screen *')].find((e) => /^Explore investments$/i.test((e.textContent || '').trim())); el && el.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
await S(2200);
await mark('explore', true);
await smoothScroll('#screen', 500, 2000); await S(1000);
await p.locator('#screen button:visible').filter({ hasText: 'REITs (Real Estate' }).first().click(); await S(1600);
await mark('reit-card', true);
await S(2000);
await smoothScroll('[role=dialog]', 450, 2000); await S(2500);
await p.locator('[role=dialog] [aria-label=Close]').first().click(); await S(1000);
await p.evaluate(() => { const el = [...document.querySelectorAll('#screen button')].find((e) => /REITs vs InvITs/.test(e.textContent || '')); el && el.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
await S(1500);
await p.locator('#screen button:visible').filter({ hasText: 'REITs vs InvITs' }).first().click(); await S(1600);
await mark('compare', true);
await S(3500);
await smoothScroll('[role=dialog]', 350, 1800); await S(2000);
await p.locator('[role=dialog] [aria-label=Close]').first().click(); await S(800);

// ---------- Scene 7b: Grow calculator ----------
await nav(1).click(); await S(1500);
await mark('grow', true);
const sip = p.locator('#screen button:visible').filter({ hasText: /^\s*Monthly SIP\s*$/ }).first();
await sip.click(); await S(1500);
await mark('grow-sip', true);
// drag the years slider a little
const yrs = p.locator('#screen input[type=range]').nth(1);
const bb = await yrs.boundingBox();
if (bb) { await p.mouse.move(bb.x + bb.width * 0.1, bb.y + bb.height / 2); }
await S(1500);
await smoothScroll('#screen', 380, 1600); await S(1000);
await p.locator('#screen label:visible, #screen button:visible').filter({ hasText: /^\s*Inflation-adjusted/ }).first().click(); await S(2200);
await mark('grow-inflation', true);
await p.locator('#screen label:visible, #screen button:visible').filter({ hasText: /^\s*Inflation-adjusted/ }).first().click(); await S(800);
await p.locator('#screen label:visible, #screen button:visible').filter({ hasText: /^\s*After tax\s*$/ }).first().click(); await S(1200);
await p.locator('#screen button:visible').filter({ hasText: /^\s*Equity fund\s*$/ }).first().click(); await S(1500);
await smoothScroll('#screen', 420, 1800); await S(3000);
await mark('grow-breakdown', true);
await S(1500);

await mark('end');
clearInterval(keepAlive);
await cdp.send('Page.stopScreencast');
await S(300);
fs.writeFileSync(`${OUT}/frames.json`, JSON.stringify(frames));
fs.writeFileSync(`${OUT}/markers.json`, JSON.stringify(markers, null, 1));
console.log('frames', frames.length, 'duration', ((Date.now() - t0) / 1000).toFixed(1));
await b.close();
