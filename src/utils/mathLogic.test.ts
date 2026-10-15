import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateFunction,
  evaluateComposite,
  checkOneToOne,
  generateDeviceTokenAndMac,
  calculateEvaluation,
} from './mathLogic.ts';

test('evaluateFunction handles transformations correctly', () => {
  // y = 2 * (x - 3)^2 + 5 at x = 5
  // 2 * (5 - 3)^2 + 5 = 2 * 4 + 5 = 13
  const quadVal = evaluateFunction('quadratic', 5, { a: 2, b: 1, c: 3, d: 5 });
  assert.equal(quadVal, 13);

  // rational function at asymptote should return null
  const ratAsymptote = evaluateFunction('rational', 2, { a: 1, b: 1, c: 2, d: 0 });
  assert.equal(ratAsymptote, null);

  // square root with negative inside should return null
  const sqrtNeg = evaluateFunction('square_root', 1, { a: 1, b: 1, c: 3, d: 0 });
  assert.equal(sqrtNeg, null);
});

test('evaluateComposite handles (f ∘ g)(x)', () => {
  const g = (x: number) => 2 * x + 1;
  const f = (x: number) => x * x;
  // (f ∘ g)(3) = f(g(3)) = f(7) = 49
  const res = evaluateComposite(g, f, 3);
  assert.equal(res, 49);
});

test('checkOneToOne detects one-to-one and non-one-to-one functions', () => {
  // y = 2x + 1 is one-to-one
  const linearCheck = checkOneToOne((x) => 2 * x + 1, -5, 5, 50);
  assert.equal(linearCheck.isOneToOne, true);

  // y = x^2 is NOT one-to-one over [-3, 3] because f(-2) = f(2) = 4
  const quadCheck = checkOneToOne((x) => x * x, -3, 3, 60);
  assert.equal(quadCheck.isOneToOne, false);
});

test('generateDeviceTokenAndMac creates formatted MAC and token', () => {
  const { deviceToken, macSimulatedId } = generateDeviceTokenAndMac('192.168.1.105', 'test-client-seed');
  assert.match(deviceToken, /^DEV-[0-9A-F]{12}$/);
  assert.match(macSimulatedId, /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/);
});

test('calculateEvaluation calculates score and diagnostic prescriptions', () => {
  const submissions = [
    { questionId: 'q1', isCorrect: true, timeSpentSeconds: 20 },
    { questionId: 'q2', isCorrect: false, timeSpentSeconds: 45 },
  ];
  const meta = {
    q1: { level: 1, topic: '함수의 정의' },
    q2: { level: 2, topic: '역함수 성질' },
  };
  const result = calculateEvaluation(submissions, meta);
  assert.ok(result.total > 0);
  assert.ok(result.score <= result.total);
  assert.ok(result.prescriptions.length > 0);
  assert.ok(result.competencyScores.conceptUnderstanding >= 0);
});
