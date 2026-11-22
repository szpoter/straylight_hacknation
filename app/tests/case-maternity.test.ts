import { describe, it, expect } from 'vitest';
import { priceMaternityPeriod } from '@/lib/rules/case-maternity';
import { birthLeaveWindow, computeScenario, type ScenarioInput } from '@/lib/rules/maternity';

const input: ScenarioInput = {
  date: '2026-06-25', event: 'birth', children: 1, zaZyciem: false, variant: '100-70',
  parentA: { title: 'pracownik', fullTime: true, basis: { kind: 'months', months: Array.from({length: 12}, () => ({ amount: (600000 - 82260) / 100, deductionPct: 0 })) } },
  parentB: null, weeksBeforeBirth: 0, transferWeeks: 0, supplementaryWeeks: 0, supplementaryParent: 'A',
  parentalWeeksA: 0, parentalWeeksB: 0, parentalOrder: 'sequential', workA: 0, workB: 0, paternityDays: 0,
};
const period = { parent: 'A', kind: 'macierzynski', from: '2026-06-25', to: '2026-07-08' } as const;

describe('calculation for the requested claimant and days', () => {
  it('covers only the 14 requested days across June and July', () => {
    expect(priceMaternityPeriod(input, period)).toMatchObject({ status: 'calculated', grossAmountGrosze: 241612, segments: [
      { days: 6, basisGrosze: 517740, dailyGrosze: 17258, grossAmountGrosze: 103548 },
      { days: 8, basisGrosze: 517740, dailyGrosze: 17258, grossAmountGrosze: 138064 },
    ] });
  });
  it('requires every requested day, the right parent and leave kind', () => {
    for (const change of [{ from: '2026-06-24' }, { parent: 'B' as const }, { kind: 'ojcowski' as const }, { to: '2026-06-31' }]) {
      expect(priceMaternityPeriod(input, { ...period, ...change }).status).toBe('needs_review');
    }
  });
});

it('applies a publication during a month to the same days in the form engine and the evidence adapter', () => {
  const changed: ScenarioInput = { ...input, schedule: { 'rate.maternity': [{ validFrom: '2026-06-28', value: 750 }] } };
  const seven = { ...period, to: '2026-07-01' };
  expect(priceMaternityPeriod(changed, seven)).toMatchObject({ status: 'calculated', grossAmountGrosze: 103550,
    segments: [{ from: '2026-06-25', days: 3, dailyGrosze: 17258 }, { from: '2026-06-28', days: 3, dailyGrosze: 12944 }, { from: '2026-07-01', days: 1, dailyGrosze: 12944 }] });
  expect(priceMaternityPeriod(input, seven)).toMatchObject({ grossAmountGrosze: 120806 });
});

describe('birth leave after an exact event (KP art. 180 and 180¹)', () => {
  it('retains at least seven days after an early or later death and carries prenatal days separately', () => {
    expect(birthLeaveWindow('2026-03-01', 1, 0, ['2026-07-16']).to).toBe('2026-07-23');
    expect(birthLeaveWindow('2026-06-01', 1, 4, ['2026-06-01'])).toEqual({ from: '2026-05-28', to: '2026-07-26', days: 60 });
    expect(birthLeaveWindow('2026-06-01', 1, 0, ['2026-07-26']).to).toBe('2026-08-02');
    expect(birthLeaveWindow('2026-06-01', 1, 0, ['2026-07-27']).to).toBe('2026-08-03');
    expect(birthLeaveWindow('2026-06-01', 2, 0, ['2026-06-01']).to).toBe('2026-10-18');
    expect(birthLeaveWindow('2026-06-01', 2, 0, ['2026-06-01', '2026-07-26']).to).toBe('2026-08-02');
  });
});

it('extends the calendar from actual hospital stays and shifts the start of parental leave', () => {
  const hospitalCertificate = { birth: input.date, gestationDays: 35 * 7, children: [{ birthWeightGrams: 2500, stays: [{ from: '2026-06-26', to: '2026-07-16' }] }] };
  const scenario = { ...input, parentalWeeksA: 1, hospitalCertificate };
  const period = { parent: 'A', kind: 'uzupelniajacy', from: '2026-11-12', to: '2026-12-02' } as const;
  expect(priceMaternityPeriod(scenario, period)).toMatchObject({ status: 'calculated', grossAmountGrosze: 362418 });
  expect(priceMaternityPeriod(scenario, { ...period, kind: 'rodzicielski', from: '2026-12-03', to: '2026-12-09' })).toMatchObject({ status: 'calculated' });
  expect(priceMaternityPeriod({ ...scenario, hospitalCertificate: { ...hospitalCertificate, children: [] } }, period)).toMatchObject({ status: 'needs_review' });
});

