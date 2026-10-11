/**
 * Guided assistant (A7, B10) — SCRIPTED, NOT AN AI MODEL.
 * Replies are assembled from engine outputs (risk, suitability, tax, calculator, advice) and the
 * reviewed instrument lesson library. Every number comes from an engine; every reply ends with
 * follow-up chips. It declines guaranteed-return claims and stock tips.
 */
import type { Analysis } from './pipeline';
import type { CanonicalPortfolio } from './normalise';
import { CLASS_LABEL } from './suitability';
import { lessonById, INSTRUMENT_LESSONS } from '../data/instruments';
import { RETURN_ASSUMPTIONS, type BroadKey } from '../config/profile';
import { fmtLakh } from '../lib/format';
import { fdInterestTax } from './tax';
import type { Answers } from './types';

export type Block =
  | { kind: 'text'; text: string }
  | { kind: 'stats'; items: { label: string; value: string; tone?: 'good' | 'warn' | 'bad' }[] }
  | { kind: 'mix'; rows: { label: string; current: number; target: number }[] }
  | { kind: 'lesson'; lessonId: string }
  | { kind: 'action'; label: string; action: AssistantAction }
  | { kind: 'note'; text: string };

export type AssistantAction =
  | { type: 'open-grow'; prefill: Analysis['advice']['calcPrefill'] }
  | { type: 'open-topic'; topicId: string }
  | { type: 'open-finding'; findingId: string }
  | { type: 'open-tab'; tab: 'money' | 'grow' };

export interface ChatMessage { id: string; role: 'assistant' | 'user'; blocks: Block[]; chips: string[] }

export interface Ctx { answers: Answers; portfolio: CanonicalPortfolio; analysis: Analysis }

let seq = 0;
const msg = (blocks: Block[], chips: string[]): ChatMessage => ({ id: `m${++seq}`, role: 'assistant', blocks, chips });
export const userMsg = (text: string): ChatMessage => ({ id: `m${++seq}`, role: 'user', blocks: [{ kind: 'text', text }], chips: [] });

export const CHIPS = {
  why: 'Why doesn’t my mix fit?',
  whyFits: 'Why does my mix fit?',
  mix: 'What mix suits my stage?',
  options: 'What are my options?',
  nothing: 'What if I do nothing?',
  grow: 'Show me what this could grow to',
  tax: 'How does tax affect me?',
  profile: 'Explain my risk profile',
  emergency: 'Is my emergency fund enough?',
  data: 'What did the data check find?',
  lessons: 'Teach me about an investment',
};

function mixRows(c: Ctx) {
  const { suit } = c.analysis;
  return (Object.keys(suit.target) as BroadKey[]).map((k) => ({ label: CLASS_LABEL[k], current: suit.current[k], target: suit.target[k] }));
}

const defaultChips = (c: Ctx, exclude: string[] = []) =>
  [c.analysis.advice.verdict === 'fits' ? CHIPS.whyFits : CHIPS.why, CHIPS.options, CHIPS.grow, CHIPS.tax, CHIPS.nothing, CHIPS.lessons]
    .filter((x) => !exclude.includes(x)).slice(0, 4);

/** Seeded first message when the advice card expands into the chat (B10 handoff). */
export function seedFromAdvice(c: Ctx): ChatMessage {
  const a = c.analysis.advice;
  return msg([
    { kind: 'text', text: `Let’s pick up from your card: **${a.headline}.**` },
    { kind: 'text', text: a.why[0] },
    { kind: 'mix', rows: mixRows(c) },
    ...(a.taxLine ? [{ kind: 'note', text: `Tax angle: ${a.taxLine}` } as Block] : []),
    { kind: 'text', text: 'Want to see why, what you could do, or what happens if you leave it?' },
  ], [a.verdict === 'fits' ? CHIPS.whyFits : CHIPS.why, CHIPS.options, CHIPS.nothing, CHIPS.grow]);
}

