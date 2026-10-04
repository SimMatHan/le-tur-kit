import { describe, expect, it } from 'vitest';
import { computeStage, computeStandings, pointsForPlace, quizTotals, rankBy } from './scoring';
import { baseContent, contentWith, game, riders, stageOf, stageState } from './testUtils';
import type { StageResult } from './types';

const rules = baseContent.rules;
const six = ['a', 'b', 'c', 'd', 'e', 'f'];
const R6 = riders(six);

/** Kort opslag: rytter → række i et etaperesultat. */
const by = (res: StageResult) => Object.fromEntries(res.rows.map((r) => [r.riderId, r]));

describe('rankBy og pointskala', () => {
  it('giver delt placering ved lighed (1, 1, 3)', () => {
    const r = rankBy([{ id: 'a', key: 10 }, { id: 'b', key: 10 }, { id: 'c', key: 12 }], 'asc');
    expect(r.get('a')).toEqual({ place: 1, tiedWith: ['b'] });
    expect(r.get('b')?.place).toBe(1);
    expect(r.get('c')?.place).toBe(3);
  });

  it('bruger kommissærens afgørelse (tieOrder) ved lighed', () => {
    const r = rankBy([{ id: 'a', key: 10 }, { id: 'b', key: 10 }, { id: 'c', key: 12 }], 'asc', ['b']);
    expect(r.get('b')?.place).toBe(1);
    expect(r.get('a')?.place).toBe(2);
    expect(r.get('a')?.tiedWith).toEqual([]);
  });

  it('kan sortere faldende', () => {
    const r = rankBy([{ id: 'a', key: 5 }, { id: 'b', key: 9 }], 'desc');
    expect(r.get('b')?.place).toBe(1);
  });

  it('point læses fra content.json, 6.+ plads giver pointsBeyondScale', () => {
    expect([1, 2, 3, 4, 5].map((p) => pointsForPlace(p, rules))).toEqual(rules.placementPoints);
    expect(pointsForPlace(6, rules)).toBe(0);
    expect(pointsForPlace(null, rules)).toBe(0);
    expect(pointsForPlace(6, { ...rules, pointsBeyondScale: 1 })).toBe(1);
    expect(pointsForPlace(1, { ...rules, placementPoints: [50, 30] })).toBe(50);
  });
});

describe('Etape 1 – Prolog', () => {
  const st = stageOf(1);

  it('tiden går til gul, placeringen giver 25/20/15/10/5 til grøn', () => {
    const res = computeStage(st, stageState(1, { times: { a: 8.4, b: 10.1, c: 7.9, d: 12, e: 9.5, f: 15.2 } }), R6, rules);
    const r = by(res);
    expect(res.complete).toBe(true);
    expect([r.c.place, r.a.place, r.e.place, r.b.place, r.d.place, r.f.place]).toEqual([1, 2, 3, 4, 5, 6]);
    expect([r.c.gron, r.a.gron, r.e.gron, r.b.gron, r.d.gron, r.f.gron]).toEqual([25, 20, 15, 10, 5, 0]);
    expect(r.a.timeSec).toBe(8.4);
    expect(r.c.prik).toBe(0);
  });

  it('regner med tiendedele og deler placering ved præcis samme tid', () => {
    const res = computeStage(st, stageState(1, { times: { a: 8.04, b: 8.0, c: 9 } }), riders(['a', 'b', 'c']), rules);
    const r = by(res);
    expect(r.a.timeSec).toBe(8);
    expect(r.a.place).toBe(1);
    expect(r.b.place).toBe(1);
    expect(r.a.gron).toBe(25);
    expect(r.b.gron).toBe(25);
    expect(r.c.place).toBe(3);
    expect(res.ties).toEqual([['a', 'b']]);
  });

  it('lighed kan afgøres af kommissæren', () => {
    const res = computeStage(st, stageState(1, { times: { a: 8, b: 8, c: 9 } }, { tieOrder: ['b', 'a'] }), riders(['a', 'b', 'c']), rules);
    const r = by(res);
    expect([r.b.place, r.a.place]).toEqual([1, 2]);
    expect([r.b.gron, r.a.gron]).toEqual([25, 20]);
    expect(res.ties).toEqual([]);
  });

  it('manglende tid markerer etapen som ufuldstændig', () => {
    const res = computeStage(st, stageState(1, { times: { a: 8, b: null } }), riders(['a', 'b', 'c']), rules);
    expect(res.complete).toBe(false);
    expect(by(res).b).toMatchObject({ missing: true, place: null, gron: 0, timeSec: 0 });
  });
});

