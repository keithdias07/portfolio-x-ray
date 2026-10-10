# Portfolio X-Ray

An explainable investment-integrity and learning platform for Indian retail investors. Hackathon prototype.

> **All data is synthetic.** Every instrument, account, identifier (prefixed `DM-`), price and statement is fictional.
> The prototype has no connection to real brokers, depositories, RTAs or Account Aggregators, uses no AI model, and does not give investment advice.

## Run it

Needs Node.js 18 or later (tested on Node 24).

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm test           # rule-engine + bond-maths unit tests (Vitest)
npm run typecheck  # TypeScript
npm run build      # production build to dist/
npm run preview    # serve the production build
```

## What's inside

| Area | What it does |
|---|---|
| **Overview** | Reconciled portfolio value next to what a naive tracker would show, a data-integrity score, allocation, the 6 synthetic sources, and a holdings table. Click any row to see where each value came from, including the raw statement lines. |
| **Portfolio X-Ray** | 7 fixed rules produce 7 findings: duplicate holding, unapplied stock split, quantity conflict explained by a later trade, missing cost basis, stale bond price, yield mislabelled as coupon, MF unit rounding. Each finding shows evidence with the source and date of every value, numbered reasoning, possible explanations, uncertainty, verification steps and a link to the matching lesson. Findings can be marked as reviewed. |
| **Impact Simulator** | (A) Data-interpretation scenarios: pick which source you believe for each finding and see the reported value and its plausible range. (B) Hypothetical market what-if: rate, equity, gold and REIT/InvIT sliders, with bonds and debt funds moved by modified duration. Both are clearly labelled as simulations. |
| **Learn & Explore** | 11 lessons covering bonds, G-Secs, coupon vs yield, ETFs, mutual funds, REITs, InvITs, investment risk, corporate actions, CAS reconciliation and cost basis. Includes 4 interactive widgets, 3-question quizzes with explanations, progress tracking (localStorage), recommendations based on X-Ray findings, and links to official sources (SEBI, RBI, AMFI, NSDL, CDSL, NISM, Income Tax Dept). |
| **Methodology** | What is real and what is simulated, the reconciliation pipeline, rule thresholds, the score formula and disclaimers. |

## Code map

- `src/data/portfolio.ts`: the single synthetic dataset (sources, records, prices, corporate actions, trades)
- `src/engine/xray.ts`: deterministic rules engine, reconciliation and integrity score
- `src/engine/xray.test.ts`: unit tests
- `src/lib/bond.ts`: YTM, current yield, modified duration (simplified)
- `src/data/learn.ts`: lessons, quizzes, official resources
- `src/pages/*`: Overview, XRay, Simulator, Learn, Topic, Methodology

## 3-minute demo script

1. **Overview:** "Your apps say ₹19.19 L; X-Ray says ₹16.90 L." Click Sterling Motors to show the provenance drawer with raw lines.
2. **X-Ray:** watch the rules run. Open the Meridian duplicate, then the Sterling split, and point out the highlighted evidence rows and the reasoning steps.
3. Click **Simulate interpretations**, toggle "count both records" and watch the range strip move.
4. Back on the Housing Finance finding, click the lesson card to open **Coupon vs yield**, drag the price slider, then take the quiz. Progress updates in the sidebar.
5. **Mark as reviewed** a few findings and watch the integrity score rise.
6. Close on **Methodology**: everything is deterministic and transparent, and the data is synthetic.