it('checks the birthday itself and professional foster care separately from ordinary adoption', () => {
  const period = { parent: 'A', kind: 'na-warunkach', from: input.date, to: input.date } as const;
  expect(priceMaternityPeriod({ ...input, event: 'adoption', childBirthDate: '2012-06-25' }, period).status).toBe('needs_review');
  expect(priceMaternityPeriod({ ...input, event: 'foster', childBirthDate: '2024-01-01', professionalFoster: true }, period).status).toBe('needs_review');
  expect(priceMaternityPeriod({ ...input, event: 'adoption', children: 2, placement: {children:[{birthDate:'2024-01-01'},{birthDate:'2020-01-01'}],courtFiledOn:input.date} }, period).status).toBe('calculated');
});

it('prices work at the employer granting leave, changed fractions and a separately specified extension', () => {
  const start = '2026-11-12';
  const period = { parent: 'A', kind: 'rodzicielski', from: start, to: '2026-11-30' } as const;
  const work = { leaveEmployer: 'P', intervals: [
    { from: start, to: '2026-11-18', fraction: 0.25, employer: 'P' },
    { from: '2026-11-19', to: '2026-11-25', fraction: 0.5, employer: 'P' },
  ], extension: { fraction: 0, employer: 'P' } };
  const scenario = { ...input, parentalWeeksA: 2, parentalWork: { A: work } };
  expect(priceMaternityPeriod(scenario, period)).toMatchObject({ status: 'calculated', segments: [
    { days: 7, dailyGrosze: 9060 }, { days: 7, dailyGrosze: 6040 }, { days: 5, dailyGrosze: 12081 },
  ] });
  const external = { ...work, intervals: [{ from: start, to: '2026-11-25', employer: 'Q', fraction: 0.75 }] };
  expect(priceMaternityPeriod({ ...scenario, parentalWork: { A: external } }, { ...period, to: '2026-11-25' })).toMatchObject({ status: 'calculated', segments: [{ days: 14, dailyGrosze: 12081 }] });
  expect(priceMaternityPeriod({ ...scenario, parentalWork: { A: { ...external, leaveEmployer: 'Q' } } }, period).status).toBe('needs_review');
});

it('prices a partial overlap for two parents using the second person’s own basis', () => {
  const scenario = { ...input, parentB: { ...input.parentA, basis: { kind: 'known' as const, amount: 6000 } }, parentalWeeksA: 2, parentalWeeksB: 2, parentalStarts: { B: '2026-11-19' } };
  const period = { parent: 'B', kind: 'rodzicielski', from: '2026-11-19', to: '2026-12-02' } as const;
  expect(computeScenario(scenario).parentalDays).toEqual({personDays:28,calendarDays:21});
  expect(priceMaternityPeriod(scenario, period)).toMatchObject({ status: 'calculated', grossAmountGrosze: 196000, segments: [{ days: 12, dailyGrosze: 14000 }, { days: 2, dailyGrosze: 14000 }] });
});

it('preserves an earlier parental period when a later loss is documented and reviews periods crossing it', () => {
  const scenario = { ...input, childDeathDates: ['2026-12-01'], parentalWeeksA: 1 };
  const period = { parent: 'A', kind: 'rodzicielski', from: '2026-11-12', to: '2026-11-18' } as const;
  expect(priceMaternityPeriod(scenario, period)).toMatchObject({status:'calculated',grossAmountGrosze:84567});
  expect(priceMaternityPeriod({...scenario,childDeathDates:['2026-11-14']}, period).status).toBe('needs_review');
  expect(priceMaternityPeriod({...input,childDeathDates:['2026-06-00']}, period).status).toBe('needs_review');
});

it('applies historical deductions to the actual twelve months before a prenatal start', () => {
  const scenario: ScenarioInput = { ...input, date:'2026-06-02', prenatalLeaveDays:2,
    parentA:{title:'zleceniobiorca',fullTime:false,basis:{kind:'months',months:Array.from({length:12},()=>({amount:6000}))}},
    schedule:{'contributions.employeePct':[{validFrom:'2026-05-01',value:0}]} };
  const period = {parent:'A',kind:'macierzynski',from:'2026-05-31',to:'2026-06-02'} as const;
  expect(priceMaternityPeriod(scenario,period)).toMatchObject({status:'calculated',grossAmountGrosze:51774});
});