describe('Etape 2 – Sprint', () => {
  const st = stageOf(2);

  it('placering giver point og tidstillæg; 6.+ plads gentager sidste tillæg', () => {
    const res = computeStage(st, stageState(2, { order: ['b', 'a', 'f', 'c', 'e', 'd'] }), R6, rules);
    const r = by(res);
    expect(six.map((id) => r[id].timeSec)).toEqual([3, 0, 7, 10, 10, 5]);
    expect(six.map((id) => r[id].gron)).toEqual([20, 25, 10, 0, 5, 15]);
    expect(res.complete).toBe(true);
  });

  it('bonusknapper giver +10 grøn og +10 bjerg', () => {
    const res = computeStage(st, stageState(2, { order: six, bonuses: { start: 'f', third: 'd' } }), R6, rules);
    const r = by(res);
    expect(r.f.gron).toBe(0 + 10);
    expect(r.d.prik).toBe(10);
    expect(r.d.gron).toBe(10);
  });

  it('tidstillæg uden for skalaen kan være 0 via konfiguration', () => {
    const sc = st.scoring.type === 'sprint' ? { ...st.scoring, timePenaltyBeyondScale: 'zero' as const } : st.scoring;
    const res = computeStage({ ...st, scoring: sc }, stageState(2, { order: six }), R6, rules);
    expect(by(res).f.timeSec).toBe(0);
  });

  it('ryttere uden for rækkefølgen mangler; ukendte og dobbelte id’er ignoreres', () => {
    const res = computeStage(st, stageState(2, { order: ['a', 'x', 'a', 'b'] }), riders(['a', 'b', 'c']), rules);
    const r = by(res);
    expect([r.a.place, r.b.place, r.c.place]).toEqual([1, 2, null]);
    expect(res.complete).toBe(false);
  });

  it('Carrot in the Box-afgørelse vises som note', () => {
    const res = computeStage(st, stageState(2, { order: ['a', 'b', 'c'], carrotGroups: [['a', 'b']] }), riders(['a', 'b', 'c']), rules);
    expect(by(res).a.notes).toContain('Afgjort med Carrot in the Box');
  });
});

describe('Etape 3 – Udbrud / musikquiz', () => {
  const st = stageOf(3);

  it('feltværdier efter række, −3 sek pr. rigtigt svar', () => {
    const q = quizTotals({ type: 'udbrud', quiz: { '0-0': ['a', 'b'], '0-4': ['a'], '3-2': ['a'] }, dice: {} }, st);
    expect(q.get('a')).toEqual({ correct: 3, prik: 1 + 2 + 1, gron: 1 + 2 + 2, t10: -90 });
    expect(q.get('b')).toEqual({ correct: 1, prik: 1, gron: 1, t10: -30 });
  });

  it('alle 25 felter rigtige giver præcis 35 bjergpoint og 40 point', () => {
    const quiz: Record<string, string[]> = {};
    for (let c = 0; c < 5; c++) for (let r = 0; r < 5; r++) quiz[`${c}-${r}`] = ['a'];
    const q = quizTotals({ type: 'udbrud', quiz, dice: {} }, st).get('a')!;
    expect(q.prik).toBe(35);
    expect(q.gron).toBe(40);
    expect(q.t10).toBe(-750);
  });

  it('etapetid = terningtid − quizsekunder; laveste tid vinder etapen', () => {
    const res = computeStage(
      st,
      stageState(3, { quiz: { '0-0': ['b', 'b'], '4-4': ['b'] }, dice: { a: 0, b: 4.2, c: 12.5 } }),
      riders(['a', 'b', 'c']),
      rules,
    );
    const r = by(res);
    expect(r.b.timeSec).toBe(-1.8);
    expect(r.b.place).toBe(1);
    expect(r.b.gron).toBe(25 + 1 + 2);
    expect(r.b.prik).toBe(1 + 2);
    expect(r.a.place).toBe(2);
    expect(r.a.timeSec).toBe(0);
    expect(r.c.gron).toBe(15);
  });

  it('quizpoint tælles også for en rytter uden terningtid, men etapen er ufuldstændig', () => {
    const res = computeStage(st, stageState(3, { quiz: { '1-1': ['c'] }, dice: { a: 0, b: 1 } }), riders(['a', 'b', 'c']), rules);
    expect(by(res).c).toMatchObject({ missing: true, gron: 1, prik: 1, place: null });
    expect(res.complete).toBe(false);
  });
});

