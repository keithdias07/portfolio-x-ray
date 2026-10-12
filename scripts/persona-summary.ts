// Prints what each sample persona produces end to end (B15 persona check). Run: npm run personas
import { PERSONAS } from '../src/engine/aa';
import { normalise } from '../src/engine/normalise';
import { analyse } from '../src/engine/pipeline';
for (const p of PERSONAS) {
  const port = normalise(p.accounts, p.documents);
  const a = analyse(p.answers as any, port);
  console.log('\n== ' + p.id + ': total ' + Math.round(port.totalValue) + ' naive ' + Math.round(port.naiveTotal) + ', holdings ' + port.holdings.length + ', findings ' + port.xray.findings.length + ', prompts ' + port.prompts.length);
  console.log('risk', a.risk.label, 'cap', a.risk.capacityScore, 'tol', a.risk.toleranceScore, 'limiting', a.risk.limiting, '|', a.risk.transparency);
  console.log('current', JSON.stringify(Object.fromEntries(Object.entries(a.suit.current).map(([k,v]) => [k, +v.toFixed(1)]))), 'target', JSON.stringify(a.suit.target));
  console.log('verdicts', a.suit.verdicts.map(v => v.kind + '/' + v.severity).join(', '));
  console.log('advice:', a.advice.headline, '|', a.advice.verdictLine);
  console.log('doNothing:', a.advice.doNothing);
  console.log('tax: marginal', (a.tax.marginalRate*100).toFixed(1), 'interest', Math.round(a.tax.annualInterest), 'interestTax', Math.round(a.tax.annualInterestTax), 'sellAll', Math.round(a.tax.sellAllTax), JSON.stringify(a.tax.notes));
}
