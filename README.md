# Investor Assistant (with Portfolio X-Ray)

A mobile-first assistant for new and hesitant investors in India — **Detect → Understand → Make more informed decisions.** It helps you understand your risk profile, see all your investments in one place, and get simple, educational guidance. It was built from the *Investor Assistant: User Flow and Technical Flow* design document. Two USPs:

1. **Explainable Portfolio X-Ray.** Rule-based integrity checks (not AI/ML) flag *potential* discrepancies between your statements. Each one shows what was flagged, the evidence, why it may matter and what to verify next.
2. **Learn & Explore.** An instrument catalogue (11 options, including REITs vs InvITs and G-Secs vs other bonds) plus 15 lessons with worked examples and quizzes, linked from X-Ray findings and the assistant.

Product requirements were informed by input from a chartered accountant during development. This is not an endorsement or certification.

> **Demo mode — what is simulated:**
> - **Accounts, consent, OTP and all financial data are simulated.** The Account Aggregator (AA) integration is a mock (`src/engine/aa.ts`). No real AA, bank, broker, depository or RBI/SEBI system is contacted, and any 6-digit OTP is accepted. Every person, account, identifier (prefixed `DM-`) and price is fictional.
> - **The assistant is scripted.** It has no AI model and no LLM calls. Replies come from fixed rules and a pre-written lesson library, and every number comes from the deterministic engines.
> - **Educational only.** Outputs are suitability insights for learning, **not personalised investment advice**. The prototype is not a SEBI-registered adviser.
> - **Tax rates are not independently or legally verified.** They are taken as stated in the design document (see [Tax assumptions](#tax-assumptions)).
> - **Projections are hypothetical.** Grow shows a cautious/expected/optimistic range from assumed returns. Returns are not guaranteed.

## Run it locally

Needs Node.js 18+ (tested on Node 24).

```bash
npm install
npm run dev        # http://localhost:5173
```

## Checks

```bash
npm test           # 97 Vitest tests (engines, personas, failure paths, persistence, i18n, catalogue, lessons)
npm run typecheck  # tsc -b
npm run build      # production build to dist/
npm run personas   # prints what each sample persona produces end to end
```

On desktop the app is shown in a phone frame. A presenter panel next to it offers sample personas, account-failure switches (fail / partial / timeout) and a restart button. On a phone, the same controls are behind the **Demo mode** pill.

## The journey: welcome to My money

| Step | What happens |
|---|---|
| A1 Welcome | Three reassurance points, the EN/हिं toggle, and two routes. **Get started** walks the full flow using the demo accounts of the family-stage persona. **Try with sample data** picks one of 3 personas (young starter, family stage, pre-retiree) and, as the design specifies, skips connecting accounts and the questions, going straight to the risk profile |
| A2 Intro questions | Life stage, age and dependents, goals (the list adapts to life stage), **when the money is needed**, income type, yearly income. Each has a progress bar with time left, example chips, "why we ask", **Not sure**, a back button that keeps answers, and amounts shown in words ("₹24 lakh") |
| A3 Connect (simulated AA) | Why we ask → consent with toggles → choose accounts → mock OTP → one fetch per account → live data check → "We found N accounts and M holdings worth ₹X. Does this look right?" with **Edit** (purchase price/date, unrecognised security, X-Ray evidence) |
| A3 failure paths | Failed account (retry, retry all, continue without it, add manually), partial data, timeout, consent declined (manual entry or sample data), and a page reload mid-fetch (shown as "interrupted" with the same options) |
| A4 Capacity and behaviour | Income, expenses and EMIs prefilled from bank data to confirm, a computed emergency-fund suggestion, **need for regular income**, insurance, **investing experience**, and scenario questions about losses |
| A5 Risk reveal | Conservative / Moderate / Aggressive from ability (capacity) and willingness (tolerance). The lower one wins, with a kind explanation when they disagree, plus Retake. Capacity is limited by when the money is needed; a first-time investor's willingness is capped at Moderate |
| A6 Home | Total value, allocation bar with target markers, a one-line verdict, a single advice card, an "incomplete" warning if accounts are missing or partial, and a simple view toggle |
| A7 Assistant | The advice card expands into a scripted chat. Instrument lessons (FD, G-Secs/T-Bills, bonds, debt and equity funds, gold, PPF, NPS) carry tax chips. Follow-up chips after every reply. Declines guaranteed-return and stock-tip questions |
| A8 Grow | SIP or lump sum, cautious/expected/optimistic range, invested-vs-growth chart, inflation and after-tax toggles (equity fund / FD / debt fund; gold/REIT/InvIT/PPF/NPS shown as "not estimated — rule to verify"), a **breakdown** (you put in, growth, value before tax, estimated tax, after tax, today's money), an **assumptions** panel, a ₹1 crore milestone, and "start 5 years earlier" |
| Suitability | Allocation vs target (profile × life stage), single-holding and **sector** concentration, **emergency-buffer shortfall** (shown first), **money needed within 3 years held in equity**, and **regular-income need**, each explained |
| A9 My money | Holdings by asset class with account sources, tax chips, **Explain this**, X-Ray data checks, tax at a glance (new/old regime), refresh/retry, and prompts for manual entries that may now be double-counted |
| Learn tab | **Explore investments** (FDs, G-Secs & T-Bills via RBI Retail Direct, PPF, corporate bonds, debt and equity funds, direct stocks, NPS, REITs, InvITs, gold), each with what it is, how it earns, risks, pros and cons, liquidity, tax (or "needs verification") and who might consider learning more; **REITs vs InvITs** and **G-Secs vs other bonds** comparisons; **15 lessons** with examples and quizzes, with lessons linked to your X-Ray findings shown first |
| A10 Ongoing | Save and resume, jargon tooltips, a printable one-page summary, a re-check prompt, and revoke/delete |

## Technical flow (Part B)

| PDF section | Where |
|---|---|
| B3 Questionnaire | `src/config/questions.ts` (schema, branching, prefill paths) |
| B4 Mock AA | `src/engine/aa.ts` with personas in `src/personas/*.json` (raw shapes differ per account type) |
| B5 Normalisation | `src/engine/normalise.ts`: validate/reject, resolve names and tickers, run X-Ray, merge across accounts (weighted average cost), classify, enrich, quality prompts |
| X-Ray rules | `src/engine/xray.ts`: 7 rules, each with evidence, reasoning and uncertainty, worded as possible discrepancies |
| B6 Risk | `src/engine/risk.ts` |
| B7 Suitability | `src/engine/suitability.ts` |
| B8 Tax | `src/engine/tax.ts` with the table in `src/config/tax.ts` |
| B9 Calculator | `src/engine/calc.ts` |
| Advice builder | `src/engine/advice.ts` |
| B10 Assistant | `src/engine/assistant.ts` (scripted) and `src/data/instruments.ts` (lesson library) |
| B11 API surface | `src/engine/pipeline.ts` (`api` facade shaped like the endpoints; runs locally, no backend) |
| B12 State | `src/store.tsx` (single store persisted to `localStorage`, with `hydrate`/`reducer` exported for tests) |
| Catalogue & lessons | `src/data/instruments.ts`, `src/data/learn.ts`, `src/lib/learning.ts` |
| B15 Tests | `src/engine/xray.test.ts`, `engines.test.ts`, `qa.test.ts`, `features.test.ts` |
| Acceptance checklist | [`docs/ACCEPTANCE.md`](docs/ACCEPTANCE.md): each CA requirement mapped to the implementation and its tests |

## Data storage, resume and revoke

Everything is stored only in this browser's `localStorage`, under the key `ia.state.v2`. There is no server.
- **Resume:** refreshing returns you to the same step with your answers.
- **Revoke access & delete my data** (Settings) clears answers, fetched data, edits, chat, results and consent, along with keys left by the earlier prototype. Only the language choice is kept.

## Tax assumptions

The tax engine uses the FY 2026-27 rates **as stated in the design document**:
- new-regime slabs, the ₹12 lakh rebate and the ₹75,000 standard deduction
- 20% equity STCG, and 12.5% equity LTCG above a shared ₹1.25 lakh exemption
- slab rate for FD/bond interest and for debt funds bought on or after 1 April 2023

These rates have **not been independently or legally verified**. The "last verified" date in `src/config/tax.ts` is the date the document states, not a verification by this project.

**Rules marked "to verify" are never silently applied.** These holdings show "Rule to verify", and the "if sold today" estimate leaves them out:
- Gold ETF / SGB treatment
- REIT/InvIT payouts
- Unrecognised securities and manual entries (type unknown)
- Debt funds bought before 1 April 2023, or with an unknown date

Other to-verify items:
- **Marginal relief** just above the ₹12 lakh rebate limit. This is a prototype assumption that is *not* in the design document.
- PPF, NPS, ELSS and 80C limits, TDS thresholds, and surcharge.

**Other modelling assumptions** (disclosed in the app):
- If yearly income isn't given, it is assumed to be take-home × 12 × 1.25.
- Savings interest is assumed at 2.75%.
- FD interest is simple interest on principal.

Out of scope, estimate only: HUF, NRI, grandfathering on pre-2018 equity, and loss carry-forward.

## Known limitations

- **No real data, backend or AI.** The assistant matches keywords, so unusual phrasing gets a polite fallback with suggestion chips.
- **Not implemented:** XIRR calculation (only a jargon tooltip exists); purchase lots (average cost and earliest purchase date only); surcharge for very high incomes; and the insurance answer does not affect the risk score.
- **Hindi covers:** welcome, all questionnaire questions, connect-flow headings, buttons and statuses, the risk reveal, home labels and navigation (including the Learn tab name). **English only** (a notice is shown in Hindi mode): lessons, the instrument catalogue, chat, engine-generated advice text, Grow, My money and the sheets. The Hindi copy needs a native-speaker review.
- **No live market data:** the catalogue is educational; there are no live prices, yields, bond listings or purchases. Use RBI Retail Direct and other official sites for current listings.
- **Simplified maths:** bond, calculator and tax figures are illustrations. After-tax equity treats the whole gain as redeemed in the final year.
- **Accessibility:** keyboard navigation and visible focus states work, but sheets do not trap focus yet.
- **Untestable in the UI:** the missing-price path (a recognised security with no quote, valued at cost and flagged) can't be triggered from the demo data; it is covered by unit tests.
