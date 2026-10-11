/**
 * English / Hindi copy for key screens (onboarding, risk reveal, home, navigation).
 * Lessons and the assistant stay in English in this version.
 * Hindi copy is a first draft and needs review by a native speaker before real use (B15).
 */
export type Lang = 'en' | 'hi';
export interface L { en: string; hi: string }

export const S = {
  demo: { en: 'Demo mode', hi: 'डेमो मोड' },
  appName: { en: 'Investor Assistant', hi: 'निवेशक सहायक' },
  back: { en: 'Back', hi: 'पीछे' },
  next: { en: 'Next', hi: 'आगे' },
  continue: { en: 'Continue', hi: 'जारी रखें' },
  notSure: { en: 'Not sure', hi: 'पक्का नहीं' },
  whyAsk: { en: 'Why we ask', hi: 'हम क्यों पूछते हैं' },
  noRightWrong: { en: 'There are no right or wrong answers.', hi: 'कोई जवाब सही या गलत नहीं है।' },
  minLeft: { en: 'about {n} min left', hi: 'लगभग {n} मिनट बाकी' },
  forExample: { en: 'For example', hi: 'उदाहरण' },

  // A1 welcome
  welcomeTitle: { en: 'Understand your money, calmly.', hi: 'अपने पैसे को आराम से समझें।' },
  welcomeSub: { en: 'See all your investments in one place, learn your risk profile, and get simple, educational guidance.', hi: 'अपने सभी निवेश एक जगह देखें, अपना जोखिम प्रोफ़ाइल जानें, और आसान, शैक्षिक मार्गदर्शन पाएं।' },
  reassure1: { en: 'Takes about 5 minutes', hi: 'लगभग 5 मिनट लगते हैं' },
  reassure2: { en: 'No trading access — we can only read', hi: 'ट्रेडिंग की पहुँच नहीं — हम केवल पढ़ सकते हैं' },
  reassure3: { en: 'You control your data and can revoke any time', hi: 'आपका डेटा आपके नियंत्रण में है, कभी भी वापस ले सकते हैं' },
  getStarted: { en: 'Get started', hi: 'शुरू करें' },
  trySample: { en: 'Try with sample data', hi: 'सैंपल डेटा से आज़माएँ' },
  pickPersona: { en: 'Pick a sample investor', hi: 'एक सैंपल निवेशक चुनें' },
  pickPersonaSub: { en: 'Fictional people with demo accounts. Skips connecting accounts.', hi: 'काल्पनिक लोग और डेमो खाते। खाते जोड़ने का चरण छोड़ दिया जाएगा।' },
  demoNote: { en: 'Demo prototype: accounts are simulated and nothing here is investment advice.', hi: 'डेमो प्रोटोटाइप: खाते सिम्युलेटेड हैं और यहाँ कुछ भी निवेश सलाह नहीं है।' },

  // A3 connect
  connectTitle: { en: 'Connect your accounts', hi: 'अपने खाते जोड़ें' },
  whyTitle: { en: 'Why we ask to connect', hi: 'हम खाते जोड़ने को क्यों कहते हैं' },
  weRead: { en: 'What we read', hi: 'हम क्या पढ़ते हैं' },
  weRead1: { en: 'Holdings in demat accounts and mutual fund folios', hi: 'डीमैट खातों और म्यूचुअल फंड फोलियो की होल्डिंग्स' },
  weRead2: { en: 'Bank and fixed deposit balances', hi: 'बैंक और फिक्स्ड डिपॉज़िट बैलेंस' },
  weRead3: { en: 'A monthly summary of salary, SIPs and EMIs', hi: 'वेतन, SIP और EMI का मासिक सारांश' },
  weDont: { en: 'What we never get', hi: 'हमें क्या कभी नहीं मिलता' },
  weDont1: { en: 'Your passwords or PINs', hi: 'आपके पासवर्ड या पिन' },
  weDont2: { en: 'Any ability to buy, sell or move money', hi: 'खरीदने, बेचने या पैसे भेजने की कोई क्षमता' },
  revokeAny: { en: 'You can revoke access any time from Settings.', hi: 'आप सेटिंग्स से कभी भी पहुँच वापस ले सकते हैं।' },
  ratherNot: { en: 'I’d rather not connect', hi: 'मैं खाते नहीं जोड़ना चाहता/चाहती' },
  consentTitle: { en: 'Review consent', hi: 'सहमति की समीक्षा करें' },
  approve: { en: 'Approve', hi: 'स्वीकार करें' },
  decline: { en: 'Decline', hi: 'अस्वीकार करें' },
  chooseTitle: { en: 'Choose accounts to include', hi: 'शामिल करने के लिए खाते चुनें' },
  verifyTitle: { en: 'Verify and fetch', hi: 'सत्यापित करें और डेटा लाएँ' },
  checkTitle: { en: 'Checking your data', hi: 'आपके डेटा की जाँच' },
  confirmTitle: { en: 'Does this look right?', hi: 'क्या यह सही लग रहा है?' },
  looksRight: { en: 'Looks right', hi: 'सही है' },
  edit: { en: 'Edit', hi: 'बदलें' },
  weFound: { en: 'We found {a} accounts and {h} holdings worth {v}.', hi: 'हमें {a} खाते और {h} होल्डिंग्स मिलीं, जिनका मूल्य {v} है।' },

  // A5 reveal
  yourProfile: { en: 'Your risk profile', hi: 'आपका जोखिम प्रोफ़ाइल' },
  ability: { en: 'Ability to take risk', hi: 'जोखिम उठाने की क्षमता' },
  willingness: { en: 'Willingness to take risk', hi: 'जोखिम उठाने की इच्छा' },
  seeMeaning: { en: 'See what this means for me', hi: 'देखें मेरे लिए इसका क्या मतलब है' },
  retake: { en: 'Retake', hi: 'दोबारा करें' },
  Conservative: { en: 'Conservative', hi: 'सतर्क' },
  Moderate: { en: 'Moderate', hi: 'संतुलित' },
  Aggressive: { en: 'Aggressive', hi: 'आक्रामक' },
  meaningConservative: { en: 'Protecting what you have matters more than chasing growth.', hi: 'तेज़ बढ़त से ज़्यादा ज़रूरी है जो है उसे सुरक्षित रखना।' },
  meaningModerate: { en: 'A balance of growth and stability suits you.', hi: 'बढ़त और स्थिरता का संतुलन आपके लिए ठीक है।' },
  meaningAggressive: { en: 'You can aim for higher growth and ride out bigger swings.', hi: 'आप ऊँची बढ़त का लक्ष्य रख सकते हैं और बड़े उतार-चढ़ाव झेल सकते हैं।' },
  mismatchCapacity: { en: 'You’re comfortable with more risk than your situation can safely carry right now. We go with the safer of the two — that’s about protecting you, not judging you.', hi: 'आप जितना जोखिम लेने को तैयार हैं, आपकी अभी की स्थिति उतना सुरक्षित रूप से नहीं उठा सकती। हम दोनों में से सुरक्षित विकल्प चुनते हैं — यह आपकी सुरक्षा के लिए है।' },
  mismatchTolerance: { en: 'Your situation could carry more risk, but you’d rather not — and that matters. A plan you can stick with beats one you’d abandon in a fall.', hi: 'आपकी स्थिति ज़्यादा जोखिम उठा सकती है, पर आप नहीं चाहते — और यह मायने रखता है। जिस योजना पर आप टिके रह सकें, वही बेहतर है।' },

  // A6 home & tabs
  tabAssistant: { en: 'Assistant', hi: 'सहायक' },
  tabGrow: { en: 'Grow', hi: 'बढ़ाएँ' },
  tabMoney: { en: 'My money', hi: 'मेरा पैसा' },
  totalValue: { en: 'Total value', hi: 'कुल मूल्य' },
  simpleView: { en: 'Simple view', hi: 'सरल दृश्य' },
  talkItThrough: { en: 'Talk it through', hi: 'इस पर बात करें' },
  nextStep: { en: 'Your next step', hi: 'आपका अगला कदम' },
  hello: { en: 'Hello', hi: 'नमस्ते' },
  lifeChange: { en: 'Had a life change? Re-check your profile.', hi: 'जीवन में कोई बदलाव? अपना प्रोफ़ाइल दोबारा जाँचें।' },
  'verdict.fits': { en: 'Your mix fits your profile', hi: 'आपका मिश्रण आपके प्रोफ़ाइल के अनुरूप है' },
  'verdict.too-cautious': { en: 'A bit too cautious for your goals', hi: 'आपके लक्ष्यों के लिए थोड़ा ज़्यादा सतर्क' },
  'verdict.too-aggressive': { en: 'More risk than your profile can carry', hi: 'आपके प्रोफ़ाइल की क्षमता से ज़्यादा जोखिम' },
  'verdict.idle-cash': { en: 'Too much money sitting idle', hi: 'बहुत ज़्यादा पैसा बेकार पड़ा है' },
  'verdict.concentrated': { en: 'Too much riding on one holding', hi: 'एक ही होल्डिंग पर बहुत ज़्यादा निर्भरता' },
} satisfies Record<string, L>;

export type SKey = keyof typeof S;

export function tr(lang: Lang, key: SKey, vars: Record<string, string | number> = {}): string {
  let s = S[key][lang];
  for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}

export const pick = (lang: Lang, l: L) => l[lang];