describe('Etape 4 – Bjerg', () => {
  const st = stageOf(4);

  it('udbrydernes terningsum trækkes fra bajer-tiden; point går til prikket', () => {
    const res = computeStage(
      st,
      stageState(4, { hits: ['b', 'e'], dice: { b: 7, e: 11 }, times: { a: 9, b: 14, c: 8, d: 11.5, e: 16, f: 10 } }),
      R6,
      rules,
    );
    const r = by(res);
    expect(six.map((id) => r[id].timeSec)).toEqual([9, 7, 8, 11.5, 5, 10]);
    expect(six.map((id) => r[id].prik)).toEqual([10, 20, 15, 0, 25, 5]);
    expect(six.map((id) => r[id].gron)).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it('udbryder uden terningsum gør etapen ufuldstændig', () => {
    const res = computeStage(st, stageState(4, { hits: ['a'], dice: {}, times: { a: 9, b: 10, c: 11 } }), riders(['a', 'b', 'c']), rules);
    expect(res.complete).toBe(false);
    expect(by(res).a.missing).toBe(true);
  });
});

describe('Etape 5 – Champs-Élysées', () => {
  const st = stageOf(5);

  it('ingen ramte: skyd igen', () => {
    const res = computeStage(st, stageState(5, { hits: [] }), R6, rules);
    expect(res.complete).toBe(false);
    expect(res.info).toContain('Ingen ramte – alle skyder igen');
  });

  it('Vinokourov-mirakel: øjnene trækkes fra tiden, og han vinder etapen', () => {
    const res = computeStage(st, stageState(5, { hits: ['c'], vinokourovDice: 9 }), R6, rules);
    const r = by(res);
    expect(res.info).toContain('Vinokourov-mirakel');
    expect(r.c).toMatchObject({ place: 1, timeSec: -9, gron: 25 });
    expect(r.a).toMatchObject({ place: null, timeSec: 0, gron: 0, missing: false });
    expect(res.complete).toBe(true);
  });

  it('Vinokourov uden terningsum er ufuldstændig', () => {
    expect(computeStage(st, stageState(5, { hits: ['c'], vinokourovDice: null }), R6, rules).complete).toBe(false);
  });

  it('knock-out med 4: vinder −10, finaletaber −6, semifinaletabere deler 3. plads (−4)', () => {
    const rounds = [
      { duels: [{ a: 'a', b: 'c', winner: 'c' }, { a: 'd', b: 'f', winner: 'd' }] },
      { duels: [{ a: 'c', b: 'd', winner: 'd' }] },
    ];
    const res = computeStage(st, stageState(5, { hits: ['a', 'c', 'd', 'f'], rounds }), R6, rules);
    const r = by(res);
    expect(r.d).toMatchObject({ place: 1, timeSec: -10, gron: 25 });
    expect(r.c).toMatchObject({ place: 2, timeSec: -6, gron: 20 });
    expect(r.a).toMatchObject({ place: 3, timeSec: -4, gron: 15 });
    expect(r.f).toMatchObject({ place: 3, timeSec: -4, gron: 15 });
    expect(r.b).toMatchObject({ place: null, timeSec: 0, gron: 0 });
    expect(res.complete).toBe(true);
  });

  it('knock-out med 3 (walkover): taberen i første runde er "semifinaletaber"', () => {
    const rounds = [{ duels: [{ a: 'a', b: 'b', winner: 'a' }, { a: 'c', b: null, winner: 'c' }] }, { duels: [{ a: 'a', b: 'c', winner: 'c' }] }];
    const r = by(computeStage(st, stageState(5, { hits: ['a', 'b', 'c'], rounds }), R6, rules));
    expect(r.c).toMatchObject({ place: 1, timeSec: -10 });
    expect(r.a).toMatchObject({ place: 2, timeSec: -6 });
    expect(r.b).toMatchObject({ place: 3, timeSec: -4, gron: 15 });
  });

  it('knock-out med 6: første-runde-tabere deler 4. plads uden bonussekunder', () => {
    const rounds = [
      { duels: [{ a: 'a', b: 'b', winner: 'a' }, { a: 'c', b: 'd', winner: 'c' }, { a: 'e', b: 'f', winner: 'e' }] },
      { duels: [{ a: 'a', b: 'c', winner: 'a' }, { a: 'e', b: null, winner: 'e' }] },
      { duels: [{ a: 'a', b: 'e', winner: 'e' }] },
    ];
    const r = by(computeStage(st, stageState(5, { hits: six, rounds }), R6, rules));
    expect(r.e).toMatchObject({ place: 1, timeSec: -10, gron: 25 });
    expect(r.a).toMatchObject({ place: 2, timeSec: -6, gron: 20 });
    expect(r.c).toMatchObject({ place: 3, timeSec: -4, gron: 15 });
    for (const id of ['b', 'd', 'f']) expect(r[id]).toMatchObject({ place: 4, timeSec: 0, gron: 10 });
  });

  it('knock-out i gang er ufuldstændig', () => {
    const rounds = [{ duels: [{ a: 'a', b: 'b', winner: null }] }];
    const res = computeStage(st, stageState(5, { hits: ['a', 'b'], rounds }), R6, rules);
    expect(res.complete).toBe(false);
    expect(res.info).toContain('Knock-out i gang');
  });
});

describe('Rettelser', () => {
  it('manuelle rettelser lægges oven i de beregnede tal', () => {
    const res = computeStage(
      stageOf(1),
      stageState(1, { times: { a: 8, b: 9 } }, { adjust: { a: { timeSec: 2.5, gron: -5, prik: 3, note: 'spildte' } } }),
      riders(['a', 'b']),
      rules,
    );
    const r = by(res);
    expect(r.a).toMatchObject({ timeSec: 10.5, gron: 20, prik: 3 });
    expect(r.a.notes.join(' ')).toContain('spildte');
  });

  it('ændret input (rettet tid) ændrer resultatet – intet caches', () => {
    const c = contentWith(['a', 'b']);
    const g1 = game({ 1: stageState(1, { times: { a: 8, b: 9 } }) });
    expect(computeStandings(c, g1).tables.gul[0].riderId).toBe('a');
    const g2 = game({ 1: stageState(1, { times: { a: 9.5, b: 9 } }) });
    expect(computeStandings(c, g2).tables.gul[0].riderId).toBe('b');
  });

  it('genåbnet etape (status running) tæller stadig med i klassementet', () => {
    const c = contentWith(['a', 'b']);
    const s = computeStandings(c, game({ 1: stageState(1, { times: { a: 8, b: 9 } }, { status: 'running' }) }));
    expect(s.countedStages).toEqual([1]);
    expect(s.completedStages).toBe(0);
    expect(s.totals.a.gron).toBe(25);
  });
});

describe('Klassement og lighed', () => {
  it('gul: laveste tid; grøn/prik: flest point', () => {
    const c = contentWith(['a', 'b', 'c']);
    const s = computeStandings(
      c,
      game({
        1: stageState(1, { times: { a: 10, b: 8, c: 9 } }),
        4: stageState(4, { hits: [], times: { a: 5, b: 7, c: 6 } }),
      }),
    );
    // Alle har 15,0 s. a og b har én etapesejr hver; a vandt seneste etape → a, b, c.
    expect(s.tables.gul.map((r) => [r.riderId, r.value, r.rank])).toEqual([
      ['a', 15, 1],
      ['b', 15, 2],
      ['c', 15, 3],
    ]);
    expect(s.tables.prik[0].riderId).toBe('a');
    expect(s.tables.gron[0]).toMatchObject({ riderId: 'b', value: 25 });
  });

  it('lighed i tid afgøres af flest etapesejre', () => {
    const c = contentWith(['a', 'b']);
    // a vinder etape 1 (8 vs 9), b vinder etape 4 (5 vs 6) → samme tid (14), 1 sejr hver → seneste etape: b
    const s = computeStandings(c, game({ 1: stageState(1, { times: { a: 8, b: 9 } }), 4: stageState(4, { hits: [], times: { a: 6, b: 5 } }) }));
    expect(s.tables.gul.map((r) => [r.riderId, r.value])).toEqual([
      ['b', 14],
      ['a', 14],
    ]);
    expect(s.tables.gul[0].tied).toBe(false);
  });

  it('flere etapesejre slår seneste etape', () => {
    const c = contentWith(['a', 'b', 'c']);
    // a: sejr i 1 og 2 (sprint, +0) men langsom; b: matcher tiden
    const s = computeStandings(
      c,
      game({
        1: stageState(1, { times: { a: 10, b: 11, c: 20 } }),
        2: stageState(2, { order: ['a', 'b', 'c'] }), // a +0, b +3
        4: stageState(4, { hits: [], times: { a: 10, b: 6, c: 1 } }), // c vinder; a=20, b=20
      }),
    );
    const gul = s.tables.gul;
    expect(gul.find((r) => r.riderId === 'a')!.value).toBe(gul.find((r) => r.riderId === 'b')!.value);
    expect(gul.findIndex((r) => r.riderId === 'a')).toBeLessThan(gul.findIndex((r) => r.riderId === 'b'));
  });

  it('fuldstændig lighed markeres og kan afgøres af kommissæren', () => {
    const c = contentWith(['a', 'b', 'c']);
    const stages = { 2: stageState(2, { order: ['c', 'a', 'b'], bonuses: { start: 'b' } }) }; // grøn: c25 a20 b15+10=25
    const s1 = computeStandings(c, game(stages));
    // c og b har 25 point; c har en etapesejr → c foran
    expect(s1.tables.gron.map((r) => r.riderId)).toEqual(['c', 'b', 'a']);
    // Prikket: alle har 0. c har en etapesejr → c foran. a og b: seneste etape a 2., b 3. → a foran.
    const prik = s1.tables.prik;
    expect(prik.map((r) => [r.riderId, r.rank, r.tied])).toEqual([
      ['c', 1, false],
      ['a', 2, false],
      ['b', 3, false],
    ]);
    // Kommissærens afgørelse kommer sidst i rækken og kan ikke vælte en automatisk tiebreak.
    const s2 = computeStandings(c, game(stages, { classificationTieOrder: { prik: ['b', 'a'] } }));
    expect(s2.tables.prik.map((r) => r.riderId)).toEqual(['c', 'a', 'b']);
  });

  it('helt uafklaret lighed: kommissærens rækkefølge bruges', () => {
    const c = contentWith(['a', 'b']);
    const g = game({ 1: stageState(1, { times: { a: 8, b: 8 } }) });
    const s1 = computeStandings(c, g);
    expect(s1.tables.gul.every((r) => r.tied && r.rank === 1)).toBe(true);
    const s2 = computeStandings(c, { ...g, classificationTieOrder: { gul: ['b', 'a'] } });
    expect(s2.tables.gul.map((r) => [r.riderId, r.rank, r.tied])).toEqual([
      ['b', 1, false],
      ['a', 2, false],
    ]);
  });

  it('stilling efter etape N tæller kun etaper til og med N', () => {
    const c = contentWith(['a', 'b']);
    const g = game({ 1: stageState(1, { times: { a: 8, b: 9 } }), 2: stageState(2, { order: ['b', 'a'] }) });
    expect(computeStandings(c, g, 1).totals.a.gron).toBe(25);
    expect(computeStandings(c, g).totals.a.gron).toBe(45);
  });

  it('tilpasser sig 3 og 10 ryttere, og data for fjernede ryttere ignoreres', () => {
    const ten = Array.from({ length: 10 }, (_, i) => `r${i}`);
    const times = Object.fromEntries(ten.map((id, i) => [id, 10 + i]));
    const s10 = computeStandings(contentWith(ten), game({ 1: stageState(1, { times }) }));
    expect(s10.tables.gron.map((r) => r.value)).toEqual([25, 20, 15, 10, 5, 0, 0, 0, 0, 0]);
    expect(s10.tables.gron.slice(5).every((r) => r.tied)).toBe(false); // afgjort af seneste etapes placering
    const s3 = computeStandings(contentWith(['r0', 'r5', 'r9']), game({ 1: stageState(1, { times }) }));
    expect(s3.tables.gul.map((r) => r.riderId)).toEqual(['r0', 'r5', 'r9']);
    expect(s3.totals.r9.gron).toBe(15);
  });
});

describe('Komplet testløb: 6 ryttere gennem alle 5 etaper (stemmer med håndregning)', () => {
  /*
   * Håndregning (se tabellerne i kommentarerne):
   *
   * E1 Prolog – tider: a 8,4  b 10,1  c 7,9  d 12,0  e 9,5  f 15,2
   *   placering c, a, e, b, d, f → grøn c25 a20 e15 b10 d5 f0
   * E2 Sprint – rækkefølge b, a, f, c, e, d; bonus start=f (+10 grøn), tredje=d (+10 bjerg)
   *   grøn b25 a20 f15+10 c10 e5 d0 · tid b+0 a+3 f+5 c+7 e+10 d+10 · bjerg d10
   * E3 Udbrud – quiz: 0-0 [a,b,c] (1/1), 0-4 [a] (2/2), 2-3 [c,d] (2/2), 4-2 [e] (bjerg 1/point 2)
   *   quiz a: 3 bjerg, 3 point, −6s · b: 1, 1, −3s · c: 3, 3, −6s · d: 2, 2, −3s · e: 1, 2, −3s · f: 0
   *   terning a 0  b 4,2  c 12,5  d 2,0  e 7,7  f 20,0
   *   etapetid a −6,0  d −1,0  b 1,2  e 4,7  c 6,5  f 20,0
   *   grøn a 25+3  d 20+2  b 15+1  e 10+2  c 5+3  f 0 · bjerg a3 b1 c3 d2 e1
   * E4 Bjerg – udbrydere b (7), e (11); bajer a 9,0 b 14,0 c 8,0 d 11,5 e 16,0 f 10,0
   *   etapetid a 9,0 b 7,0 c 8,0 d 11,5 e 5,0 f 10,0 → bjerg e25 b20 c15 a10 f5 d0
   * E5 Champs – ramte a, c, d, f; runde 1: c slår a, d slår f; finale: d slår c
   *   d 1. (−10s, 25) · c 2. (−6s, 20) · a og f delt 3. (−4s, 15)
   *
   * Samlet tid:  a 8,4+3−6+9−4 = 10,4 · b 10,1+0+1,2+7 = 18,3 · c 7,9+7+6,5+8−6 = 23,4
   *              d 12+10−1+11,5−10 = 22,5 · e 9,5+10+4,7+5 = 29,2 · f 15,2+5+20+10−4 = 46,2
   * Grøn:        a 20+20+28+15 = 83 · b 10+25+16 = 51 · c 25+10+8+20 = 63
   *              d 5+0+22+25 = 52 · e 15+5+12 = 32 · f 0+25+0+15 = 40
   * Bjerg:       a 3+10 = 13 · b 1+20 = 21 · c 3+15 = 18 · d 10+2 = 12 · e 1+25 = 26 · f 5
   */
  const content = contentWith(six);
  const g = game({
    1: stageState(1, { times: { a: 8.4, b: 10.1, c: 7.9, d: 12.0, e: 9.5, f: 15.2 } }),
    2: stageState(2, { order: ['b', 'a', 'f', 'c', 'e', 'd'], carrotGroups: [['c', 'e']], bonuses: { start: 'f', third: 'd' } }),
    3: stageState(3, {
      quiz: { '0-0': ['a', 'b', 'c'], '0-4': ['a'], '2-3': ['c', 'd'], '4-2': ['e'] },
      dice: { a: 0, b: 4.2, c: 12.5, d: 2.0, e: 7.7, f: 20.0 },
    }),
    4: stageState(4, { hits: ['b', 'e'], dice: { b: 7, e: 11 }, times: { a: 9.0, b: 14.0, c: 8.0, d: 11.5, e: 16.0, f: 10.0 } }),
    5: stageState(5, {
      hits: ['a', 'c', 'd', 'f'],
      rounds: [
        { duels: [{ a: 'a', b: 'c', winner: 'c' }, { a: 'd', b: 'f', winner: 'd' }] },
        { duels: [{ a: 'c', b: 'd', winner: 'd' }] },
      ],
    }),
  });
  const s = computeStandings(content, g);

  it('alle etaper er komplette og afsluttede', () => {
    expect(s.stageResults.every((r) => r.complete)).toBe(true);
    expect(s.completedStages).toBe(5);
    expect(s.countedStages).toEqual([1, 2, 3, 4, 5]);
  });

  it('samlet tid (gul)', () => {
    expect(six.map((id) => s.totals[id].timeSec)).toEqual([10.4, 18.3, 23.4, 22.5, 29.2, 46.2]);
    expect(s.tables.gul.map((r) => [r.riderId, r.value])).toEqual([
      ['a', 10.4],
      ['b', 18.3],
      ['d', 22.5],
      ['c', 23.4],
      ['e', 29.2],
      ['f', 46.2],
    ]);
  });

  it('pointkonkurrencen (grøn)', () => {
    expect(six.map((id) => s.totals[id].gron)).toEqual([83, 51, 63, 52, 32, 40]);
    expect(s.tables.gron.map((r) => r.riderId)).toEqual(['a', 'c', 'd', 'b', 'f', 'e']);
  });

  it('bjergkonkurrencen (prikket)', () => {
    expect(six.map((id) => s.totals[id].prik)).toEqual([13, 21, 18, 12, 26, 5]);
    expect(s.tables.prik.map((r) => r.riderId)).toEqual(['e', 'b', 'c', 'a', 'd', 'f']);
  });

  it('etapesejre og ingen uafgjorte', () => {
    expect(six.map((id) => s.totals[id].stageWins)).toEqual([1, 1, 1, 1, 1, 0]);
    expect(Object.values(s.tables).flat().some((r) => r.tied)).toBe(false);
  });

  it('stillingen efter etape 3', () => {
    const s3 = computeStandings(content, g, 3);
    // a 8,4+3−6 = 5,4 · d 12+10−1 = 21 · b 10,1+0+1,2 = 11,3
    expect(s3.tables.gul[0]).toMatchObject({ riderId: 'a', value: 5.4 });
    expect(s3.totals.b.timeSec).toBe(11.3);
    expect(s3.totals.d.timeSec).toBe(21);
  });
});

describe('Konfigurerbare regler (content.json)', () => {
  it('ny pointskala, tidstillæg, quizværdier og bonussekunder slår igennem', () => {
    const c = contentWith(['a', 'b', 'c']);
    const custom = {
      ...c,
      rules: { ...c.rules, placementPoints: [10, 5], pointsBeyondScale: 1 },
      stages: c.stages.map((s) => {
        const sc = s.scoring;
        if (sc.type === 'sprint') return { ...s, scoring: { ...sc, placementTimePenaltySec: [0, 1], bonuses: [{ id: 'start', label: 'x', jersey: 'prik' as const, points: 3 }] } };
        if (sc.type === 'udbrud') return { ...s, scoring: { ...sc, quizCorrectAnswerSec: -5, quizRowPoint: [9, 9, 9, 9, 9] } };
        if (sc.type === 'champs') return { ...s, scoring: { ...sc, knockoutBonusSec: [-20, -1] } };
        return s;
      }),
    };
    const s = computeStandings(
      custom,
      game({
        2: stageState(2, { order: ['a', 'b', 'c'], bonuses: { start: 'c' } }),
        3: stageState(3, { quiz: { '0-0': ['b'] }, dice: { a: 1, b: 1, c: 9 } }),
        5: stageState(5, { hits: ['a', 'b'], rounds: [{ duels: [{ a: 'a', b: 'b', winner: 'b' }] }] }),
      }),
    );
    // Sprint: a 10, b 5, c 1 (+3 bjerg); tid a 0, b 1, c 1 (gentager sidste)
    // Udbrud: b −5s+1 = −4 (1.) 10+9 point; a 1 (2.) 5; c 9 (3.) 1
    // Champs: b −20s, 10 point; a −1s, 5 point
    expect(s.totals.a).toMatchObject({ gron: 10 + 5 + 5, timeSec: 0 + 1 - 1 });
    expect(s.totals.b).toMatchObject({ gron: 5 + 19 + 10, timeSec: 1 - 4 - 20 });
    expect(s.totals.c).toMatchObject({ gron: 1 + 1, prik: 3, timeSec: 1 + 9 });
  });

  it('tiebreak-rækkefølgen kan ændres', () => {
    const c = contentWith(['a', 'b']);
    const g = game({ 1: stageState(1, { times: { a: 8, b: 9 } }), 4: stageState(4, { hits: [], times: { a: 6, b: 5 } }) });
    // Standard: lige tid og sejre → seneste etape → b
    expect(computeStandings(c, g).tables.gul[0].riderId).toBe('b');
    // Kun kommissæren afgør: uden afgørelse er de uafgjorte
    const onlyComm = { ...c, rules: { ...c.rules, tieBreak: ['commissioner' as const] } };
    expect(computeStandings(onlyComm, g).tables.gul.every((r) => r.tied)).toBe(true);
  });
});
