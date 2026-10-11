# Investor Assistant (with Portfolio X-Ray)

A mobile-first assistant for new and hesitant investors in India. It helps you understand your risk profile, see all your investments in one place, and get simple, educational guidance. It was built from the *Investor Assistant: User Flow and Technical Flow* design document, and the Portfolio X-Ray data checks run inside the flow.

> **Demo mode — what is simulated:**
> - **Account Aggregator (AA) integration is simulated.** No real AA, bank, broker, depository or RBI/SEBI system is contacted. A mock AA service in `src/engine/aa.ts` returns sample data from three fictional personas. Every person, account, identifier (prefixed `DM-`) and price is fictional.
> - **The assistant is scripted.** It has no AI model and no LLM calls. Replies are built from fixed rules and a pre-written lesson library, and every number comes from the deterministic engines.
> - **Tax figures are estimates.** They use the design document's stated rates and are **not independently or legally verified** (see [Tax assumptions](#tax-assumptions)).
> - Outputs are educational suitability insights, **not personalised investment advice**.

## Run it

Needs Node.js 18+ (tested on Node 24).

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm test           # 42 unit, persona and failure-path tests (Vitest)
npm run typecheck
npm run build
npm run personas   # prints what each sample persona produces end to end
```

On desktop the app is shown in a phone frame. A presenter panel next to it has sample personas, account-failure switches and a restart button. On a phone, the same controls are behind the **Demo mode** pill.

## User flow (Part A)

| Step | What happens |
|---|---|
| A1 Welcome | Three reassurance points, **Get started** or **Try with sample data** (3 personas), EN/हिं toggle |
| A2 Intro questions | One per screen: life stage, age and dependents, goals (the list adapts to life stage), income type, yearly income. Each has a progress bar with time left, example chips, a "why we ask" line, **Not sure**, and a back button that keeps answers |
| A3 Connect (simulated AA) | Why we ask → consent with toggles → choose accounts → mock OTP and per-account fetch → live data check → "We found N accounts and M holdings worth ₹X. Does this look right?" with **Edit** (missing price/date, unrecognised security, X-Ray evidence) |
| A3 failure paths | An account fails (retry / continue without it / add manually), partial data, a timeout, consent declined (manual entry or sample data) |
| A4 Capacity and behaviour | Income, expenses and EMIs prefilled from bank data to confirm. Emergency-fund suggestion is computed ("about ₹X"); amounts are shown in words as typed; scenario questions |
| A5 Risk reveal | Conservative / Moderate / Aggressive, ability vs willingness, a transparency line, a kind explanation when they disagree, Retake |
| A6 Home | Total value, allocation as one bar with target markers, a one-line verdict, a single advice card. Simple view toggle |
| A7 Assistant | The advice card expands into the chat in place, with a seeded first message. Instrument lessons (FD, G-Secs/T-Bills, bonds, debt and equity funds, gold, PPF, NPS) show tax chips. Follow-up chips after every reply. Declines guaranteed-return and stock-tip questions |
| A8 Grow | SIP or lump sum, cautious/expected/optimistic range, invested-vs-growth chart, after-tax and inflation toggles, a ₹1 crore milestone, "start 5 years earlier". Prefilled from the advice or the chat |
| A9 My money | Holdings grouped by asset class, account sources shown subtly, tax chips, **Explain this**, X-Ray data checks, tax at a glance, refresh, revoke |
| A10 Ongoing | Save and resume (localStorage), jargon tooltips, a printable one-page summary, a "re-check your profile" prompt, and lessons with quizzes (11 topics) |

## Technical flow (Part B)

| PDF section | Where |
|---|---|
| B3 Questionnaire engine | `src/config/questions.ts` (schema, branching, prefill paths) |
| B4 Mock AA | `src/engine/aa.ts` with personas in `src/personas/*.json` (raw shapes differ per account type) |
| B5 Normalisation | `src/engine/normalise.ts`: validate/reject, resolve names and tickers, run X-Ray, merge across accounts with weighted average cost, classify, enrich, quality prompts |
| X-Ray rules | `src/engine/xray.ts`: 7 rules with evidence, reasoning and uncertainty |
| B6 Risk | `src/engine/risk.ts` (capacity, tolerance, the lower one wins, life-stage adjustment) |
| B7 Suitability | `src/engine/suitability.ts` (target by profile × life stage, drift, verdicts, concentration) |
| B8 Tax | `src/engine/tax.ts` with config in `src/config/tax.ts` (FY 2026-27 table, source, last-verified date) |
| B9 Calculator | `src/engine/calc.ts` (the PDF's formulas, range, after-tax, inflation, milestone) |
| Advice builder | `src/engine/advice.ts` |
| B10 Assistant | `src/engine/assistant.ts` (scripted; numbers only from engines) and `src/data/instruments.ts` (lesson library) |
| B11 API surface | `src/engine/pipeline.ts` (`api` facade shaped like the endpoints; runs locally) |
| B12 State | `src/store.tsx` (single store, persisted, derived portfolio and analysis) |
| B13 Errors | Failed or partial fetches, unmatched securities, missing dates (estimated with a note), stale prices (≈), tax staleness check, assistant fallback, error boundary |
| B15 Tests | `src/engine/*.test.ts`: tax stacking (rebate loss at ₹12 lakh, shared ₹1.25 lakh exemption, debt-fund slab), personas end to end, AA failures |

## Tax assumptions

The tax engine uses the FY 2026-27 rates **as stated in the design document**: new-regime slabs, the ₹12 lakh rebate, the ₹75,000 standard deduction, 20% equity STCG, 12.5% equity LTCG above ₹1.25 lakh, and slab rate for FD/bond interest and for debt funds bought on or after 1 April 2023. These rates have **not been independently or legally verified**. The "last verified" date in `src/config/tax.ts` is the date the document states, not a verification by this project.

Flagged **to verify** (shown in the app as "Rule to verify", with `*` on tax chips and a list in *How this works*):

- **Marginal relief** just above the ₹12 lakh rebate limit. This is a prototype assumption that is *not* in the design document.
- Gold ETF and Sovereign Gold Bond treatment.
- PPF, NPS, ELSS and 80C limits.
- REIT/InvIT distribution components.
- TDS thresholds and surcharge.

Out of scope and estimate only: HUF, NRI, grandfathering on pre-2018 equity, and detailed loss carry-forward.

## Known limitations

- **No real data or backend:** no real AA, login or backend, and no AI model. The assistant uses keyword matching, so unusual phrasing gets a polite fallback with suggestion chips.
- **Tax:** see [Tax assumptions](#tax-assumptions). Have a qualified professional review the rates before any real-world use.
- **Hindi:** covers onboarding, the risk reveal, home and navigation. Lessons, chat and engine-generated text such as advice headlines stay in English. The Hindi copy needs a native-speaker review.
- **Simplified bond and calculator maths:** shown as illustrations, not forecasts.
