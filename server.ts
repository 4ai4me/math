import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { CURRICULUM_UNITS } from './src/data/curriculumUnits.ts';
import { QUESTION_BANK } from './src/data/questions.ts';
import { generateDeviceTokenAndMac, calculateEvaluation } from './src/utils/mathLogic.ts';
import { StudentSubmission, TeacherAnalytics, QuestionItem } from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// In-memory data store for submissions & dynamic questions
let submissionsStore: StudentSubmission[] = [];
let dynamicQuestions: QuestionItem[] = [...QUESTION_BANK];

// Pre-seed a few realistic student submissions so Teacher Dashboard is rich on first load!
const sampleSubmissions: StudentSubmission[] = [
  {
    id: 'sub-sample-01',
    student: {
      grade: 2,
      classNum: 3,
      studentNum: 7,
      name: '김도현',
      deviceId: 'DEV-4E8A9C112344',
      clientIp: '192.168.10.45',
      macSimulatedId: '4E:8A:9C:11:23:44',
    },
    unitId: 'functions',
    level: 'all',
    submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    durationSeconds: 780,
    answers: [
      { questionId: 'fn-l1-01', selectedChoice: 3, isCorrect: true, timeSpentSeconds: 35 },
      { questionId: 'fn-l1-02', selectedChoice: 3, isCorrect: true, timeSpentSeconds: 65 },
      { questionId: 'fn-l2-01', selectedChoice: 1, isCorrect: true, timeSpentSeconds: 90 },
      { questionId: 'fn-l2-03', selectedChoice: 2, isCorrect: true, timeSpentSeconds: 120 },
      { questionId: 'fn-l3-01', selectedChoice: 1, isCorrect: true, timeSpentSeconds: 160 },
      { questionId: 'fn-l3-03', selectedChoice: 1, isCorrect: true, timeSpentSeconds: 180 },
      { questionId: 'fn-l4-01', selectedChoice: 0, isCorrect: true, timeSpentSeconds: 220 },
    ],
    score: 160,
    totalQuestions: 7,
    percentage: 95,
    competencyScores: {
      conceptUnderstanding: 95,
      algebraicReasoning: 90,
      problemSolving: 92,
      multiRepresentation: 94,
    },
    feedbackSummary: '탁월한 수학적 추론력과 다중표상 변환 능력을 보였습니다. 고난도 수능 킬러 문항 및 수리논술 대비가 충분합니다.',
    prescriptions: [
      '【최우수 성취도】 고교 2학년 함수 전 영역에서 균형 잡힌 다중표상 추론력을 갖추었습니다. 대학 미적분학의 엄밀한 ε-δ 정의로의 심화 확장을 추천합니다.',
    ],
  },
  {
    id: 'sub-sample-02',
    student: {
      grade: 2,
      classNum: 3,
      studentNum: 14,
      name: '이지은',
      deviceId: 'DEV-B21C77FA3319',
      clientIp: '192.168.10.62',
      macSimulatedId: 'B2:1C:77:FA:33:19',
    },
    unitId: 'functions',
    level: 2,
    submittedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    durationSeconds: 540,
    answers: [
      { questionId: 'fn-l2-01', selectedChoice: 1, isCorrect: true, timeSpentSeconds: 80 },
      { questionId: 'fn-l2-02', selectedChoice: 1, isCorrect: true, timeSpentSeconds: 110 },
      { questionId: 'fn-l2-03', selectedChoice: 1, isCorrect: false, timeSpentSeconds: 140 },
      { questionId: 'fn-l2-04', selectedChoice: 2, isCorrect: true, timeSpentSeconds: 150 },
    ],
    score: 60,
    totalQuestions: 4,
    percentage: 75,
    competencyScores: {
      conceptUnderstanding: 80,
      algebraicReasoning: 75,
      problemSolving: 70,
      multiRepresentation: 68,
    },
    feedbackSummary: '함수의 기본 개념과 합성·역함수의 조작 능력이 안정적입니다.',
    prescriptions: [
      '【Rule of Four 다중 표상 처방】 수식에만 의존하지 않고, 표와 좌표평면 그래프의 대칭성을 활용하는 연습을 보강해야 합니다.',
    ],
  },
  {
    id: 'sub-sample-03',
    student: {
      grade: 2,
      classNum: 4,
      studentNum: 21,
      name: '박서준',
      deviceId: 'DEV-98FE04A27B01',
      clientIp: '192.168.10.88',
      macSimulatedId: '98:FE:04:A2:7B:01',
    },
    unitId: 'functions',
    level: 1,
    submittedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    durationSeconds: 420,
    answers: [
      { questionId: 'fn-l1-01', selectedChoice: 3, isCorrect: true, timeSpentSeconds: 50 },
      { questionId: 'fn-l1-02', selectedChoice: 2, isCorrect: false, timeSpentSeconds: 90 },
      { questionId: 'fn-l1-03', selectedChoice: 2, isCorrect: true, timeSpentSeconds: 70 },
      { questionId: 'fn-l1-04', selectedChoice: 1, isCorrect: false, timeSpentSeconds: 110 },
    ],
    score: 40,
    totalQuestions: 4,
    percentage: 50,
    competencyScores: {
      conceptUnderstanding: 65,
      algebraicReasoning: 55,
      problemSolving: 48,
      multiRepresentation: 50,
    },
    feedbackSummary: '기초적인 함숫값 계산은 가능하나, 역함수의 존재 조건 및 그래프적 심상에서 일부 오개념이 발견되었습니다.',
    prescriptions: [
      '【APOS 이론 처방】 함수의 형식적 정의를 기계적으로 암기하기보다, 구체적인 x에 따른 y값 산출 행동(Action)을 여러 번 실행하고 이를 하나의 과정(Process)으로 내면화해야 합니다.',
    ],
  },
];
submissionsStore.push(...sampleSubmissions);