it('uses the payer filing deadline for insured nonemployees separately from the employer leave deadline', () => {
  const parent = {...input.parentA,title:'zleceniobiorca' as const,fullTime:false};
  const scenario = {...input,parentA:parent,parentB:parent,supplementaryWeeks:1,parentalWeeksA:1,paternityDays:7,paternityStart:'2026-07-05'};
  expect(computeScenario(scenario).deadlines.map(d=>[d.who,d.date,d.source])).toEqual([
    ['B','2026-07-04','zusDocuments'],['A','2026-11-10','zusDocuments'],['A','2026-11-18','zusDocuments'],
  ]);
});

it('counts the five family requests once per parent, including simultaneous prior parts', () => {
  const prior = [
    {parent:'A' as const,from:'2026-11-12',to:'2026-11-18',daysUsed:7},
    {parent:'B' as const,from:'2026-11-12',to:'2026-11-18',daysUsed:7},
    {parent:'A' as const,from:'2026-12-01',to:'2026-12-07',daysUsed:7},
    {parent:'B' as const,from:'2027-01-01',to:'2027-01-07',daysUsed:7},
  ];
  const scenario: ScenarioInput = {...input,parentB:input.parentA,priorParentalParts:[...prior,prior[0]],parentalStarts:{A:'2027-02-01',B:'2027-02-01'},parentalWeeksA:1};
  const period = {parent:'A',kind:'rodzicielski',from:'2027-02-01',to:'2027-02-07'} as const;
  expect(priceMaternityPeriod(scenario,period)).toMatchObject({status:'calculated',grossAmountGrosze:84567});
  expect(priceMaternityPeriod({...scenario,parentalWeeksB:1},period).status).toBe('needs_review');
  expect(priceMaternityPeriod({...scenario,priorParentalParts:[...prior,{...prior[0],daysUsed:3}]},period).status).toBe('needs_review');
});

it('adjudicates simultaneous placements by each birthday and preserves days already used', () => {
  const scenario: ScenarioInput = {...input, date:'2026-10-31',event:'adoption',children:2,
    placement:{children:[{birthDate:'2020-04-19'},{birthDate:'2013-05-10'}],courtFiledOn:'2026-10-31'}};
  expect(computeScenario(scenario).periods[0]).toMatchObject({from:'2026-10-31',to:'2027-05-09',days:191});
  const late: ScenarioInput = {...input,date:'2026-02-13',event:'foster',placement:{children:[{birthDate:'2019-05-16'}]}};
  expect(computeScenario(late).periods[0]).toMatchObject({from:'2026-02-13',to:'2026-05-15',days:92});
  const short: ScenarioInput = {...input,event:'adoption',placement:{children:[{birthDate:'2012-07-10'}],courtFiledOn:'2026-06-30'}};
  const result=computeScenario(short);
  expect(result.periods[0]).toMatchObject({from:'2026-06-30',days:63});
  expect(result.limits.parentalPoolWeeks).toBe(38);
  expect(result.deadlines).toContainEqual(expect.objectContaining({who:'A',date:'2026-07-07'}));
  expect(computeScenario({...short,placement:{children:[{birthDate:'2012-07-10'}]}}).ok).toBe(false);
});

it('transfers only the evidenced hospital interval after eight weeks and resumes the first parent’s leave', () => {
  const takeover = {reason:'hospitalization' as const, from:'2026-08-20',to:'2026-08-26',motherLastPaidOn:'2026-08-19',
    hospitalFrom:'2026-08-20',hospitalTo:'2026-08-26',recipientStoppedWorkForCare:true};
  const scenario = {...input,parentB:{...input.parentA,basis:{kind:'known' as const,amount:6000}},maternityTakeover:takeover};
  const period = {parent:'B',kind:'macierzynski',from:takeover.from,to:takeover.to} as const;
  expect(priceMaternityPeriod(scenario,period)).toMatchObject({status:'calculated',grossAmountGrosze:140000});
  expect(computeScenario(scenario).periods.map(p=>[p.parent,p.days])).toEqual([['A',56],['B',7],['A',77]]);
  expect(priceMaternityPeriod({...scenario,maternityTakeover:{...takeover,hospitalTo:'2026-08-25'}},period).status).toBe('needs_review');
  expect(priceMaternityPeriod({...scenario,maternityTakeover:{...takeover,reason:'resignation'}},period).status).toBe('needs_review');
});
