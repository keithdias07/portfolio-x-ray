// shared journey helpers
export const URL = 'https://portfolio-x-ray-roan.vercel.app/';
export const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
export function helpers(p, pace = 1) {
  const S = (ms) => p.waitForTimeout(ms * pace);
  const scr = p.locator('#screen');
  const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const btn = (name, exact = false) => p.locator('#screen button:visible, [role=dialog] button:visible').filter({ hasText: exact ? new RegExp('^\\s*' + esc(name) + '\\s*$') : name }).first();
  const tap = async (name, exact, wait = 700) => { await btn(name, exact).click({ timeout: 8000 }); await S(wait); };
  const dump = async (tag) => { const t = await scr.innerText(); const bs = (await p.locator('#screen button:visible').allInnerTexts()).map(s => s.replace(/\n/g, ' ').slice(0, 38)); console.log('== ' + tag + '\n' + t.slice(0, 300).replace(/\n/g, ' / ') + '\n  BTN: ' + bs.join(' | ')); };
  return { S, scr, btn, tap, dump };
}
export async function intro(p, h) {
  const { S, tap } = h;
  await tap('Family stage', false, 1000);
  const age = p.locator('#screen input').first(); await age.click(); await age.fill(''); await age.pressSequentially('38', { delay: 120 }); await S(300);
  await tap('+', true, 400); await tap('Next', true, 900);
  if (process.env.DUMP) await h.dump('goals');
  await tap('education', false, 400); await tap('Grow my wealth', false, 500); await tap('Next', true, 900);
  await tap('5 to 10 years', false, 1000);
  await tap('Salaried', false, 1000);
  const inc = p.locator('#screen input').first(); await inc.click(); await inc.fill(''); await inc.pressSequentially('2400000', { delay: 70 }); await S(500);
  await tap('Next', true, 1000);
}
export async function connect(p, h) {
  const { S, tap } = h;
  await tap('Continue', true, 1000);
  await tap('Approve', true, 1000);
  await tap('Continue', false, 1000);
  await tap('Fill demo OTPs', true, 700);
  await tap('Verify & fetch', true, 600);
}
