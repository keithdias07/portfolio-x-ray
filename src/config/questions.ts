/**
 * Question set (B3). Each question: id, text, type, options, example chips, why-we-ask text,
 * default for "Not sure", prefill source (a path into the canonical portfolio's bank summary)
 * and show-if condition. Branching: life stage changes the goals list.
 */
import type { L } from '../i18n';
import type { Answers } from '../engine/types';
import type { BankSummary } from '../engine/normalise';

export type QType = 'single' | 'multi' | 'amount' | 'age-deps' | 'months' | 'scenario';

export interface Option { value: string; label: L; detail?: L }

export interface Question {
  id: keyof Answers;
  group: 'intro' | 'capacity' | 'behaviour';
  type: QType;
  text: L;
  options?: Option[] | ((a: Answers) => Option[]);
  examples?: L[];
  why: L;
  notSure: unknown;
  prefill?: keyof BankSummary;
  sensitive?: boolean;
  showIf?: (a: Answers) => boolean;
}

const GOAL: Record<string, L> = {
  wealth: { en: 'Grow my wealth', hi: 'संपत्ति बढ़ाना' },
  emergency: { en: 'Build an emergency fund', hi: 'आपातकालीन फंड बनाना' },
  home: { en: 'Buy a home', hi: 'घर खरीदना' },
  travel: { en: 'Travel', hi: 'यात्रा' },
  'higher-studies': { en: 'Higher studies', hi: 'उच्च शिक्षा' },
  marriage: { en: 'Wedding', hi: 'शादी' },
  car: { en: 'Buy a car', hi: 'कार खरीदना' },
  'child-education': { en: 'Child’s education', hi: 'बच्चों की पढ़ाई' },
  retirement: { en: 'Retirement', hi: 'सेवानिवृत्ति' },
  'loan-prepay': { en: 'Pay off a loan early', hi: 'लोन जल्दी चुकाना' },
  'retirement-income': { en: 'Retirement income', hi: 'सेवानिवृत्ति आय' },
  health: { en: 'Health costs', hi: 'स्वास्थ्य खर्च' },
  legacy: { en: 'Leave something for family', hi: 'परिवार के लिए कुछ छोड़ना' },
};

const GOALS_BY_STAGE: Record<string, string[]> = {
  starting: ['wealth', 'emergency', 'home', 'travel', 'higher-studies'],
  building: ['home', 'wealth', 'emergency', 'marriage', 'car'],
  family: ['child-education', 'home', 'retirement', 'emergency', 'wealth'],
  peak: ['retirement', 'child-education', 'wealth', 'loan-prepay'],
  'pre-retirement': ['retirement-income', 'health', 'legacy', 'loan-prepay'],
  retired: ['retirement-income', 'health', 'legacy'],
  'not-sure': ['wealth', 'emergency', 'home', 'retirement'],
};