/** "Explain this" from My money: opens the chat with a holding as context. */
export function explainHolding(c: Ctx, holdingId: string): ChatMessage {
  const h = c.portfolio.holdings.find((x) => x.holdingId === holdingId);
  if (!h) return fallback(c);
  const t = c.analysis.tax.perHolding[h.holdingId];
  const share = (h.currentValue / c.portfolio.totalValue) * 100;
  const lessonId = ({ 'Direct stock': 'equity-fund', 'Equity fund': 'equity-fund', 'Index ETF': 'equity-fund', 'Debt fund': 'debt-fund', 'Gold ETF': 'gold', 'Government security': 'gsec', 'Corporate bond': 'bond', 'Fixed deposit': 'fd' } as Record<string, string>)[h.instrumentType];
  const blocks: Block[] = [
    { kind: 'text', text: `**${h.name}** is a ${h.instrumentType.toLowerCase()} worth ${fmtLakh(h.currentValue)} — ${share.toFixed(1)}% of your money.` },
    { kind: 'stats', items: [
      { label: 'Gain so far', value: h.unrealisedGain == null ? 'Unknown (no cost)' : `${h.unrealisedGain >= 0 ? '+' : '−'}${fmtLakh(Math.abs(h.unrealisedGain))}`, tone: h.unrealisedGain == null ? 'warn' : h.unrealisedGain >= 0 ? 'good' : 'bad' },
      { label: 'Held for', value: h.holdingPeriodBucket + (h.purchaseDateEstimated ? ' (estimated)' : '') },
      { label: 'Tax', value: t?.chip ?? '—' },
    ] },
  ];
  if (t && t.ifSoldTax > 0) blocks.push({ kind: 'note', text: `If you sold it today, the estimated extra tax would be about ${fmtLakh(t.ifSoldTax)} (${t.gainType === 'LTCG' ? 'long-term' : t.gainType === 'STCG' ? 'short-term' : 'slab-rate'} gain). Estimate only.` });
  if (t && t.annualTax > 0) blocks.push({ kind: 'note', text: `Its interest adds about ${fmtLakh(t.annualTax)} to your tax each year${t.postTaxYield ? `, leaving roughly ${t.postTaxYield.toFixed(2)}% after tax` : ''}.` });
  if (h.xrayFindingIds.length) blocks.push({ kind: 'action', label: 'See the data check for this holding', action: { type: 'open-finding', findingId: h.xrayFindingIds[0] } });
  if (lessonId) blocks.push({ kind: 'lesson', lessonId });
  return msg(blocks, [CHIPS.why, CHIPS.tax, CHIPS.options, CHIPS.data]);
}

const has = (s: string, ...words: string[]) => words.some((w) => s.includes(w));

