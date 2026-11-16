const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const A = require('../src/alignment.js');

test('unambiguous exact sequence is a perfect match', () => {
  const hit = A.describe('ACGTACGT', 'ACGTACGT');
  assert.equal(hit.perfect, true);
  assert.equal(hit.literalExact, true);
  assert.equal(hit.identity, 100);
  assert.equal(hit.coverage, 100);
});

test('primer R covers A while retaining degeneracy metadata', () => {
  const hit = A.describe('ACGTRCGT', 'ACGTACGT');
  assert.equal(hit.perfect, true);
  assert.equal(hit.literalExact, false);
  assert.equal(hit.primerVariants, '2');
  assert.equal(hit.coveredMatches, 8);
});

test('primer N is degeneracy and does not make a defined target indeterminate', () => {
  const hit = A.describe('ACGTNCGT', 'ACGTACGT');
  assert.equal(hit.perfect, true);
  assert.equal(hit.indeterminate, false);
  assert.equal(hit.primerVariants, '4');
});

test('target N stays indeterminate even with permissive thresholds', () => {
  const hit = A.describe('ACGTACGT', 'ACGTNCGT');
  assert.equal(hit.indeterminate, true);
  assert.equal(hit.targetNCount, 1);
  assert.equal(hit.perfect, false);
  assert.equal(A.assess(hit, 0, 0).passed, false);
  assert.equal(A.assess(hit, 0, 0).judgement, 'indeterminate');
});

test('internal mismatch cannot become a perfect match', () => {
  const hit = A.describe('ACGTACGT', 'ACGTTCGT');
  assert.equal(hit.mismatchCount, 1);
  assert.equal(hit.perfect, false);
});

test('a target gap lowers coverage and is recorded separately', () => {
  const hit = A.describe('ACGTACGT', 'ACG-ACGT');
  assert.equal(hit.primerBulgeCount, 1);
  assert.equal(hit.coverage, 87.5);
  assert.equal(hit.perfect, false);
});

test('reverse complement preserves the full IUPAC alphabet', () => {
  assert.equal(A.reverseComplement('ACGTRYSWKMBDHVN'), 'NBDHVKMWSRYACGT');
});

test('Scle reverse primer can align to the antisense reference', () => {
  const hit = A.align('AAWTTGACGACGGCCATGC', 'GCATGGCCGTCGTCAATTT');
  assert.equal(hit.searchStrand, 'antisense');
  assert.equal(hit.perfect, true);
  assert.equal(hit.bindingStart, 1);
  assert.equal(hit.bindingEnd, 19);
});

test('Scle forward and reverse retain 16 and 2 variants', () => {
  assert.equal(A.primerInfo('CCAGCMGACGCGGTRANACTTA').primerVariants, '16');
  assert.equal(A.primerInfo('AAWTTGACGACGGCCATGC').primerVariants, '2');
});

test('RNA U and inosine I are not silently accepted as DNA', () => {
  assert.throws(() => A.normalize('ACGTACGU'));
  assert.throws(() => A.normalize('ACGTACGI'));
});

