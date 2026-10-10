/**
 * Educational content for Learn & Explore.
 * Written for general education only — not investment, tax or legal advice.
 * Rules and thresholds change; learners are pointed to official sources for current details.
 */

export interface Resource {
  id: string;
  title: string;
  publisher: string;
  url: string;
  description: string;
}

export const resources: Record<string, Resource> = {
  sebiInvestor: {
    id: 'sebiInvestor', title: 'SEBI Investor Website', publisher: 'Securities and Exchange Board of India',
    url: 'https://investor.sebi.gov.in/', description: 'SEBI’s investor-education portal: plain-language guides on securities markets, products and investor rights.',
  },
  sebi: {
    id: 'sebi', title: 'SEBI — Official website', publisher: 'Securities and Exchange Board of India',
    url: 'https://www.sebi.gov.in/', description: 'Regulations, circulars and investor-protection material, including REIT, InvIT and mutual-fund rules.',
  },
  scores: {
    id: 'scores', title: 'SEBI SCORES (complaints)', publisher: 'Securities and Exchange Board of India',
    url: 'https://scores.sebi.gov.in/', description: 'SEBI’s online system for lodging and tracking complaints against regulated entities.',
  },
  smartodr: {
    id: 'smartodr', title: 'SMART ODR portal', publisher: 'Market infrastructure institutions (SEBI framework)',
    url: 'https://smartodr.in/', description: 'Online dispute-resolution portal for securities-market disputes.',
  },
  rbiRetailDirect: {
    id: 'rbiRetailDirect', title: 'RBI Retail Direct', publisher: 'Reserve Bank of India',
    url: 'https://rbiretaildirect.org.in/', description: 'RBI’s platform for individuals to open a gilt account and invest directly in government securities.',
  },
  rbi: {
    id: 'rbi', title: 'Reserve Bank of India', publisher: 'Reserve Bank of India',
    url: 'https://www.rbi.org.in/', description: 'Monetary policy, government-securities auctions and financial-education material.',
  },
  amfi: {
    id: 'amfi', title: 'AMFI — Association of Mutual Funds in India', publisher: 'AMFI',
    url: 'https://www.amfiindia.com/', description: 'Industry body site with NAV data and investor-awareness material on mutual funds.',
  },
  nsdl: {
    id: 'nsdl', title: 'NSDL', publisher: 'National Securities Depository Ltd',
    url: 'https://nsdl.co.in/', description: 'Depository: demat accounts, consolidated account statements (CAS) and investor resources.',
  },
  cdsl: {
    id: 'cdsl', title: 'CDSL', publisher: 'Central Depository Services (India) Ltd',
    url: 'https://www.cdslindia.com/', description: 'Depository: demat accounts, CAS and investor-education resources.',
  },
  nism: {
    id: 'nism', title: 'NISM', publisher: 'National Institute of Securities Markets (set up by SEBI)',
    url: 'https://www.nism.ac.in/', description: 'Financial-education programmes and certifications for investors and market professionals.',
  },
  incomeTax: {
    id: 'incomeTax', title: 'Income Tax Department', publisher: 'Government of India',
    url: 'https://www.incometax.gov.in/', description: 'Official guidance on capital gains and how to report investment income.',
  },
};

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

export interface Topic {
  id: string;
  title: string;
  tagline: string;
  category: 'Fixed income' | 'Funds & trusts' | 'Risk' | 'Portfolio hygiene';
  minutes: number;
  level: 'Beginner' | 'Intermediate';
  accent: string; // tailwind gradient classes
  sections: { heading: string; body: string; bullets?: string[] }[];
  takeaways: string[];
  widget?: 'yield-explorer' | 'risk-ladder' | 'split-visual' | 'reconcile-visual';
  quiz: QuizQuestion[];
  resources: string[];
}

