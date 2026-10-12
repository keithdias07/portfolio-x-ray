/**
 * Instrument catalogue for "Explore investments" (and the assistant's lesson cards).
 * Written once and reviewed, not generated. General education only — not a recommendation.
 * Tax lines come from the design document's tax table; anything it marks "to verify" is flagged.
 * No live prices, yields or listings: the prototype has no verified live data source.
 */
import { LIBRARY_TAX } from '../config/tax';

export type InstrumentGroup = 'Savings & government' | 'Bonds & debt funds' | 'Shares & equity funds' | 'Property, infrastructure & gold';

export interface OfficialLink { label: string; url: string }

export interface InstrumentLesson {
  id: string;
  name: string;
  group: InstrumentGroup;
  oneLiner: string;
  what: string;
  earn: string;        // how the investor may earn money
  risk: string;        // main risks
  pros: string[];
  cons: string[];
  liquidity: string;   // access / how easily you can get money out
  tax: string;
  taxChip: string;
  verify: boolean;     // tax treatment needs verification
  suits: string;       // who might consider learning more
  topicId?: string;    // deeper lesson in Learn & Explore
  links: OfficialLink[]; // official sources only; each URL checked to respond
  broad: 'equity' | 'debt' | 'gold' | 'cash';
}

const L = {
  rbiRetailDirect: { label: 'RBI Retail Direct', url: 'https://rbiretaildirect.org.in/' },
  rbi: { label: 'Reserve Bank of India', url: 'https://www.rbi.org.in/' },
  sebiInvestor: { label: 'SEBI investor website', url: 'https://investor.sebi.gov.in/' },
  sebi: { label: 'SEBI', url: 'https://www.sebi.gov.in/' },
  amfi: { label: 'AMFI', url: 'https://www.amfiindia.com/' },
  nps: { label: 'NPS Trust', url: 'https://npstrust.org.in/' },
  nsi: { label: 'National Savings Institute', url: 'https://www.nsiindia.gov.in/' },
  indiaPost: { label: 'India Post', url: 'https://www.indiapost.gov.in/' },
  incomeTax: { label: 'Income Tax Department', url: 'https://www.incometax.gov.in/' },
};