// The plain dynamic programming of the engine before it was optimized (full matrices, both
// strands traced). The optimized engine must return exactly the same results.
function referenceOneStrand(primer, target) {
  primer = A.normalize(primer); target = A.normalize(target);
  const m = primer.length, n = target.length, width = n + 1;
  if (m > 100 || n > 1000000 || m * n > 12000000) throw Error('Alignment too large: split long reference sequences into gene regions.');
  const trace = new Uint8Array((m + 1) * width);
  let prev = new Int32Array(width), current = new Int32Array(width);
  const pm = [...primer].map(x => A.MASK[x]), tm = [...target].map(x => x === 'N' ? 0 : A.MASK[x]);
  for (let i = 1; i <= m; i++) {
    current[0] = -5 * i; trace[i * width] = 2;
    for (let j = 1; j <= n; j++) {
      const diag = prev[j - 1] + (tm[j - 1] === 0 ? 0 : (pm[i - 1] & tm[j - 1]) ? 2 : -3), up = prev[j] - 5, left = current[j - 1] - 5;
      let value = diag, direction = 1;
      if (up > value) { value = up; direction = 2; }
      if (left > value) { value = left; direction = 3; }
      current[j] = value; trace[i * width + j] = direction;
    }
    [prev, current] = [current, prev];
  }
  let end = 1;
  for (let j = 2; j <= n; j++) if (prev[j] > prev[end]) end = j;
  let i = m, j = end, p = [], t = [];
  while (i > 0) {
    const direction = trace[i * width + j];
    if (direction === 1) { p.push(primer[--i]); t.push(target[--j]); }
    else if (direction === 2) { p.push(primer[--i]); t.push('-'); }
    else { p.push('-'); t.push(target[--j]); }
  }
  p = p.reverse().join(''); t = t.reverse().join('');
  return { alignmentPrimer: p, alignmentTarget: t, score: prev[end], start: j + 1, end, ...A.describe(p, t) };
}
function referenceAlign(primer, target) {
  primer = A.normalize(primer); target = A.normalize(target);
  const f = referenceOneStrand(primer, target), r = referenceOneStrand(primer, A.reverseComplement(target));
  const useReverse = r.score > f.score || (r.score === f.score && r.identity > f.identity), hit = useReverse ? r : f;
  return { ...hit, searchStrand: useReverse ? 'antisense' : 'sense',
    bindingStart: useReverse ? target.length - hit.end + 1 : hit.start,
    bindingEnd: useReverse ? target.length - hit.start + 1 : hit.end,
    targetOligo5to3: A.reverseComplement(hit.alignmentTarget.replace(/-/g, '')) };
}
// Call object as the former worker built it.
function referenceCall(record, primer, minIdentity, minCoverage) {
  const h = referenceAlign(primer.sequence, record.sequence), assessment = A.assess(h, minIdentity, minCoverage), { sequence, ...metadata } = record;
  return { ...metadata, ...h, ...assessment, primer: primer.name, primerSequence: primer.sequence,
    confidence: assessment.passed && !h.primerBulgeCount && !h.targetBulgeCount && !h.uncertainCount ? 'high' : 'review' };
}
function random(seed) {
  return () => { seed = (seed + 0x6D2B79F5) >>> 0; let t = seed; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function randomSequence(rnd, length) {
  const alphabet = ['ACGT', 'AT', 'A', 'ACGTN', 'NNNA', 'N', 'ACGTRYSWKMBDHVN', 'RYN'][Math.floor(rnd() * 8)];
  let s = '';
  for (let i = 0; i < length; i++) s += alphabet[Math.floor(rnd() * alphabet.length)];
  if (rnd() < 0.2 && length > 2) { const unit = s.slice(0, 1 + Math.floor(rnd() * 3)); s = unit.repeat(length).slice(0, length); }
  return s;
}
const core = h => ({ alignmentPrimer: h.alignmentPrimer, alignmentTarget: h.alignmentTarget, score: h.score, start: h.start, end: h.end, searchStrand: h.searchStrand, bindingStart: h.bindingStart, bindingEnd: h.bindingEnd });

test('ties: diagonal before up before left, first maximal end column', () => {
  // Each case changes if the corresponding rule is altered.
  assert.deepEqual(core(A.align('AA', 'A')), { alignmentPrimer: 'AA', alignmentTarget: '-A', score: -3, start: 1, end: 1, searchStrand: 'sense', bindingStart: 1, bindingEnd: 1 });
  assert.deepEqual(core(A.align('ATTA', 'NTATA')), { alignmentPrimer: 'ATTA', alignmentTarget: 'A-TA', score: 1, start: 3, end: 5, searchStrand: 'sense', bindingStart: 3, bindingEnd: 5 });
  assert.deepEqual(core(A.align('AAT', 'ATAT')), { alignmentPrimer: 'AAT', alignmentTarget: 'TAT', score: 1, start: 2, end: 4, searchStrand: 'sense', bindingStart: 2, bindingEnd: 4 });
  assert.deepEqual(core(A.align('A', 'AA')), { alignmentPrimer: 'A', alignmentTarget: 'A', score: 2, start: 1, end: 1, searchStrand: 'sense', bindingStart: 1, bindingEnd: 1 });
  assert.deepEqual(core(A.align('ACG', 'ACGTACG')), { alignmentPrimer: 'ACG', alignmentTarget: 'ACG', score: 6, start: 1, end: 3, searchStrand: 'sense', bindingStart: 1, bindingEnd: 3 });
});

test('strands: reverse needs a higher score, or an equal score with higher identity', () => {
  assert.deepEqual(core(A.align('AAAA', 'TTTT')), { alignmentPrimer: 'AAAA', alignmentTarget: 'AAAA', score: 8, start: 1, end: 4, searchStrand: 'antisense', bindingStart: 1, bindingEnd: 4 });
  // equal score and identity: sense
  assert.deepEqual(core(A.align('A', 'C')), { alignmentPrimer: 'A', alignmentTarget: 'C', score: -3, start: 1, end: 1, searchStrand: 'sense', bindingStart: 1, bindingEnd: 1 });
  // equal score -3, identity 50 (antisense) against 0 (sense)
  const hit = A.align('AT', 'NA');
  assert.deepEqual(core(hit), { alignmentPrimer: 'AT', alignmentTarget: '-T', score: -3, start: 1, end: 1, searchStrand: 'antisense', bindingStart: 2, bindingEnd: 2 });
  assert.equal(hit.identity, 50);
});

test('target N scores 0 on the diagonal', () => {
  const hit = A.align('A', 'N');
  assert.equal(hit.score, 0);
  assert.equal(hit.indeterminate, true);
  assert.equal(A.align('ACGT', 'ACNT').score, 6);
});

test('inputs are normalized and limits raise the same errors', () => {
  assert.deepEqual(A.align('acgt', ' AC\nGT\t'), A.align('ACGT', 'ACGT'));
  assert.throws(() => A.align('ACGT', 'ACGU'), /Invalid DNA\/IUPAC/);
  assert.throws(() => A.align('ACGT', 'AC-GT'), /Invalid DNA\/IUPAC/);
  assert.throws(() => A.align('ACGT', ''), /Invalid DNA\/IUPAC/);
  assert.throws(() => A.align('ACGT', 7), /must be a string/);
  assert.throws(() => A.align('A'.repeat(101), 'ACGT'), /Alignment too large/);
  assert.throws(() => A.align('ACGTACGTACGTA', 'A'.repeat(1000000)), /Alignment too large/);
  assert.throws(() => A.oneStrand('ACGTU', 'ACGT'), /Invalid DNA\/IUPAC/);
});

test('optimized alignment equals the plain dynamic programming on random sequences', () => {
  const rnd = random(20261116);
  for (let k = 0; k < 4000; k++) {
    const p = randomSequence(rnd, 1 + Math.floor(rnd() * 24)), t = randomSequence(rnd, 1 + Math.floor(rnd() * (rnd() < 0.3 ? p.length + 2 : 70)));
    assert.deepEqual(A.align(p, t), referenceAlign(p, t), JSON.stringify([p, t]));
    if (k % 4 === 0) assert.deepEqual(A.oneStrand(p, t), referenceOneStrand(p, t), JSON.stringify([p, t]));
  }
});

test('reused buffers: long and short targets and primers in any order', () => {
  const rnd = random(7), long = randomSequence(rnd, 4800).replace(/N/g, 'A'), cases = [
    ['GTCGGTAAAACTCGTGCCAGC', long], ['GTCGGTAAAACTCGTGCCAGC', 'GTCGG'], ['ACGT', 'A'], ['A'.repeat(80), long.slice(0, 900)],
    ['CCAGCMGACGCGGTRANACTTA', 'NNNNNNNNNN'], ['TCTHRRANAGGATTGCGCTGTTA', long.slice(100, 140)], ['ACGTACGT', long], ['AT', 'ATATATATATATATATAT']];
  const expected = cases.map(([p, t]) => referenceAlign(p, t));
  for (const order of [[0, 1, 2, 3, 4, 5, 6, 7], [7, 6, 5, 4, 3, 2, 1, 0], [3, 2, 0, 1, 6, 5, 4, 7]])
    for (const i of order) assert.deepEqual(A.align(...cases[i]), expected[i], 'case ' + i);
  const targets = cases.map(c => c[1]), batch = A.alignBatch('GTCGGTAAAACTCGTGCCAGC', targets);
  const halves = A.joinBatches([A.alignBatch('GTCGGTAAAACTCGTGCCAGC', targets.slice(0, 3)), A.alignBatch('GTCGGTAAAACTCGTGCCAGC', targets.slice(3))]);
  assert.deepEqual(halves, batch);
  targets.forEach((t, k) => {
    const h = referenceAlign('GTCGGTAAAACTCGTGCCAGC', t), [p, a, score] = batch.patterns[batch.pattern[k]];
    assert.deepEqual([p, a, score, batch.start[k], batch.end[k], batch.reverse[k] === 1, batch.length[k]], [h.alignmentPrimer, h.alignmentTarget, h.score, h.start, h.end, h.searchStrand === 'antisense', t.length]);
  });
});

test('compact results expand to the former worker call objects', () => {
  const rnd = random(99), primers = [{ name: 'F', sequence: 'GTCGGTAAAACTCGTGCCAGC' }, { name: 'R', sequence: 'CATAGTGGGGTATCTAATCCCAGTTTG' }, { name: 'Low', sequence: 'ATATATATAT' }];
  const records = Array.from({ length: 40 }, (_, i) => ({ id: 'r' + i, accession: 'X' + i, gene: '12S', organism: 'sp. ' + i, phylum: i % 2 ? 'Chordata' : 'unclassified',
    sequence: randomSequence(rnd, 8 + Math.floor(rnd() * 300)), length: 0, ...(i % 3 ? { partial: false, feature_index: i } : {}) }));
  records.forEach(r => { r.length = r.sequence.length; });
  const metadata = records.map(({ sequence, ...rest }) => rest);
  for (const primer of primers) {
    const compact = A.joinBatches([A.alignBatch(primer.sequence, records.slice(0, 17).map(r => r.sequence)), A.alignBatch(primer.sequence, records.slice(17).map(r => r.sequence))]);
    for (const [minIdentity, minCoverage] of [[60, 80], [0, 0], [95, 100]]) {
      const calls = A.expandCalls(compact, metadata, primer, minIdentity, minCoverage);
      records.forEach((r, i) => {
        const expected = referenceCall(r, primer, minIdentity, minCoverage);
        assert.deepEqual(calls[i], expected);
        assert.deepEqual(Object.keys(calls[i]), Object.keys(expected));
      });
    }
  }
});

test('result cache: reuse only for the same records, oldest primers evicted first', () => {
  const records = [{ id: 'a', sequence: 'ACGT' }, { id: 'b', sequence: 'GGCC' }];
  const result = s => A.alignBatch(s, records.map(r => r.sequence));
  const cache = A.createResultCache(5), first = result('ACG'), second = result('GGC'), third = result('TTT');
  cache.set(records, 'ACG', first);
  assert.equal(cache.get([...records], 'ACG'), first);
  assert.equal(cache.get(records, 'GGC'), null);
  assert.equal(cache.get([records[1], records[0]], 'ACG'), null, 'order');
  assert.equal(cache.get([records[0]], 'ACG'), null, 'length');
  assert.equal(cache.get([records[0], { ...records[1] }], 'ACG'), null, 'other object with the same sequence');
  records[1].sequence = 'GGCA';
  assert.equal(cache.get(records, 'ACG'), null, 'sequence changed in place');
  records[1].sequence = 'GGCC';
  assert.equal(cache.get(records, 'ACG'), first);
  cache.set(records, 'GGC', second);
  assert.equal(cache.used, 4);
  cache.get(records, 'ACG');
  cache.set(records, 'TTT', third);
  assert.equal(cache.get(records, 'GGC'), null, 'least recently used entry evicted');
  assert.equal(cache.get(records, 'ACG'), first);
  assert.equal(cache.get(records, 'TTT'), third);
  const others = [{ id: 'c', sequence: 'ACGT' }, records[1]];
  cache.set(others, 'ACG', result('ACG'));
  assert.equal(cache.get(records, 'TTT'), null, 'another record list replaces the store');
  assert.equal(cache.size, 1);
  assert.throws(() => cache.set(others, 'X', A.alignBatch('ACG', ['A'])), /does not match/);
  cache.clear();
  assert.equal(cache.get(others, 'ACG'), null);
  assert.equal(cache.used, 0);
});

test('precomputed builtin results are reproduced (sample)', () => {
  const data = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(__dirname, '../data/references.json.gz'))).toString('utf8'));
  const { minIdentity, minCoverage } = data.builtin;
  let checked = 0;
  for (const [name, group] of Object.entries(data.builtin.primers)) {
    const primer = { name, sequence: data.presets[name] };
    // A quarter of the 78,048 precomputed calls keeps this test at a few seconds.
    const sample = group.calls.filter((_, k) => k % 4 === 0), records = sample.map(([index]) => data.records[index]);
    const compact = A.alignBatch(primer.sequence, records.map(r => r.sequence));
    const calls = A.expandCalls(compact, records.map(({ sequence, ...rest }) => rest), primer, minIdentity, minCoverage);
    sample.forEach(([index, pattern, start, end, reverse], k) => {
      const [p, t, score] = group.summaries[pattern], c = calls[k];
      assert.deepEqual([c.alignmentPrimer, c.alignmentTarget, c.score, c.bindingStart, c.bindingEnd, c.searchStrand], [p, t, score, start, end, reverse ? 'antisense' : 'sense'], name + ' record ' + index);
      checked++;
    });
  }
  assert.ok(checked > 19000);
});
