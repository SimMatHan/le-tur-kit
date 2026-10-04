// Testdata til e2e/skærmbilleder: det håndregnede løb fra src/game/scoring.test.ts
// med ryttere r1–r6 (a–f).
export const names = ['Anna', 'Bent', 'Carl', 'Dorte', 'Erik', 'Frida'];
export const riders = names.map((name, i) => ({ id: `r${i + 1}`, number: i + 1, name, nickname: '', bio: '', traits: [], photo: null }));
const id = (k) => `r${'abcdef'.indexOf(k) + 1}`;
const m = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [id(k), v]));
const st = (input, status = 'finished') => ({ status, input, adjust: {}, tieOrder: [] });

export function fullRun(status = 'finished') {
  return {
    version: 1,
    classificationTieOrder: {},
    stages: {
      1: st({ type: 'prolog', times: m({ a: 8.4, b: 10.1, c: 7.9, d: 12, e: 9.5, f: 15.2 }) }, status),
      2: st({ type: 'sprint', order: ['b', 'a', 'f', 'c', 'e', 'd'].map(id), carrotGroups: [], bonuses: { start: id('f'), third: id('d') } }, status),
      3: st(
        {
          type: 'udbrud',
          quiz: { '0-0': ['a', 'b', 'c'].map(id), '0-4': [id('a')], '2-3': ['c', 'd'].map(id), '4-2': [id('e')] },
          dice: m({ a: 0, b: 4.2, c: 12.5, d: 2, e: 7.7, f: 20 }),
        },
        status,
      ),
      4: st({ type: 'bjerg', hits: ['b', 'e'].map(id), dice: m({ b: 7, e: 11 }), times: m({ a: 9, b: 14, c: 8, d: 11.5, e: 16, f: 10 }) }, status),
      5: st(
        {
          type: 'champs',
          hits: ['a', 'c', 'd', 'f'].map(id),
          vinokourovDice: null,
          rounds: [
            { duels: [{ a: id('a'), b: id('c'), winner: id('c') }, { a: id('d'), b: id('f'), winner: id('d') }] },
            { duels: [{ a: id('c'), b: id('d'), winner: id('d') }] },
          ],
        },
        status,
      ),
    },
  };
}