export const QUESTIONS: Question[] = [
  {
    id: 'lifeStage', group: 'intro', type: 'single',
    text: { en: 'Which stage of life are you in?', hi: 'आप जीवन के किस पड़ाव पर हैं?' },
    why: { en: 'Your stage shapes how long your money can stay invested and how big a safety buffer you need.', hi: 'आपका पड़ाव तय करता है कि पैसा कितने समय निवेशित रह सकता है और कितना सुरक्षा बफ़र चाहिए।' },
    notSure: 'not-sure',
    options: [
      { value: 'starting', label: { en: 'Just starting out', hi: 'अभी शुरुआत' }, detail: { en: 'First job, few commitments', hi: 'पहली नौकरी, कम ज़िम्मेदारियाँ' } },
      { value: 'building', label: { en: 'Building up', hi: 'आगे बढ़ रहे हैं' }, detail: { en: 'Career growing, planning big goals', hi: 'करियर बढ़ रहा है, बड़े लक्ष्य' } },
      { value: 'family', label: { en: 'Family stage', hi: 'परिवार का पड़ाव' }, detail: { en: 'Children or dependents, maybe a home loan', hi: 'बच्चे या आश्रित, शायद होम लोन' } },
      { value: 'peak', label: { en: 'Peak earning', hi: 'सबसे ज़्यादा कमाई' }, detail: { en: 'Highest income years', hi: 'सबसे अधिक आय के वर्ष' } },
      { value: 'pre-retirement', label: { en: 'Pre-retirement', hi: 'सेवानिवृत्ति से पहले' }, detail: { en: 'Retiring within ~5 years', hi: 'लगभग 5 साल में सेवानिवृत्ति' } },
      { value: 'retired', label: { en: 'Retired or near retirement', hi: 'सेवानिवृत्त या करीब' }, detail: { en: 'Living off savings or pension', hi: 'बचत या पेंशन पर' } },
    ],
  },
  {
    id: 'age', group: 'intro', type: 'age-deps', sensitive: true,
    text: { en: 'How old are you, and how many people depend on your income?', hi: 'आपकी उम्र क्या है, और कितने लोग आपकी आय पर निर्भर हैं?' },
    examples: [{ en: 'e.g. 34 years, 2 dependents (spouse and child)', hi: 'जैसे 34 वर्ष, 2 आश्रित (जीवनसाथी और बच्चा)' }],
    why: { en: 'Age sets your time horizon; dependents affect how much risk your family can absorb.', hi: 'उम्र से समय-सीमा तय होती है; आश्रितों से पता चलता है कि परिवार कितना जोखिम झेल सकता है।' },
    notSure: 35,
  },
  {
    id: 'goals', group: 'intro', type: 'multi',
    text: { en: 'What are your main goals?', hi: 'आपके मुख्य लक्ष्य क्या हैं?' },
    why: { en: 'Goals tell us what the money is for, so guidance can match.', hi: 'लक्ष्यों से पता चलता है कि पैसा किसलिए है, ताकि मार्गदर्शन मेल खाए।' },
    notSure: [],
    options: (a) => (GOALS_BY_STAGE[a.lifeStage ?? 'not-sure'] ?? GOALS_BY_STAGE['not-sure']).map((g) => ({ value: g, label: GOAL[g] })),
  },
  {
    id: 'incomeType', group: 'intro', type: 'single',
    text: { en: 'How do you earn?', hi: 'आपकी कमाई कैसे होती है?' },
    why: { en: 'Variable income needs a bigger emergency buffer.', hi: 'अनियमित आय के लिए बड़ा आपातकालीन बफ़र चाहिए।' },
    notSure: 'not-sure',
    options: [
      { value: 'salaried', label: { en: 'Salaried', hi: 'वेतनभोगी' }, detail: { en: 'Fixed monthly pay', hi: 'तय मासिक वेतन' } },
      { value: 'variable', label: { en: 'Variable', hi: 'अनियमित' }, detail: { en: 'Business, freelance or commission', hi: 'व्यवसाय, फ्रीलांस या कमीशन' } },
    ],
  },
  {
    id: 'grossAnnual', group: 'intro', type: 'amount', sensitive: true,
    text: { en: 'Roughly, what is your yearly income before tax?', hi: 'टैक्स से पहले आपकी सालाना आय लगभग कितनी है?' },
    examples: [{ en: 'e.g. ₹12,00,000 (12 lakh) a year', hi: 'जैसे ₹12,00,000 (12 लाख) सालाना' }],
    why: { en: 'Only used to estimate tax on your interest and gains — never shared.', hi: 'केवल आपके ब्याज और लाभ पर टैक्स का अनुमान लगाने के लिए — कभी साझा नहीं।' },
    notSure: undefined,
  },
  {
    id: 'monthlyIncome', group: 'capacity', type: 'amount', prefill: 'salaryCredit', sensitive: true,
    text: { en: 'Monthly take-home income', hi: 'मासिक हाथ में आने वाली आय' },
    examples: [{ en: 'e.g. ₹85,000 credited each month', hi: 'जैसे हर महीने ₹85,000 जमा' }],
    why: { en: 'Together with expenses and EMIs, this shows how much you can set aside.', hi: 'खर्च और EMI के साथ, इससे पता चलता है कि आप कितना बचा सकते हैं।' },
    notSure: undefined,
  },
  {
    id: 'monthlyExpenses', group: 'capacity', type: 'amount', prefill: 'spend',
    text: { en: 'Monthly household expenses (excluding EMIs)', hi: 'मासिक घरेलू खर्च (EMI छोड़कर)' },
    examples: [{ en: 'e.g. ₹30,000 a month for rent and groceries', hi: 'जैसे किराया और राशन के लिए ₹30,000 महीना' }],
    why: { en: 'Sets the size of your emergency buffer.', hi: 'इससे आपातकालीन बफ़र का आकार तय होता है।' },
    notSure: undefined,
  },
  {
    id: 'monthlyEmi', group: 'capacity', type: 'amount', prefill: 'emiDebits',
    text: { en: 'Monthly EMIs (all loans)', hi: 'मासिक EMI (सभी लोन)' },
    examples: [{ en: 'e.g. ₹18,000 car loan + ₹25,000 home loan', hi: 'जैसे ₹18,000 कार लोन + ₹25,000 होम लोन' }],
    why: { en: 'High EMIs reduce how much risk you can safely carry.', hi: 'ज़्यादा EMI से आप कम जोखिम सुरक्षित रूप से उठा सकते हैं।' },
    notSure: 0,
  },
  {
    id: 'emergencyMonths', group: 'capacity', type: 'months',
    text: { en: 'How many months of expenses do you want to keep for emergencies and medical needs?', hi: 'आपात स्थिति और इलाज के लिए कितने महीनों का खर्च रखना चाहते हैं?' },
    why: { en: 'This money stays safe and easy to reach, so it isn’t counted as investable.', hi: 'यह पैसा सुरक्षित और आसानी से उपलब्ध रहता है, इसलिए इसे निवेश योग्य नहीं माना जाता।' },
    notSure: 6,
  },
  {
    id: 'insurance', group: 'capacity', type: 'multi',
    text: { en: 'Which insurance do you already have?', hi: 'आपके पास पहले से कौन-सा बीमा है?' },
    why: { en: 'Insurance protects your investments from being used up in an emergency.', hi: 'बीमा आपात स्थिति में आपके निवेश को खर्च होने से बचाता है।' },
    notSure: [],
    options: [
      { value: 'health', label: { en: 'Health insurance', hi: 'स्वास्थ्य बीमा' } },
      { value: 'term', label: { en: 'Term life insurance', hi: 'टर्म जीवन बीमा' } },
      { value: 'none', label: { en: 'None yet', hi: 'अभी कोई नहीं' } },
    ],
  },
  {
    id: 'fall20', group: 'behaviour', type: 'scenario', sensitive: true,
    text: { en: 'Your investments fall 20% in a month. You would…', hi: 'आपके निवेश एक महीने में 20% गिर जाते हैं। आप…' },
    why: { en: 'How you’d react in a fall matters as much as what you can afford.', hi: 'गिरावट में आपकी प्रतिक्रिया उतनी ही मायने रखती है जितनी आपकी क्षमता।' },
    notSure: 'not-sure',
    options: [
      { value: 'sell-all', label: { en: 'Sell everything', hi: 'सब बेच दूँगा/दूँगी' } },
      { value: 'sell-some', label: { en: 'Sell some', hi: 'कुछ बेच दूँगा/दूँगी' } },
      { value: 'hold', label: { en: 'Do nothing', hi: 'कुछ नहीं करूँगा/करूँगी' } },
      { value: 'buy-more', label: { en: 'Buy more', hi: 'और खरीदूँगा/खरीदूँगी' } },
    ],
  },
  {
    id: 'pickPortfolio', group: 'behaviour', type: 'scenario',
    text: { en: 'Which ₹1 lakh investment would you pick for 5 years?', hi: '5 साल के लिए ₹1 लाख का कौन-सा निवेश चुनेंगे?' },
    why: { en: 'Higher possible gains come with deeper possible falls.', hi: 'ज़्यादा संभावित लाभ के साथ ज़्यादा संभावित गिरावट भी आती है।' },
    notSure: 'not-sure',
    options: [
      { value: 'A', label: { en: 'Steady', hi: 'स्थिर' }, detail: { en: 'Best year +8% · worst year −2%', hi: 'सबसे अच्छा साल +8% · सबसे बुरा −2%' } },
      { value: 'B', label: { en: 'Balanced', hi: 'संतुलित' }, detail: { en: 'Best year +15% · worst year −10%', hi: 'सबसे अच्छा साल +15% · सबसे बुरा −10%' } },
      { value: 'C', label: { en: 'Growth', hi: 'वृद्धि' }, detail: { en: 'Best year +25% · worst year −22%', hi: 'सबसे अच्छा साल +25% · सबसे बुरा −22%' } },
    ],
  },
  {
    id: 'pastBehaviour', group: 'behaviour', type: 'single',
    text: { en: 'The last time markets fell sharply, what did you do?', hi: 'पिछली बार जब बाज़ार तेज़ी से गिरा, आपने क्या किया?' },
    why: { en: 'Past behaviour is a good guide to future behaviour.', hi: 'पिछला व्यवहार भविष्य के व्यवहार का अच्छा संकेत है।' },
    notSure: 'not-sure',
    options: [
      { value: 'sold', label: { en: 'Sold', hi: 'बेच दिया' } },
      { value: 'held', label: { en: 'Held on', hi: 'टिके रहे' } },
      { value: 'bought-more', label: { en: 'Bought more', hi: 'और खरीदा' } },
      { value: 'not-invested', label: { en: 'Wasn’t invested then', hi: 'तब निवेश नहीं था' } },
    ],
  },
];

export const INTRO = QUESTIONS.filter((q) => q.group === 'intro');
export const LATER = QUESTIONS.filter((q) => q.group !== 'intro');
export const optionsFor = (q: Question, a: Answers): Option[] => (typeof q.options === 'function' ? q.options(a) : q.options ?? []);
