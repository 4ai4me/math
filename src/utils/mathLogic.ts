/**
 * Pure math and evaluation logic for High School Functions
 * Clean, decoupled and easily testable via node:test
 */

export interface FunctionParams {
  a: number; // vertical scale / sign
  b: number; // horizontal scale / frequency
  c: number; // horizontal shift
  d: number; // vertical shift
}

/**
 * Computes standard transformed function value: y = a * f(b * (x - c)) + d
 */
export function evaluateFunction(
  fnType: 'linear' | 'quadratic' | 'cubic' | 'rational' | 'square_root' | 'absolute' | 'exponential',
  x: number,
  params: FunctionParams = { a: 1, b: 1, c: 0, d: 0 }
): number | null {
  const { a, b, c, d } = params;
  const inner = b * (x - c);

  switch (fnType) {
    case 'linear':
      return a * inner + d;
    case 'quadratic':
      return a * Math.pow(inner, 2) + d;
    case 'cubic':
      return a * Math.pow(inner, 3) + d;
    case 'rational':
      if (Math.abs(inner) < 1e-9) return null; // asymptote
      return a * (1 / inner) + d;
    case 'square_root':
      if (inner < 0) return null; // out of real domain
      return a * Math.sqrt(inner) + d;
    case 'absolute':
      return a * Math.abs(inner) + d;
    case 'exponential':
      return a * Math.pow(2, inner) + d;
    default:
      return null;
  }
}

/**
 * Composite function calculator: (f ∘ g)(x) = f(g(x))
 */
export function evaluateComposite(
  gFn: (x: number) => number | null,
  fFn: (x: number) => number | null,
  x: number
): number | null {
  const gx = gFn(x);
  if (gx === null) return null;
  return fFn(gx);
}

/**
 * Checks horizontal line test (수평선 판별법) numerically on a given grid.
 * Returns true if for any y, at most one x satisfies f(x) ≈ y (One-to-one function: 일대일함수).
 */
export function checkOneToOne(
  evaluator: (x: number) => number | null,
  domainMin: number = -5,
  domainMax: number = 5,
  steps: number = 100
): { isOneToOne: boolean; duplicateY?: number; failingX1?: number; failingX2?: number } {
  const stepSize = (domainMax - domainMin) / steps;
  const yMap = new Map<number, number>(); // rounded y -> x

  for (let i = 0; i <= steps; i++) {
    const x = domainMin + i * stepSize;
    const y = evaluator(x);
    if (y === null || isNaN(y) || !isFinite(y)) continue;

    // round to 2 decimals for grouping
    const roundedY = Math.round(y * 100) / 100;

    if (yMap.has(roundedY)) {
      const prevX = yMap.get(roundedY)!;
      if (Math.abs(x - prevX) > stepSize * 1.5) {
        return {
          isOneToOne: false,
          duplicateY: roundedY,
          failingX1: Math.round(prevX * 100) / 100,
          failingX2: Math.round(x * 100) / 100,
        };
      }
    } else {
      yMap.set(roundedY, x);
    }
  }

  return { isOneToOne: true };
}

/**
 * Generates reproducible simulated MAC identifier and device session token
 * from IP and browser fingerprint components for student differentiation
 */
export function generateDeviceTokenAndMac(
  clientIp: string = '127.0.0.1',
  clientFingerprintSeed: string = 'KSTEM-DEV'
): { deviceToken: string; macSimulatedId: string } {
  let hash = 0;
  const combined = `${clientIp}::${clientFingerprintSeed}`;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);

  // Generate a formatted 6-octet MAC-like string: XX:XX:XX:XX:XX:XX
  const hex = positiveHash.toString(16).padStart(8, '7f') + (positiveHash * 31).toString(16).padStart(8, 'a3');
  const octets = [
    (parseInt(hex.slice(0, 2), 16) | 0x02).toString(16).toUpperCase().padStart(2, '0'), // locally administered bit
    hex.slice(2, 4).toUpperCase(),
    hex.slice(4, 6).toUpperCase(),
    hex.slice(6, 8).toUpperCase(),
    hex.slice(8, 10).toUpperCase(),
    hex.slice(10, 12).toUpperCase(),
  ];

  return {
    deviceToken: `DEV-${octets.join('')}`,
    macSimulatedId: octets.join(':'),
  };
}

/**
 * Calculates score and K-STEM competency radar distribution
 */