// --- API Endpoints ---

// 1. Device and IP Identification
app.get('/api/device/identify', (req: Request, res: Response) => {
  const forwarded = req.headers['x-forwarded-for'];
  let ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress || '127.0.0.1';
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1';
  }
  const seed = (req.query.seed as string) || req.headers['user-agent'] || 'K-STEM-CLIENT-2026';
  const { deviceToken, macSimulatedId } = generateDeviceTokenAndMac(ip, seed);

  res.json({
    clientIp: ip,
    deviceToken,
    macSimulatedId,
    networkInterface: 'WLAN0 (802.11ax Wi-Fi 6)',
    serverTimestamp: new Date().toISOString(),
  });
});

// 2. Curriculum Units Catalog
app.get('/api/curriculum', (_req: Request, res: Response) => {
  res.json({
    units: CURRICULUM_UNITS,
    totalUnits: CURRICULUM_UNITS.length,
    activeUnitId: 'functions',
  });
});

// 3. Question Bank by Unit & Level
app.get('/api/questions', (req: Request, res: Response) => {
  const unitId = req.query.unitId as string;
  const level = req.query.level ? parseInt(req.query.level as string, 10) : null;

  let questions = [...dynamicQuestions];
  if (unitId) {
    questions = questions.filter((q) => q.unitId === unitId);
  }
  if (level) {
    questions = questions.filter((q) => q.level === level);
  }

  res.json({
    questions,
    total: questions.length,
  });
});

// 4. Submit Assessment & Evaluate
app.post('/api/submissions', (req: Request, res: Response) => {
  const { student, unitId, level, answers, durationSeconds } = req.body;

  if (!student || !student.name) {
    return res.status(400).json({ error: '학습자 정보가 누락되었습니다.' });
  }

  // Build question meta lookup
  const meta: Record<string, { level: number; topic: string }> = {};
  for (const q of dynamicQuestions) {
    meta[q.id] = { level: q.level, topic: q.topic };
  }

  // Calculate scores and competencies
  const evaluation = calculateEvaluation(answers || [], meta);

  const newSubmission: StudentSubmission = {
    id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    student,
    unitId: unitId || 'functions',
    level: level || 'all',
    submittedAt: new Date().toISOString(),
    durationSeconds: durationSeconds || 300,
    answers: answers || [],
    score: evaluation.score,
    totalQuestions: answers?.length || 0,
    percentage: evaluation.percentage,
    competencyScores: evaluation.competencyScores,
    feedbackSummary: evaluation.feedbackSummary,
    prescriptions: evaluation.prescriptions,
  };

  submissionsStore.unshift(newSubmission);

  res.status(201).json({
    submission: newSubmission,
    evaluation,
  });
});

// 5. Teacher Evaluations & Analytics
app.get('/api/evaluations', (req: Request, res: Response) => {
  const unitId = req.query.unitId as string;
  let subs = [...submissionsStore];
  if (unitId) {
    subs = subs.filter((s) => s.unitId === unitId);
  }

  const totalSubmissions = subs.length;
  const totalScore = subs.reduce((acc, s) => acc + s.percentage, 0);
  const averageScore = totalSubmissions > 0 ? Math.round(totalScore / totalSubmissions) : 0;

  // Class breakdown
  const classBreakdown: Record<string, { count: number; avgScore: number; totalScore: number }> = {};
  for (const sub of subs) {
    const key = `${sub.student.grade}학년 ${sub.student.classNum}반`;
    if (!classBreakdown[key]) {
      classBreakdown[key] = { count: 0, avgScore: 0, totalScore: 0 };
    }
    classBreakdown[key].count += 1;
    classBreakdown[key].totalScore += sub.percentage;
  }
  const formattedClassBreakdown: Record<string, { count: number; avgScore: number }> = {};
  for (const [k, v] of Object.entries(classBreakdown)) {
    formattedClassBreakdown[k] = {
      count: v.count,
      avgScore: Math.round(v.totalScore / (v.count || 1)),
    };
  }

  // Device logs
  const deviceLogs = subs.map((s) => ({
    studentKey: `${s.student.grade}-${s.student.classNum}-${s.student.studentNum} ${s.student.name}`,
    clientIp: s.student.clientIp,
    macId: s.student.macSimulatedId,
    submittedAt: s.submittedAt,
    score: s.percentage,
  }));

  const analytics: TeacherAnalytics = {
    totalSubmissions,
    averageScore,
    classBreakdown: formattedClassBreakdown,
    itemAccuracy: {},
    deviceLogs,
  };

  res.json({
    analytics,
    submissions: subs,
  });
});

// 6. Dynamic Question Bank Update (For teacher continuous expansion)
app.post('/api/curriculum/questions', (req: Request, res: Response) => {
  const newQuestion: QuestionItem = req.body;
  if (!newQuestion || !newQuestion.questionText || !newQuestion.choices) {
    return res.status(400).json({ error: '유효한 문항 데이터가 아닙니다.' });
  }

  newQuestion.id = newQuestion.id || `custom-${Date.now()}`;
  dynamicQuestions.push(newQuestion);

  res.status(201).json({
    message: '새 문항이 성공적으로 등록되었습니다.',
    question: newQuestion,
    totalQuestions: dynamicQuestions.length,
  });
});

// --- Vite Dev Middleware or Static File Serving ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[K-STEM Server] Ready on http://localhost:${PORT}`);
  });
}

startServer();
