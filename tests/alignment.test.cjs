const test = require('node:test');
const assert = require('node:assert/strict');
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