export const topics: Topic[] = [
  {
    id: 'bonds-basics', title: 'Bonds & debentures 101', tagline: 'How lending to a company or government pays you back.',
    category: 'Fixed income', minutes: 5, level: 'Beginner', accent: 'from-sky-500 to-indigo-600',
    sections: [
      { heading: 'What is a bond?', body: 'A bond is a loan you give to an issuer, such as a company, bank or government. In return the issuer promises regular interest (the coupon) and repays the face value on the maturity date. In India, bonds issued by companies are often called non-convertible debentures (NCDs).' },
      { heading: 'The key terms', body: 'Every bond has a few defining numbers:', bullets: [
        'Face value: the amount repaid at maturity (often ₹1,000 or ₹1 lakh for corporate bonds, ₹100 for G-Secs).',
        'Coupon rate: annual interest as a % of face value. It is fixed when the bond is issued.',
        'Maturity: when the principal is repaid.',
        'Credit rating: an agency’s opinion of how likely the issuer is to pay on time.',
      ] },
      { heading: 'Why prices move', body: 'After issue, a bond’s market price changes. When interest rates in the economy rise, older bonds with lower coupons become less attractive, so their prices fall. When rates fall, their prices rise. Longer-maturity bonds react more strongly.' },
      { heading: 'Buying bonds as a retail investor', body: 'Listed bonds trade on stock exchanges and are held in your demat account. SEBI also regulates online bond platform providers, which offer listed bonds to individuals. Many corporate bonds trade rarely, so it can be hard to sell quickly at a fair price.' },
    ],
    takeaways: ['Coupon is fixed; market price is not.', 'Rates up → bond prices down (and vice-versa).', 'Credit risk and liquidity matter as much as the coupon.'],
    quiz: [
      { q: 'A bond’s coupon rate is calculated as a percentage of its…', options: ['Market price', 'Face value', 'Purchase price', 'Credit rating'], answer: 1, why: 'Coupon = annual interest ÷ face value. It does not change when the market price changes.' },
      { q: 'If market interest rates rise, the price of an existing fixed-coupon bond will typically…', options: ['Rise', 'Stay the same', 'Fall', 'Become zero'], answer: 2, why: 'New bonds now pay more, so existing lower-coupon bonds must become cheaper to compete.' },
      { q: 'What does a credit rating mainly tell you?', options: ['Future price of the bond', 'Likelihood the issuer pays on time', 'The bond’s liquidity', 'The tax rate on interest'], answer: 1, why: 'A rating is an opinion on credit risk, the chance of default. It is not a guarantee.' },
    ],
    resources: ['sebiInvestor', 'sebi', 'nism'],
  },
  {
    id: 'gsecs', title: 'Government securities (G-Secs)', tagline: 'Lending to the Government of India — T-Bills, dated securities and SDLs.',
    category: 'Fixed income', minutes: 4, level: 'Beginner', accent: 'from-emerald-500 to-teal-600',
    sections: [
      { heading: 'What they are', body: 'Government securities are debt instruments issued by the central or state governments. The Reserve Bank of India manages their issue through auctions.', bullets: [
        'Treasury Bills (T-Bills): short-term (91, 182 or 364 days), issued at a discount and redeemed at face value. They pay no coupon.',
        'Dated securities: longer-term bonds that usually pay a fixed coupon every six months.',
        'State Development Loans (SDLs): bonds issued by state governments.',
      ] },
      { heading: 'Risk profile', body: 'Central government securities are considered to carry practically no credit risk. They do have interest-rate risk: a long-dated G-Sec can fall noticeably in price if rates rise. Selling before maturity can produce gains or losses.' },
      { heading: 'How individuals can invest', body: 'Individuals can buy G-Secs through RBI Retail Direct, where they open a gilt account directly with the RBI. They can also use the non-competitive bidding facilities offered through stock exchanges and brokers, or buy gilt mutual funds and ETFs.' },
    ],
    takeaways: ['Near-zero credit risk ≠ zero risk: prices still move with rates.', 'T-Bills are discount instruments; dated G-Secs pay semi-annual coupons.', 'RBI Retail Direct lets individuals invest directly.'],
    quiz: [
      { q: 'Treasury Bills pay investors through…', options: ['Semi-annual coupons', 'Issue at a discount, repaid at face value', 'Dividends', 'Bonus units'], answer: 1, why: 'T-Bills are zero-coupon: the return is the gap between the discounted issue price and face value.' },
      { q: 'Which risk still applies to a central government bond?', options: ['High default risk', 'Interest-rate risk', 'Corporate-action risk', 'None at all'], answer: 1, why: 'Credit risk is minimal, but market prices still fall when interest rates rise.' },
      { q: 'RBI Retail Direct allows individuals to…', options: ['Trade equities', 'Open a gilt account and invest in G-Secs', 'Buy REIT units', 'File tax returns'], answer: 1, why: 'Retail Direct is the RBI’s platform for direct retail participation in government securities.' },
    ],
    resources: ['rbiRetailDirect', 'rbi', 'sebiInvestor'],
  },
  {
    id: 'coupon-vs-yield', title: 'Coupon rate vs yield', tagline: 'Why the “interest rate” on a bond isn’t your return.',
    category: 'Fixed income', minutes: 6, level: 'Intermediate', accent: 'from-violet-500 to-fuchsia-600',
    sections: [
      { heading: 'Three different numbers', body: 'Investors often mix up three figures:', bullets: [
        'Coupon rate: fixed interest on face value. A 7.95% bond with ₹1,000 face value pays ₹79.50 a year.',
        'Current yield: annual coupon ÷ current market price. It reflects the income you get for what you pay today.',
        'Yield to maturity (YTM): the overall annual return if you buy at today’s price, hold to maturity and every payment is made. It includes any gain or loss at redemption.',
      ] },
      { heading: 'The see-saw rule', body: 'Below face value (at a discount), YTM > current yield > coupon. Above face value (at a premium), YTM < current yield < coupon. At face value, all three are about equal. Try the explorer below to see it.' },
      { heading: 'Why it matters', body: 'Two bonds with the same coupon can offer very different returns depending on their price. When comparing bonds, compare their YTM, and remember that a high yield can also signal higher credit risk.' },
    ],
    takeaways: ['Coupon is fixed at issue; yield depends on the price you pay.', 'Compare bonds using YTM, not coupon.', 'A labelled “yield” that equals the coupon on a discounted bond is a red flag for mislabelling.'],
    widget: 'yield-explorer',
    quiz: [
      { q: 'A bond with an 8% coupon trades at ₹950 (face ₹1,000). Its YTM is most likely…', options: ['Below 8%', 'Exactly 8%', 'Above 8%', 'Zero'], answer: 2, why: 'Buying below face value earns the coupon plus a gain at maturity, so YTM is above the coupon.' },
      { q: 'Current yield is calculated as…', options: ['Coupon ÷ face value', 'Annual coupon ÷ market price', 'Face value ÷ price', 'Price ÷ coupon'], answer: 1, why: 'Current yield relates the cash income to the price you pay today.' },
      { q: 'To compare two bonds’ expected return if held to maturity, the best single figure is…', options: ['Coupon rate', 'Face value', 'Yield to maturity', 'Last traded price'], answer: 2, why: 'YTM combines the coupons and the gain or loss at redemption into one annualised figure.' },
    ],
    resources: ['sebiInvestor', 'rbiRetailDirect', 'nism'],
  },
  {
    id: 'etfs', title: 'Exchange-traded funds (ETFs)', tagline: 'Index funds you buy and sell like a share.',
    category: 'Funds & trusts', minutes: 4, level: 'Beginner', accent: 'from-amber-500 to-orange-600',
    sections: [
      { heading: 'How ETFs work', body: 'An ETF is a fund that usually tracks an index (e.g. a large-cap equity index), a commodity such as gold, or a basket of bonds. Its units are listed on a stock exchange, so you buy and sell them during market hours through a broker and hold them in a demat account.' },
      { heading: 'Things to check', body: 'Before buying an ETF, check:', bullets: [
        'Expense ratio: the annual cost of running the fund.',
        'Tracking error/difference: how closely the ETF follows its index.',
        'Liquidity: trading volumes and the bid–ask spread. Thinly traded ETFs can trade away from their indicative NAV (iNAV).',
      ] },
      { heading: 'ETF vs index mutual fund', body: 'Both can track the same index. An ETF trades at market prices throughout the day and needs a demat account. An index mutual fund is bought or redeemed at end-of-day NAV directly with the fund house.' },
    ],
    takeaways: ['ETFs trade on an exchange; price can differ slightly from NAV.', 'Low cost + low tracking error + good liquidity = good ETF hygiene.'],
    quiz: [
      { q: 'You need which of these to hold ETF units?', options: ['A PPF account', 'A demat account', 'A gilt account only', 'Nothing'], answer: 1, why: 'ETF units are listed securities held in demat form.' },
      { q: 'An ETF’s market price can differ from its NAV mainly because of…', options: ['Taxes', 'Trading supply and demand / liquidity', 'Credit ratings', 'Corporate actions'], answer: 1, why: 'Exchange prices reflect trading. Low liquidity can widen the gap to iNAV.' },
      { q: 'Tracking error measures…', options: ['How often the ETF trades', 'How closely the ETF follows its index', 'The ETF’s dividend', 'The broker fee'], answer: 1, why: 'It is the variability of the difference between ETF returns and index returns.' },
    ],
    resources: ['sebiInvestor', 'amfi', 'nism'],
  },
  {
    id: 'mutual-funds', title: 'Mutual funds', tagline: 'NAV, direct vs regular plans, units and the riskometer.',
    category: 'Funds & trusts', minutes: 5, level: 'Beginner', accent: 'from-rose-500 to-pink-600',
    sections: [
      { heading: 'Pooling money', body: 'A mutual fund pools money from many investors and invests it according to a stated objective. You own units. Each unit’s value, the net asset value (NAV), is published at the end of every business day.' },
      { heading: 'Plans and options', body: 'Most schemes come in two plans:', bullets: [
        'Direct plan: bought directly from the fund house. No distributor commission, so a lower expense ratio.',
        'Regular plan: bought through a distributor, with a higher expense ratio that includes commission.',
        'Growth vs IDCW options: profits stay invested (growth) or are paid out from time to time (Income Distribution cum Capital Withdrawal).',
      ] },
      { heading: 'Units and statements', body: 'Units are usually shown to three decimal places. Your registrar (RTA) statement and your CAS may round slightly differently, so tiny unit differences are normally harmless.' },
      { heading: 'Riskometer', body: 'SEBI requires every scheme to show a riskometer with levels from Low to Very High. Check it along with the scheme category and your own time horizon.' },
    ],
    takeaways: ['NAV is calculated once a day.', 'Direct plans cost less than regular plans of the same scheme.', 'Small rounding gaps in units across statements are normal.'],
    quiz: [
      { q: 'A direct plan typically has a lower expense ratio than the regular plan because…', options: ['It invests in safer assets', 'There is no distributor commission', 'It is tax-free', 'It has fewer units'], answer: 1, why: 'Same portfolio, but the regular plan’s expense includes distributor commission.' },
      { q: 'Two statements show 1,245.632 and 1,245.630 units. The most likely reason is…', options: ['Fraud', 'Rounding of fractional units', 'A stock split', 'A missed SIP'], answer: 1, why: 'Fractional units are rounded or truncated differently. A 0.002-unit gap is immaterial.' },
      { q: 'The riskometer shows…', options: ['Past returns', 'The fund’s risk level', 'The fund manager’s rating', 'The exit load'], answer: 1, why: 'It is a standard SEBI-mandated indicator of a scheme’s risk level.' },
    ],
    resources: ['amfi', 'sebiInvestor', 'sebi'],
  },
  {
    id: 'reits', title: 'REITs', tagline: 'Owning a slice of income-producing real estate.',
    category: 'Funds & trusts', minutes: 4, level: 'Intermediate', accent: 'from-cyan-500 to-blue-600',
    sections: [
      { heading: 'What is a REIT?', body: 'A Real Estate Investment Trust owns and manages income-producing property, mostly office parks, malls and warehouses. It passes most of the rental cash flow on to unitholders. REITs in India are regulated by SEBI and their units trade on stock exchanges.' },
      { heading: 'Key rules (in brief)', body: 'SEBI’s REIT framework requires:', bullets: [
        'Most of the assets must be completed, revenue-generating properties.',
        'Most of the net distributable cash flow must be paid out to unitholders.',
        'Distributions can be made up of interest, dividend, rent and repayment of debt, and each part may be taxed differently.',
      ] },
      { heading: 'Risks', body: 'Occupancy and rent levels, interest rates, leverage and liquidity all affect REIT unit prices. Distributions are not guaranteed.' },
    ],
    takeaways: ['REITs provide real-estate exposure with exchange liquidity.', 'Distributions are not fixed and have mixed components.', 'Check occupancy, leverage and sponsor quality.'],
    quiz: [
      { q: 'A REIT primarily earns income from…', options: ['Lending to companies', 'Rent from completed properties', 'Gold prices', 'Toll roads'], answer: 1, why: 'Rental income from completed, revenue-generating property is the core of a REIT.' },
      { q: 'REIT distributions are…', options: ['Guaranteed and fixed', 'Not guaranteed and can vary', 'Always tax-free', 'Paid only at maturity'], answer: 1, why: 'They depend on cash flows and can change. Their components are taxed differently.' },
      { q: 'Who regulates REITs in India?', options: ['RBI', 'SEBI', 'IRDAI', 'PFRDA'], answer: 1, why: 'REITs fall under SEBI’s REIT Regulations.' },
    ],
    resources: ['sebi', 'sebiInvestor', 'nism'],
  },
  {
    id: 'invits', title: 'InvITs', tagline: 'Infrastructure cash flows — roads, power lines, pipelines.',
    category: 'Funds & trusts', minutes: 4, level: 'Intermediate', accent: 'from-lime-500 to-green-600',
    sections: [
      { heading: 'What is an InvIT?', body: 'An Infrastructure Investment Trust owns infrastructure assets such as toll roads, power transmission lines or pipelines, and distributes the cash they generate. Like REITs, InvITs are regulated by SEBI, and publicly offered InvITs are listed.' },
      { heading: 'A special risk: finite asset life', body: 'Many infrastructure assets have concession periods. A toll road, for example, may return to the government after a set number of years. Part of each distribution can therefore be a return of your capital rather than profit. Unit prices may fall as concessions run out unless the trust buys new assets.' },
      { heading: 'Other risks', body: 'Traffic or usage volumes, regulatory tariff changes, interest rates, leverage and how easily units can be traded all matter.' },
    ],
    takeaways: ['High distributions may partly be a return of capital.', 'Asset concession periods matter for long-term value.'],
    quiz: [
      { q: 'An InvIT holding toll roads faces which particular risk?', options: ['Stock split', 'Concession period ending', 'NAV rounding', 'Coupon reset'], answer: 1, why: 'When concessions end, the asset’s cash flows stop unless replaced.' },
      { q: 'Part of an InvIT distribution can be…', options: ['A bonus share', 'A return of capital', 'A government guarantee', 'A coupon'], answer: 1, why: 'Distributions may include repayment of debt or capital, not just profit.' },
      { q: 'InvITs in India are regulated by…', options: ['SEBI', 'NHAI', 'RBI', 'AMFI'], answer: 0, why: 'SEBI’s InvIT Regulations govern them.' },
    ],
    resources: ['sebi', 'sebiInvestor'],
  },
  {
    id: 'investment-risk', title: 'Understanding investment risk', tagline: 'Market, interest-rate, credit, liquidity — and how they stack up.',
    category: 'Risk', minutes: 6, level: 'Beginner', accent: 'from-slate-600 to-slate-900',
    sections: [
      { heading: 'Risk is more than volatility', body: 'Different investments expose you to different kinds of risk:', bullets: [
        'Market risk: prices fall because the overall market falls.',
        'Interest-rate risk: bond and debt-fund values fall when rates rise.',
        'Credit risk: the issuer fails to pay interest or principal.',
        'Liquidity risk: you can’t sell quickly at a fair price. Infrequent trades and stale prices are warning signs.',
        'Concentration risk: too much in one company, sector or issuer.',
        'Inflation risk: returns don’t keep pace with rising prices.',
      ] },
      { heading: 'Stale prices are a liquidity signal', body: 'If a bond’s last trade was weeks ago, its displayed value is an estimate. You may get less if you need to sell in a hurry. Portfolio X-Ray shows this as an uncertainty band rather than a single exact number.' },
      { heading: 'Managing risk', body: 'Diversify across asset classes and issuers. Match investments to your time horizon. Keep an emergency fund in liquid instruments. Read the risk disclosures before investing.' },
    ],
    takeaways: ['Every asset has a different risk mix — none is risk-free.', 'Displayed value ≠ realisable value for illiquid holdings.', 'Diversification reduces, but does not remove, risk.'],
    widget: 'risk-ladder',
    quiz: [
      { q: 'A corporate bond hasn’t traded for four weeks. Which risk does this most directly signal?', options: ['Inflation risk', 'Liquidity risk', 'Currency risk', 'Bonus risk'], answer: 1, why: 'Infrequent trading means you may not find a buyer at the last traded price.' },
      { q: 'Which investment is MOST exposed to interest-rate risk?', options: ['A 10-year G-Sec', 'A savings account', 'A 91-day T-Bill', 'Cash'], answer: 0, why: 'Longer maturity means higher duration and bigger price changes when rates move.' },
      { q: 'Diversification mainly reduces…', options: ['All risk completely', 'Concentration / issuer-specific risk', 'Inflation', 'Taxes'], answer: 1, why: 'Spreading across issuers and assets reduces the impact of any single one failing.' },
    ],
    resources: ['sebiInvestor', 'nism', 'scores'],
  },
  {
    id: 'corporate-actions', title: 'Corporate actions: splits & bonuses', tagline: 'Why your share count can double overnight — and your wealth doesn’t.',
    category: 'Portfolio hygiene', minutes: 4, level: 'Beginner', accent: 'from-orange-500 to-red-600',
    sections: [
      { heading: 'Common corporate actions', body: 'Companies take actions that change your holdings:', bullets: [
        'Stock split: face value is divided (e.g. ₹10 → ₹5), so you get more shares and the price adjusts down proportionately.',
        'Bonus issue: free extra shares from reserves (e.g. 1:1), with the price adjusting down.',
        'Dividends, rights issues, buybacks, mergers and demergers.',
      ] },
      { heading: 'Ex-date and record date', body: 'The record date decides who is entitled. The ex-date is when the share starts trading without the entitlement. With T+1 settlement in India, the ex-date and record date are usually the same day.' },
      { heading: 'Why statements disagree', body: 'Your depository updates holdings when the action is credited, but an app or broker back-office may lag. If one source multiplies the price but not the quantity, your portfolio can look halved. Your average cost per share also needs to be adjusted.' },
    ],
    takeaways: ['Splits and bonuses change share count and price, not total value.', 'Always adjust average cost after a split or bonus.', 'Compare against the depository statement after any corporate action.'],
    widget: 'split-visual',
    quiz: [
      { q: 'You hold 80 shares at ₹2,480. After a 1:2 split you should have…', options: ['80 shares at ₹1,240', '160 shares at ₹1,240', '160 shares at ₹2,480', '40 shares at ₹4,960'], answer: 1, why: 'Shares double and price halves. Total value is unchanged at about ₹1.98 lakh.' },
      { q: 'After a split, your average cost per share should…', options: ['Stay the same', 'Be adjusted by the split ratio', 'Be set to zero', 'Equal the new market price'], answer: 1, why: 'Total cost is unchanged, so cost per share divides by the split factor.' },
      { q: 'A bonus issue increases…', options: ['Your total wealth immediately', 'The number of shares you hold', 'The company’s cash', 'The face value'], answer: 1, why: 'You get more shares. Price adjusts so total value is roughly unchanged.' },
    ],
    resources: ['sebiInvestor', 'nsdl', 'cdsl'],
  },
  {
    id: 'statements-reconciliation', title: 'Statements, CAS & reconciliation', tagline: 'One investor, many statements — how to make them agree.',
    category: 'Portfolio hygiene', minutes: 5, level: 'Beginner', accent: 'from-emerald-600 to-cyan-700',
    sections: [
      { heading: 'Where your holdings are recorded', body: 'Shares, ETFs, bonds and REIT/InvIT units sit in your demat account at a depository (NSDL or CDSL) through a depository participant, usually your broker. Mutual-fund units are recorded by registrars (RTAs).' },
      { heading: 'The Consolidated Account Statement (CAS)', body: 'The depositories send a CAS covering your demat accounts and mutual-fund folios linked to your PAN. It is generated periodically, typically monthly when there are transactions. It is a strong reference, but it reflects a past date.' },
      { heading: 'Why sources disagree', body: 'Common, often harmless reasons:', bullets: [
        'Timing: trades settling after the statement date (India uses T+1 settlement for equities).',
        'Duplicates: the same account imported twice into a tracker app.',
        'Corporate actions applied in one system but not another.',
        'Rounding of fractional mutual-fund units.',
      ] },
      { heading: 'A good habit', body: 'Once a month, compare your apps against the CAS. If something genuinely doesn’t match, raise it with your broker or depository participant. If it isn’t resolved, SEBI’s SCORES and SMART ODR are the official escalation routes.' },
    ],
    takeaways: ['The CAS is your reference — but check its date.', 'Explained ≠ ignored: keep evidence like contract notes.', 'Escalation routes exist: broker → SCORES / SMART ODR.'],
    widget: 'reconcile-visual',
    quiz: [
      { q: 'Your broker shows 150 shares; the month-end CAS shows 120. You bought 30 after month-end. This is most likely…', options: ['An error to report', 'A timing difference', 'A stock split', 'A duplicate'], answer: 1, why: 'The CAS predates the purchase, so it couldn’t include it.' },
      { q: 'A tracker app shows 400 shares but your demat account has 200, and both imports show the same account. Likely cause?', options: ['Bonus issue', 'Duplicate import', 'Rounding', 'Stale price'], answer: 1, why: 'The same holding was counted twice from two imports of one account.' },
      { q: 'An unresolved complaint against a SEBI-registered intermediary can be escalated via…', options: ['SCORES', 'RBI Retail Direct', 'AMFI NAV page', 'Income tax portal'], answer: 0, why: 'SCORES is SEBI’s complaints redress system. SMART ODR handles online dispute resolution.' },
    ],
    resources: ['nsdl', 'cdsl', 'scores', 'smartodr'],
  },
  {
    id: 'cost-basis', title: 'Cost basis & returns', tagline: 'Without purchase cost, “profit” is just a guess.',
    category: 'Portfolio hygiene', minutes: 4, level: 'Intermediate', accent: 'from-yellow-500 to-amber-600',
    sections: [
      { heading: 'What cost basis is', body: 'Cost basis is what you paid for an investment, including charges. You need it to calculate gains, returns and capital-gains tax.' },
      { heading: 'Why it goes missing', body: 'Shares received as a gift, by inheritance or by off-market transfer, or moved from another broker, often arrive without a purchase price. Many apps then show a cost of zero, which makes it look like a 100% gain.' },
      { heading: 'Doing it right', body: 'Collect contract notes and transfer documents. For gifted or inherited assets, tax rules in India generally look back to the previous owner’s cost and holding period. Rules change, so check the Income Tax Department’s guidance or a qualified professional.' },
    ],
    takeaways: ['Missing cost ≠ zero cost.', 'Keep contract notes and transfer documents.', 'Gifted/inherited assets have special cost rules — verify officially.'],
    quiz: [
      { q: 'An app shows 100% gain on gifted shares. The most likely reason is…', options: ['The shares doubled', 'Cost basis missing and treated as zero', 'A bonus issue', 'A dividend'], answer: 1, why: 'A missing cost treated as ₹0 makes the entire value look like profit.' },
      { q: 'Which document best proves your purchase cost?', options: ['A price chart', 'The contract note', 'A news article', 'Your CAS'], answer: 1, why: 'The contract note records the trade price and charges. A CAS often lacks cost data.' },
      { q: 'Portfolio X-Ray handles missing cost by…', options: ['Assuming zero', 'Excluding that position from gain/loss totals and flagging it', 'Guessing from today’s price', 'Ignoring the holding'], answer: 1, why: 'Excluding it avoids inventing a gain, and the flag tells you what to fix.' },
    ],
    resources: ['incomeTax', 'sebiInvestor'],
  },
];

export const topicById = Object.fromEntries(topics.map((t) => [t.id, t])) as Record<string, Topic>;