export function respond(input: string, c: Ctx): ChatMessage {
  const s = input.toLowerCase();
  const { risk, suit, tax, advice } = c.analysis;

  // safety first
  if (has(s, 'guarantee', 'assured return', 'sure shot', 'risk-free return', 'double my money')) {
    return msg([
      { kind: 'text', text: 'I can’t promise any return — no honest source can for market-linked investments. Even “safe” options carry inflation and reinvestment risk.' },
      { kind: 'text', text: 'What I can do is show a range (cautious, expected, optimistic) using clearly stated assumptions.' },
    ], [CHIPS.grow, CHIPS.mix, CHIPS.profile]);
  }
  if (has(s, 'which stock', 'best stock', 'stock tip', 'multibagger', 'crypto', 'bitcoin', 'intraday', 'f&o', 'options trading', 'should i buy', 'should i sell')) {
    return msg([
      { kind: 'text', text: 'I don’t give tips on specific stocks or trades. I’m here to explain how your overall mix fits your profile and what each type of investment involves.' },
    ], [CHIPS.options, CHIPS.mix, CHIPS.lessons]);
  }

  // instrument lessons
  const lessonMatch: [string[], string][] = [
    [['fd', 'fixed deposit'], 'fd'], [['g-sec', 'gsec', 't-bill', 'tbill', 'treasury', 'retail direct', 'government bond', 'government securit'], 'gsec'],
    [['corporate bond', 'ncd', 'debenture'], 'bond'], [['debt fund', 'debt mutual', 'liquid fund'], 'debt-fund'],
    [['equity fund', 'index fund', 'mutual fund', 'sip', 'elss'], 'equity-fund'], [['gold', 'sgb'], 'gold'], [['ppf', 'provident'], 'ppf'], [['nps', 'pension'], 'nps'],
  ];
  for (const [words, id] of lessonMatch) {
    if (has(s, ...words)) {
      const l = lessonById[id];
      const blocks: Block[] = [{ kind: 'text', text: `Here’s ${l.name} in four lines:` }, { kind: 'lesson', lessonId: id }];
      if (id === 'fd') {
        const fd = c.portfolio.holdings.find((h) => h.instrumentType === 'Fixed deposit');
        if (fd) {
          const w = fdInterestTax(fd.currentValue, (fd.annualInterest / fd.currentValue) * 100, tax);
          blocks.push({ kind: 'note', text: `Your FD of ${fmtLakh(fd.currentValue)} earns about ${fmtLakh(w.interest)} a year; at your ${(tax.marginalRate * 100).toFixed(1)}% marginal rate that’s about ${fmtLakh(w.tax)} in tax, so roughly ${w.postTaxRate.toFixed(2)}% after tax.` });
        }
      }
      if (l.topicId) blocks.push({ kind: 'action', label: 'Open the full lesson & quiz', action: { type: 'open-topic', topicId: l.topicId } });
      return msg(blocks, [CHIPS.mix, CHIPS.tax, CHIPS.lessons]);
    }
  }
  if (has(s, 'teach', 'lesson', 'learn', 'investment type', 'instrument')) {
    return msg([
      { kind: 'text', text: 'Which one? Each lesson is four short lines: what it is, who it suits, the risk and the tax angle.' },
    ], INSTRUMENT_LESSONS.slice(0, 6).map((l) => `Tell me about ${l.name.split(' (')[0]}`));
  }

  if (has(s, 'why', 'fit', 'mismatch')) {
    const rows = mixRows(c);
    return msg([
      { kind: 'text', text: advice.verdict === 'fits'
        ? `Your mix is close to the suggested allocation for a **${risk.label.toLowerCase()}** profile at your stage.`
        : `Your profile is **${risk.label}**, and ${suit.primary.text.charAt(0).toLowerCase()}${suit.primary.text.slice(1)}` },
      { kind: 'mix', rows },
      ...suit.verdicts.slice(1, 3).map((v) => ({ kind: 'note', text: v.text } as Block)),
      { kind: 'text', text: risk.transparency },
    ], defaultChips(c, [CHIPS.why, CHIPS.whyFits]));
  }

  if (has(s, 'mix', 'allocation', 'stage', 'suit')) {
    return msg([
      { kind: 'text', text: `For a **${risk.label.toLowerCase()}** profile at your stage, the suggested mix is:` },
      { kind: 'mix', rows: mixRows(c) },
      { kind: 'text', text: 'Equity drives long-term growth but swings the most; debt steadies the ride; gold diversifies; cash covers emergencies.' },
    ], [CHIPS.options, CHIPS.profile, CHIPS.grow]);
  }

  if (has(s, 'option', 'what can i do', 'what should', 'suggest', 'recommend', 'change')) {
    if (!advice.suggestions.length) {
      return msg([{ kind: 'text', text: 'Your mix is already close to target, so there’s nothing big to change. Keep investing regularly and review once a year.' }], [CHIPS.grow, CHIPS.tax, CHIPS.lessons]);
    }
    const blocks: Block[] = [{ kind: 'text', text: 'Here are the directions that would bring your mix closer to your profile. These are educational directions, not instructions:' }];
    advice.suggestions.slice(0, 3).forEach((sg) => blocks.push({ kind: 'note', text: sg.text }));
    const inc = advice.suggestions.find((sg) => sg.direction === 'increase' && sg.lessonIds.length);
    if (inc) {
      blocks.push({ kind: 'text', text: `Ways people add ${CLASS_LABEL[inc.assetClass].toLowerCase()} — each with its main risk and tax angle:` });
      inc.lessonIds.slice(0, 2).forEach((id) => blocks.push({ kind: 'lesson', lessonId: id }));
    }
    if (advice.taxLine) blocks.push({ kind: 'note', text: `Tax angle: ${advice.taxLine}` });
    blocks.push({ kind: 'action', label: CHIPS.grow, action: { type: 'open-grow', prefill: advice.calcPrefill } });
    return msg(blocks, [CHIPS.nothing, CHIPS.tax, CHIPS.mix]);
  }

  if (has(s, 'nothing', 'leave it', 'ignore', 'wait')) {
    return msg([{ kind: 'text', text: advice.doNothing }, { kind: 'note', text: 'Projections use assumed returns from your profile’s range. They are not guaranteed.' }], [CHIPS.options, CHIPS.grow, CHIPS.profile]);
  }

  if (has(s, 'grow', 'calculat', 'project', 'future', 'compound', 'crore')) {
    const p = advice.calcPrefill;
    const r = RETURN_ASSUMPTIONS[risk.label];
    return msg([
      { kind: 'text', text: `I’ll open the calculator with ${p.mode === 'sip' ? `a ${fmtLakh(p.amount)} monthly SIP` : `a ${fmtLakh(p.amount)} lump sum`} for ${p.years} years. It shows a range: ${r.cautious}% cautious, ${r.expected}% expected, ${r.optimistic}% optimistic.` },
      { kind: 'action', label: 'Open Grow with these numbers', action: { type: 'open-grow', prefill: p } },
    ], [CHIPS.tax, CHIPS.options]);
  }

  if (has(s, 'tax', 'slab', 'ltcg', 'stcg', 'regime', 'rebate')) {
    const blocks: Block[] = [
      { kind: 'text', text: `Using your income (${fmtLakh(tax.grossAnnual)} a year, ${tax.regime} regime), your marginal rate — the tax on your next rupee of interest — is about **${(tax.marginalRate * 100).toFixed(1)}%** including cess.` },
      { kind: 'stats', items: [
        { label: 'Yearly interest from your holdings', value: fmtLakh(tax.annualInterest) },
        { label: 'Estimated tax on that interest', value: fmtLakh(tax.annualInterestTax), tone: 'warn' },
        { label: 'If you sold everything today', value: `${fmtLakh(tax.sellAllTax)} tax (estimate)` },
      ] },
      ...tax.notes.map((n) => ({ kind: 'note', text: n } as Block)),
      { kind: 'note', text: `Rates from our ${tax.meta.financialYear} table, as stated in the design document (${tax.meta.lastVerified}) — not independently or legally verified. Estimates only; check with a qualified professional.` },
    ];
    return msg(blocks, [CHIPS.options, CHIPS.lessons, CHIPS.grow]);
  }

  if (has(s, 'risk profile', 'profile', 'conservative', 'moderate', 'aggressive', 'risk')) {
    return msg([
      { kind: 'text', text: `You’re **${risk.label}**. Ability to take risk: ${risk.capacityLabel.toLowerCase()} (${risk.capacityScore}/100). Willingness: ${risk.toleranceLabel.toLowerCase()} (${risk.toleranceScore}/100).` },
      { kind: 'text', text: risk.limiting === 'none' ? 'Both point the same way.' : `Your ${risk.limiting === 'capacity' ? 'ability' : 'willingness'} is lower, and the lower one always wins — it’s the safer guide.` },
      ...risk.reasons.map((r) => ({ kind: 'note', text: r } as Block)),
    ], [CHIPS.mix, CHIPS.emergency, CHIPS.why]);
  }

  if (has(s, 'emergency', 'buffer', 'rainy')) {
    const ok = risk.bufferCoverMonths >= risk.bufferMonths;
    return msg([
      { kind: 'text', text: `Most people at your stage keep about ${risk.bufferMonths} months of expenses — for you, about ${fmtLakh(risk.bufferTarget)}. Your savings and FDs cover ${risk.bufferCoverMonths.toFixed(1)} months.` },
      { kind: 'text', text: ok ? 'That’s enough. Money beyond this can work harder for longer goals.' : 'Building this up comes before taking more market risk.' },
    ], [CHIPS.options, CHIPS.profile]);
  }

  if (has(s, 'data', 'x-ray', 'xray', 'duplicate', 'check', 'error', 'mistake')) {
    const f = c.portfolio.xray.findings;
    const blocks: Block[] = [{ kind: 'text', text: f.length ? `While combining your accounts I ran ${7} checks and found ${f.length} thing${f.length > 1 ? 's' : ''} worth knowing. The numbers you see already account for them:` : 'Everything matched across your accounts — no issues found.' }];
    f.slice(0, 3).forEach((x) => blocks.push({ kind: 'action', label: x.title, action: { type: 'open-finding', findingId: x.id } }));
    return msg(blocks, [CHIPS.why, CHIPS.tax]);
  }

  if (has(s, 'disclaimer', 'advice?', 'are you an ai', 'are you ai', 'who are you', 'what are you')) {
    return msg([{ kind: 'text', text: 'I’m a guided assistant: my answers are put together from fixed rules and a reviewed lesson library using your demo data. I’m not an AI model and not a SEBI-registered adviser — think of this as education about suitability, not personal advice.' }], defaultChips(c));
  }

  if (/\b(hi|hello|hey|namaste)\b/.test(s)) {
    return msg([{ kind: 'text', text: `Hello! Your card says: **${advice.headline}.** Where would you like to start?` }], defaultChips(c));
  }

  return fallback(c);
}

function fallback(c: Ctx): ChatMessage {
  return msg([{ kind: 'text', text: 'That’s outside what I can help with here. I can explain your mix, your risk profile, tax on your holdings, or what different investments involve.' }], defaultChips(c));
}