export const INSTRUMENT_LESSONS: InstrumentLesson[] = [
  {
    id: 'fd', name: 'Bank fixed deposits (FDs)', group: 'Savings & government', broad: 'debt',
    oneLiner: 'Lend to a bank for a fixed time at a fixed rate.',
    what: 'You deposit money with a bank for a fixed period at an interest rate agreed on day one.',
    earn: 'Interest, paid out regularly or added up and paid at maturity.',
    risk: 'Low, but interest often trails inflation after tax, and breaking early usually costs a penalty.',
    pros: ['Predictable return', 'Simple to open', 'Bank deposits are insured up to a limit per bank (check DICGC rules)'],
    cons: ['Interest is taxed every year', 'May not beat inflation over long periods', 'Penalty for early withdrawal'],
    liquidity: 'Can usually be broken early with a penalty; tax-saving FDs are locked in.',
    tax: 'Interest is added to your income and taxed at your slab rate each year, even if you don’t withdraw it.',
    taxChip: LIBRARY_TAX.fd.chip, verify: !LIBRARY_TAX.fd.verified,
    suits: 'People who need money on a known date in 1–3 years, or a safe place for part of an emergency fund.',
    links: [L.rbi],
  },
  {
    id: 'gsec', name: 'Government Securities: G-Secs & T-Bills', group: 'Savings & government', broad: 'debt', topicId: 'gsecs',
    oneLiner: 'Lend to the Government of India — via RBI Retail Direct.',
    what: 'Loans to the Government. Treasury Bills last up to a year; dated G-Secs last longer and usually pay interest twice a year.',
    earn: 'T-Bills: bought below face value, repaid at face value. Dated G-Secs: regular coupon interest, plus or minus any price change if sold early.',
    risk: 'Practically no default risk, but long-dated G-Sec prices fall when interest rates rise.',
    pros: ['Backed by the Government of India', 'Individuals can buy directly through RBI Retail Direct', 'Wide choice of maturities'],
    cons: ['Long bonds can lose value if sold before maturity', 'Selling early can be harder for small investors', 'Interest is taxable'],
    liquidity: 'Best held to maturity; can be sold in the secondary market at the market price.',
    tax: 'Interest is taxed at your slab rate.',
    taxChip: LIBRARY_TAX.gsec.chip, verify: !LIBRARY_TAX.gsec.verified,
    suits: 'Safety-first savers who can hold to maturity and want sovereign backing. Current auctions and listings are on RBI Retail Direct.',
    links: [L.rbiRetailDirect, L.rbi],
  },
  {
    id: 'ppf', name: 'Public Provident Fund (PPF)', group: 'Savings & government', broad: 'debt',
    oneLiner: 'Long-term, government-backed savings account.',
    what: 'A small-savings scheme with a 15-year term; the government sets the interest rate each quarter.',
    earn: 'Interest that compounds over the years.',
    risk: 'Very low credit risk; the main cost is that money is locked in for a long time.',
    pros: ['Government-backed', 'Disciplined long-term saving', 'Generally tax-advantaged (rules to verify)'],
    cons: ['Long lock-in with limited withdrawals', 'Yearly deposit limits apply', 'Rate can change each quarter'],
    liquidity: 'Low: partial withdrawals and loans are allowed only after set years.',
    tax: 'Generally treated as tax-free on interest and maturity, but deposit limits and deductions are marked “to verify”.',
    taxChip: LIBRARY_TAX.ppf.chip, verify: !LIBRARY_TAX.ppf.verified,
    suits: 'Long-term, cautious savers who won’t need the money for many years.',
    links: [L.nsi, L.indiaPost],
  },
  {
    id: 'bond', name: 'Corporate bonds & NCDs', group: 'Bonds & debt funds', broad: 'debt', topicId: 'bonds-basics',
    oneLiner: 'Lend to a company for a fixed coupon.',
    what: 'Loans to companies that pay a fixed coupon and repay your money at maturity.',
    earn: 'Coupon interest, plus or minus any price change if you sell before maturity.',
    risk: 'Credit risk (the company may not pay) and liquidity risk (many bonds trade rarely).',
    pros: ['Usually higher interest than FDs or G-Secs', 'Credit ratings help compare risk', 'Fixed income schedule'],
    cons: ['The company could default', 'Hard to sell quickly at a fair price', 'Interest is taxable'],
    liquidity: 'Listed bonds can be sold on exchanges, but trading is often thin.',
    tax: 'Interest is taxed at your slab rate.',
    taxChip: LIBRARY_TAX.bond.chip, verify: !LIBRARY_TAX.bond.verified,
    suits: 'Investors wanting more income than FDs who understand credit ratings and can hold to maturity.',
    links: [L.sebiInvestor],
  },
  {
    id: 'debt-fund', name: 'Debt mutual funds', group: 'Bonds & debt funds', broad: 'debt', topicId: 'mutual-funds',
    oneLiner: 'A managed basket of bonds and money-market instruments.',
    what: 'Funds that pool money into many bonds and money-market instruments, run by a professional manager.',
    earn: 'The fund’s NAV rises as its bonds earn interest (and changes with bond prices).',
    risk: 'Interest-rate and credit risk depend on the fund — check its category and riskometer.',
    pros: ['Diversified across many issuers', 'Easy to invest and withdraw', 'No yearly tax while you stay invested'],
    cons: ['Value can fall when rates rise', 'Some categories carry credit risk', 'Expense ratio reduces returns'],
    liquidity: 'Usually redeemable on any business day; some funds charge an exit load.',
    tax: 'Units bought on or after 1 April 2023: gains are taxed at your slab rate when you redeem.',
    taxChip: LIBRARY_TAX['debt-fund'].chip, verify: !LIBRARY_TAX['debt-fund'].verified,
    suits: 'Parking money for months to a few years with easy access.',
    links: [L.amfi, L.sebiInvestor],
  },
  {
    id: 'stock', name: 'Direct stocks (shares)', group: 'Shares & equity funds', broad: 'equity', topicId: 'investing-basics',
    oneLiner: 'Own a small part of one company.',
    what: 'Shares of individual companies, bought and sold on stock exchanges through a broker and held in a demat account.',
    earn: 'A rise in the share price, plus any dividends the company pays.',
    risk: 'Company-specific risk: one company can fall far more than the market. Prices can swing a lot.',
    pros: ['Direct ownership in businesses', 'Easy to buy and sell on exchanges', 'Long-term growth potential'],
    cons: ['Needs research and monitoring', 'Easy to become concentrated in a few names', 'Emotional decisions can hurt returns'],
    liquidity: 'High for large companies; small companies can be hard to sell.',
    tax: 'Gains: 20% if sold within 12 months; 12.5% on long-term gains above ₹1.25 lakh a year. Dividends are generally added to income — verify current rules.',
    taxChip: LIBRARY_TAX['equity-fund'].chip, verify: !LIBRARY_TAX['equity-fund'].verified,
    suits: 'Investors with a long horizon who can research companies and accept large swings — usually alongside diversified funds.',
    links: [L.sebiInvestor],
  },
  {
    id: 'equity-fund', name: 'Equity mutual funds & index funds', group: 'Shares & equity funds', broad: 'equity', topicId: 'mutual-funds',
    oneLiner: 'A managed basket of many company shares.',
    what: 'Funds that invest in many company shares; index funds simply track a market index at low cost.',
    earn: 'The fund’s NAV rises (or falls) with the shares it holds; you gain when you redeem at a higher NAV.',
    risk: 'Market risk: values can fall 20–40% in bad years. Time and diversification help, but nothing is guaranteed.',
    pros: ['Instant diversification', 'Start small with a monthly SIP', 'Professionally managed or low-cost index options'],
    cons: ['Market falls affect the whole fund', 'Expense ratio and exit loads', 'Needs patience — best for 5+ years'],
    liquidity: 'Usually redeemable on any business day (ELSS funds have a lock-in).',
    tax: 'Gains are taxed at 20% if sold within 12 months; after that, 12.5% on gains above ₹1.25 lakh a year.',
    taxChip: LIBRARY_TAX['equity-fund'].chip, verify: !LIBRARY_TAX['equity-fund'].verified,
    suits: 'Long-term goals 5+ years away, ideally invested regularly through a SIP.',
    links: [L.amfi, L.sebiInvestor],
  },
  {
    id: 'nps', name: 'National Pension System (NPS)', group: 'Shares & equity funds', broad: 'equity',
    oneLiner: 'A low-cost, locked-in retirement account.',
    what: 'A retirement account regulated by PFRDA that invests in a mix of equity, bonds and G-Secs that you choose.',
    earn: 'Market-linked growth of your chosen mix until retirement.',
    risk: 'Market-linked returns; most money is locked until 60 and part must buy an annuity.',
    pros: ['Low cost', 'Disciplined retirement saving', 'Some tax benefits (rules to verify)'],
    cons: ['Long lock-in', 'Part of the corpus must buy an annuity', 'Returns not guaranteed'],
    liquidity: 'Low: withdrawals before retirement are limited.',
    tax: 'Some contributions and withdrawals get tax benefits; the rules are marked “to verify”.',
    taxChip: LIBRARY_TAX.nps.chip, verify: !LIBRARY_TAX.nps.verified,
    suits: 'Retirement savers who want a disciplined, locked-in route.',
    links: [L.nps],
  },
  {
    id: 'reit', name: 'REITs (Real Estate Investment Trusts)', group: 'Property, infrastructure & gold', broad: 'equity', topicId: 'reits',
    oneLiner: 'Own a slice of rent-earning office and retail property.',
    what: 'Trusts that own completed, rent-earning property such as office parks, malls and warehouses. Units trade on stock exchanges.',
    earn: 'Regular distributions from rental income, plus any change in the unit price.',
    risk: 'Vacancies and falling rents, interest rates, borrowing levels; distributions are not guaranteed.',
    pros: ['Property exposure with a small amount', 'SEBI-regulated; most distributable cash is paid out', 'Traded on exchanges'],
    cons: ['Unit prices can fall', 'Payouts vary', 'Trading volumes can be low'],
    liquidity: 'Exchange-traded, but some units trade thinly.',
    tax: 'Distributions mix interest, dividend and repayment of capital, each taxed differently — treatment marked “to verify”.',
    taxChip: 'Mixed · to verify', verify: true,
    suits: 'Investors wanting real-estate exposure and regular payouts, who accept price swings.',
    links: [L.sebi, L.sebiInvestor],
  },
  {
    id: 'invit', name: 'InvITs (Infrastructure Investment Trusts)', group: 'Property, infrastructure & gold', broad: 'equity', topicId: 'invits',
    oneLiner: 'Own a slice of roads, power lines or pipelines.',
    what: 'Trusts that own infrastructure such as toll roads, power transmission lines or pipelines and pass on the cash they generate.',
    earn: 'Distributions from tolls or usage charges, plus any change in the unit price.',
    risk: 'Traffic or usage, regulation, borrowing, and concessions that end after a fixed period.',
    pros: ['Exposure to infrastructure cash flows', 'SEBI-regulated', 'Regular distributions'],
    cons: ['Part of a payout may be your own capital returned', 'Unit value can fall as concessions run out', 'Trading volumes can be low'],
    liquidity: 'Publicly offered InvITs trade on exchanges; volumes can be thin.',
    tax: 'Distributions mix interest, dividend and repayment of capital — treatment marked “to verify”.',
    taxChip: 'Mixed · to verify', verify: true,
    suits: 'Income-focused investors who understand that high payouts may include return of capital.',
    links: [L.sebi, L.sebiInvestor],
  },
  {
    id: 'gold', name: 'Gold (ETFs, gold funds, SGBs)', group: 'Property, infrastructure & gold', broad: 'gold', topicId: 'etfs',
    oneLiner: 'Track gold prices without storing physical gold.',
    what: 'Gold ETFs and gold funds track the gold price; Sovereign Gold Bonds were government bonds linked to gold (check current availability).',
    earn: 'A rise in the gold price (SGBs also paid fixed interest).',
    risk: 'Gold can stay flat or fall for years and pays no regular income (except SGB interest).',
    pros: ['Diversifies a share-heavy portfolio', 'No storage or purity worries', 'Easy to buy in small amounts'],
    cons: ['No regular income from ETFs/funds', 'Long flat periods are possible', 'Expense ratios for ETFs/funds'],
    liquidity: 'ETFs trade on exchanges; gold funds redeem on business days.',
    tax: 'Tax treatment of gold ETFs and Sovereign Gold Bonds is marked “to verify” in our tax table.',
    taxChip: LIBRARY_TAX.gold.chip, verify: !LIBRARY_TAX.gold.verified,
    suits: 'Investors wanting a small diversifying share (often 5–10%).',
    links: [L.rbi, L.amfi],
  },
];