export function calculateEvaluation(
  submissions: Array<{ questionId: string; isCorrect: boolean; timeSpentSeconds: number }>,
  questionsMeta: Record<string, { level: number; topic: string }>
): {
  score: number;
  total: number;
  percentage: number;
  competencyScores: {
    conceptUnderstanding: number;
    algebraicReasoning: number;
    problemSolving: number;
    multiRepresentation: number;
  };
  feedbackSummary: string;
  prescriptions: string[];
} {
  const total = submissions.length;
  if (total === 0) {
    return {
      score: 0,
      total: 0,
      percentage: 0,
      competencyScores: {
        conceptUnderstanding: 0,
        algebraicReasoning: 0,
        problemSolving: 0,
        multiRepresentation: 0,
      },
      feedbackSummary: '응시 내역이 없습니다.',
      prescriptions: [],
    };
  }

  let totalPoints = 0;
  let earnedPoints = 0;

  // Competency buckets
  let conceptTotal = 0, conceptEarned = 0;
  let algebraicTotal = 0, algebraicEarned = 0;
  let problemTotal = 0, problemEarned = 0;
  let multiRepTotal = 0, multiRepEarned = 0;

  const wrongTopics: string[] = [];

  for (const sub of submissions) {
    const meta = questionsMeta[sub.questionId] || { level: 2, topic: '함수의 일반 성질' };
    const weight = meta.level * 10; // level 1: 10, level 2: 20, level 3: 30, level 4: 40
    totalPoints += weight;

    if (sub.isCorrect) {
      earnedPoints += weight;
    } else {
      wrongTopics.push(meta.topic);
    }

    // Weight distribution per competency
    if (meta.level === 1) {
      conceptTotal += 20;
      if (sub.isCorrect) conceptEarned += 20;
      multiRepTotal += 10;
      if (sub.isCorrect) multiRepEarned += 10;
    } else if (meta.level === 2) {
      conceptTotal += 15;
      algebraicTotal += 20;
      if (sub.isCorrect) {
        conceptEarned += 15;
        algebraicEarned += 20;
      }
    } else if (meta.level === 3) {
      algebraicTotal += 20;
      problemTotal += 25;
      multiRepTotal += 20;
      if (sub.isCorrect) {
        algebraicEarned += 20;
        problemEarned += 25;
        multiRepEarned += 20;
      }
    } else {
      problemTotal += 35;
      multiRepTotal += 30;
      algebraicTotal += 20;
      if (sub.isCorrect) {
        problemEarned += 35;
        multiRepEarned += 30;
        algebraicEarned += 20;
      }
    }
  }

  const percentage = Math.round((earnedPoints / (totalPoints || 1)) * 100);

  const calcRate = (earned: number, max: number) => {
    if (max === 0) return 70;
    return Math.round((earned / max) * 100);
  };

  const competencyScores = {
    conceptUnderstanding: Math.min(100, Math.max(10, calcRate(conceptEarned, conceptTotal))),
    algebraicReasoning: Math.min(100, Math.max(10, calcRate(algebraicEarned, algebraicTotal))),
    problemSolving: Math.min(100, Math.max(10, calcRate(problemEarned, problemTotal))),
    multiRepresentation: Math.min(100, Math.max(10, calcRate(multiRepEarned, multiRepTotal))),
  };

  const prescriptions: string[] = [];

  if (competencyScores.conceptUnderstanding < 70) {
    prescriptions.push(
      '【APOS 이론 처방】 함수의 형식적 정의를 기계적으로 암기하기보다, 구체적인 x에 따른 y값 산출 행동(Action)을 여러 번 실행하고 이를 하나의 과정(Process)으로 내면화하는 단계별 훈련이 필요합니다.'
    );
  }

  if (competencyScores.multiRepresentation < 70) {
    prescriptions.push(
      '【Rule of Four 다중 표상 처방】 수식(Algebraic)에만 의존하지 않고, 표(Numerical)와 좌표평면 그래프(Graphical), 언어적 서술(Verbal)을 상호 변환하는 연습(그래프 개형 그리기)을 보강해야 합니다.'
    );
  }

  if (competencyScores.algebraicReasoning < 70) {
    prescriptions.push(
      '【Covariational Reasoning 처방】 x의 증가에 따른 y의 증가/감소 변화율의 연속적 관계(동시변화 추론)와 역함수 대칭 조건(y=x)의 대수적 조작 정밀도를 높여야 합니다.'
    );
  }

  if (competencyScores.problemSolving < 70) {
    prescriptions.push(
      '【Chevallard 교수학적 변환론 처방】 복합 조건(절댓값 기호, 구간별 정의 함수)을 직면했을 때 조건을 기준점(x값)으로 나누어 단순화하는 분할 해결 전략을 훈련하세요.'
    );
  }

  if (prescriptions.length === 0) {
    prescriptions.push(
      '【최우수 성취도】 고교 2학년 함수 전 영역(정의, 일대일대응, 합성, 역함수)에서 균형 잡힌 다중표상 추론력을 갖추었습니다. 대학 미적분학의 엄밀한 ε-δ 정의 및 복소함수론으로의 심화 확장을 추천합니다.'
    );
  }

  let feedbackSummary = '';
  if (percentage >= 90) {
    feedbackSummary = '탁월한 수학적 추론력과 다중표상 변환 능력을 보였습니다. 고난도 수능 킬러 문항 및 수리논술 대비가 충분합니다.';
  } else if (percentage >= 75) {
    feedbackSummary = '함수의 기본 개념과 합성·역함수의 조작 능력이 안정적입니다. 심화 응용 단계의 변형 문항 해석력을 다듬으면 최상위권 도약이 가능합니다.';
  } else if (percentage >= 50) {
    feedbackSummary = '기초적인 함숫값 계산은 가능하나, 역함수의 존재 조건(일대일대응) 및 그래프적 심상(Concept Image)에서 일부 오개념이 발견되었습니다.';
  } else {
    feedbackSummary = '함수의 기본 정의(정의역의 각 원소가 공역의 원소에 오직 하나씩 대응)와 수평선 판별법에 대한 직관적 재학습이 긴급히 요구됩니다.';
  }

  return {
    score: earnedPoints,
    total: totalPoints,
    percentage,
    competencyScores,
    feedbackSummary,
    prescriptions,
  };
}
