# Acceptance checklist: chartered accountant consultation and design document

Requirements gathered from a chartered accountant's input during development (not an endorsement), mapped to the implementation and the automated tests that cover them. Test files live in `src/engine/`.

| # | Requirement | Before this pass | Change made | Proven by |
|---|---|---|---|---|
| A1 | Life stage, age, dependents, goals | Present | Kept (goals branch on life stage) | `features.test.ts` › A |
| A2 | Income, expenses, EMIs, emergency/medical backup | Present (bank-prefilled) | Kept | `engines.test.ts` › bank prefill; `features.test.ts` › A |
| A3 | Investment experience & attitude to losses | Only reactions to losses | Added **investing experience** (caps a first-timer's willingness at Moderate, with an explanation) | `features.test.ts` › C (beginner cap) |
| A4 | Existing investments & monthly surplus | From simulated AA + computed surplus | Kept | `engines.test.ts` › normalisation |
| A5 | Horizon & need for liquidity/regular income | Horizon inferred from age only | Added **when the money is needed** (limits capacity) and **regular-income need** | `features.test.ts` › A, C |
| A6 | One question per screen, plain language, examples, progress, back, defaults | Present | Kept; 16 questions total, each with an example or why-we-ask line and Not sure | `features.test.ts` › A |
| B1 | Consent → fetch → normalise → confirm → findings | Present, with failure paths | Kept | `engines.test.ts` › AA, normalisation; `qa.test.ts` › retries |
| B2 | 7 X-Ray rules | Present | Kept | `xray.test.ts` |
| B3 | Each finding: what / evidence / why it matters / what to verify | Evidence and steps present; no explicit "why" | Added **Why it may matter** for every category and a **Potential discrepancy** label | `features.test.ts` › B |
| B4 | Cautious wording, no fraud claims, no real data | Present | Kept and tested | `features.test.ts` › B |
| C1 | Capacity and willingness separate; lower wins | Present | Kept | `qa.test.ts` › risk; `features.test.ts` › C |
| C2 | Allocation vs target by profile and life stage | Present | Kept | `engines.test.ts` › personas |
| C3 | Concentration: holdings **and sectors** | Holdings only | Added **sector concentration** (direct stocks) | `features.test.ts` › C |
| C4 | Horizon, liquidity, obligations | Partly (via risk score) | Added **emergency-buffer shortfall** (shown first), **short-horizon equity** and **income-need** checks | `features.test.ts` › C |
| C5 | Explain fit, gaps, direction, why; not advice | Present | Kept; new verdicts have headlines and "if you do nothing" text | `features.test.ts` › C |
| D1 | FDs, G-Secs/T-Bills, corporate bonds, equity/debt funds, stocks, gold, PPF, NPS, REITs, InvITs | 8 short cards in a sheet | **Explore investments** in a new **Learn** tab: 11 cards | `features.test.ts` › D |
| D2 | Card: what, how it earns, risks, pros/cons, liquidity, tax, who might consider | 4 fields | All fields, plus verified official links | `features.test.ts` › D |
| D3 | REIT vs InvIT; G-Secs vs other bonds; RBI Retail Direct | Separate lessons only | Two comparison sheets and an RBI Retail Direct link | `features.test.ts` › D |
| D4 | No invented listings; illustrative samples labelled; verified links only | n/a | No live data; links limited to official domains that were checked to respond | `features.test.ts` › D (domain allow-list) |
| E1 | SIP, lump sum, duration, editable return, 3 scenarios | Present | Kept | `engines.test.ts`, `qa.test.ts` › calculator |
| E2 | Invested vs growth vs inflation-adjusted vs post-tax | One headline number | **Breakdown** panel and **Assumptions** panel | `features.test.ts` › E |
| E3 | After-tax by instrument; unverified rules not applied | Equity fund / FD / debt fund | Added gold/REIT/InvIT/PPF/NPS as **"not estimated — rule to verify"** | `features.test.ts` › E |
| F1 | Tax visible, estimates not liabilities, dates shown, unverified flagged | Present | Tax line on every card; new **Tax basics** lesson; "not independently verified" kept | `qa.test.ts` › tax; `features.test.ts` › D, G |
| G1 | Keep the existing 11 lessons and quizzes | Present | Kept, each given a worked **example** and related investments | `features.test.ts` › G |
| G2 | Basics, risk & diversification, stocks & funds, bonds & G-Secs, REITs & InvITs, liquidity, tax basics, do's & don'ts | Basics, liquidity, tax basics and do's & don'ts missing | Added 4 lessons (15 total, basics first) | `features.test.ts` › G |
| G3 | Quizzes with feedback and progress; linked to X-Ray | Present | Shared scoring and progress helpers; Learn tab shows lessons linked to your findings | `features.test.ts` › G; `qa.test.ts` › persistence |
| H1 | Assistant: fit, instrument risk and tax, literacy, lessons, calculator | Fit, tax, 8 instruments, Grow hand-off | Added REITs, InvITs, stocks, literacy questions (compounding, diversification, liquidity, scams) and links to Explore and the tax lesson | `features.test.ts` › H |
| H2 | Scripted, disclosed honestly; no tips or guarantees | Present | Kept and tested | `engines.test.ts`, `features.test.ts` › H |
| I | Simple, readable on mobile, transparent | Present | 4-tab navigation; no new dashboards | Browser QA at 375 px |

Not implemented, and stated honestly in the app and README: live market data and bond listings, purchases, XIRR, purchase lots, surcharge, full Hindi translation of lessons and chat, and independent verification of tax rates.