export const INSTRUMENT_GROUPS: InstrumentGroup[] = ['Savings & government', 'Bonds & debt funds', 'Shares & equity funds', 'Property, infrastructure & gold'];

export const lessonById = Object.fromEntries(INSTRUMENT_LESSONS.map((l) => [l.id, l])) as Record<string, InstrumentLesson>;

/** REIT vs InvIT, side by side. */
export const REIT_VS_INVIT: { aspect: string; reit: string; invit: string }[] = [
  { aspect: 'What it owns', reit: 'Completed, rent-earning property: offices, malls, warehouses', invit: 'Infrastructure: toll roads, power lines, pipelines and similar assets' },
  { aspect: 'Where income comes from', reit: 'Rent paid by tenants', invit: 'Tolls, tariffs or usage charges' },
  { aspect: 'Asset life', reit: 'Buildings are usually long-lived', invit: 'Many assets run on concessions that end after a fixed period' },
  { aspect: 'Main risks', reit: 'Vacancies, falling rents, interest rates', invit: 'Traffic or usage, regulation, concession end, interest rates' },
  { aspect: 'Payouts', reit: 'Most distributable cash paid out; mix of interest, dividend, capital repayment', invit: 'Similar mix; a larger part may be return of capital' },
  { aspect: 'Regulator', reit: 'SEBI (REIT regulations)', invit: 'SEBI (InvIT regulations)' },
];

/** How government securities differ from other bonds. */
export const GOVT_VS_OTHER_BONDS: { name: string; issuer: string; term: string; income: string; note: string }[] = [
  { name: 'Treasury Bills (T-Bills)', issuer: 'Government of India', term: 'Up to 1 year', income: 'Bought at a discount, repaid at face value', note: 'Listed and auctioned via RBI Retail Direct' },
  { name: 'Dated G-Secs', issuer: 'Government of India', term: 'Several years to decades', income: 'Fixed coupon, usually twice a year', note: 'Prices move with interest rates if sold early' },
  { name: 'State Development Loans (SDLs)', issuer: 'State governments', term: 'Several years', income: 'Fixed coupon, usually twice a year', note: 'Also available via RBI Retail Direct' },
  { name: 'Government savings bonds', issuer: 'Government, sold through banks (e.g. RBI Floating Rate Savings Bonds)', term: 'Fixed term', income: 'Interest; rate may reset periodically', note: 'Generally not tradable — check current terms on RBI’s website' },
  { name: 'Corporate bonds / NCDs', issuer: 'Companies and financial firms', term: 'Varies', income: 'Fixed coupon', note: 'Credit risk: check the rating; trading can be thin' },
];
