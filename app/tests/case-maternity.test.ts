import { describe, it, expect } from 'vitest';
import { priceMaternityPeriod } from '@/lib/rules/case-maternity';
import { birthLeaveWindow, type ScenarioInput } from '@/lib/rules/maternity';

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
    expect(birthLeaveWindow('2026-06-01', 1, 4, ['2026-06-01'])).toEqual({ from: '2026-05-28', to: '2026-07-26', days: 60 });
    expect(birthLeaveWindow('2026-06-01', 1, 0, ['2026-07-26']).to).toBe('2026-08-01');
    expect(birthLeaveWindow('2026-06-01', 1, 0, ['2026-07-27']).to).toBe('2026-08-02');
    expect(birthLeaveWindow('2026-06-01', 2, 0, ['2026-06-01']).to).toBe('2026-10-18');
    expect(birthLeaveWindow('2026-06-01', 2, 0, ['2026-06-01', '2026-07-26']).to).toBe('2026-08-01');
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
