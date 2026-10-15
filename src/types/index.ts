export type PageViewMode = 'double' | 'single' | 'scroll';

export type UnitId = 'functions' | 'differentiation' | 'exp_log' | 'trigonometry' | 'sequences';

export interface CurriculumUnit {
  id: UnitId;
  name: string;
  grade: string;
  semester: string;
  subtitle: string;
  description: string;
  pageCount: number;
  available: boolean;
  sections: string[];
}

export interface TextbookPage {
  pageNumber: number;
  unitId: UnitId;
  chapterTitle: string;
  sectionTitle: string;
  pageType: 'intro' | 'concept' | 'interactive_lab' | 'example' | 'pedagogy' | 'history' | 'exercise';
  kStemCompetencies: Array<'문제해결' | '추론' | '창의·융합' | '의사소통' | '정보처리' | '태도및실천'>;
  title: string;
  subtitle?: string;
  content: {
    thoughtOpening?: {
      scenario: string;
      question: string;
      hint?: string;
    };
    conceptBox?: {
      definitionName: string;
      mathFormula: string;
      description: string;
      keyPoints: string[];
    };
    bodyParagraphs: string[];
    diagramType?: 'mapping' | 'graph' | 'venn' | 'flow';
    diagramConfig?: Record<string, any>;
    interactiveTool?: 'function_explorer' | 'inverse_explorer' | 'composite_flow' | 'horizontal_line_test';
    exampleProblem?: {
      question: string;
      solutionSteps: string[];
      answer: string;
      practiceProblem: {
        question: string;
        answer: string;
        explanation: string;
      };
    };
    deepThinking?: {
      title: string;
      prompt: string;
      academicLink: string;
    };
  };
}

export type PedagogyFramework = 
  | 'rule_of_four' 
  | 'apos_theory' 
  | 'concept_image_definition' 
  | 'covariational_reasoning' 
  | 'cpa_model'
  | 'realistic_mathematics';

export interface OverseasPedagogy {
  id: PedagogyFramework;
  name: string;
  englishName: string;
  originCountry: string;
  keyProponents: string[];
  corePhilosophy: string;
  applicationToFunctions: {
    stageOrComponent: string;
    description: string;
    classroomExample: string;
    studentMisconceptionFixed: string;
  }[];
  comparativeAnalysis: string;
  recommendedActivity: string;
}

export interface MathematicianPaper {
  id: string;
  era: string;
  year: number;
  mathematician: string;
  englishName: string;
  portraitOrSymbol: string;
  role: string;
  historicalContribution: string;
  definitionAtThatTime: string;
  seminalPaperOrBook: {
    title: string;
    originalTitle: string;
    publishedYear: number;
    keyExcerpt: string;
    excerptKorean: string;
    impactOnCurriculum: string;
  };
  modernSignificance: string;
}

export type QuestionLevel = 1 | 2 | 3 | 4;

export interface QuestionItem {
  id: string;
  unitId: UnitId;
  unitName: string;
  topic: string;
  level: QuestionLevel; // 1: 기초, 2: 기본, 3: 발전, 4: 심화
  levelLabel: string;
  source: string; // e.g., '2024 전국연합학력평가 변형', '수능 기출 심화', 'K-STEM 탐구형'
  questionText: string;
  mathFormula?: string;
  graphSvgType?: 'rational' | 'linear_quadratic' | 'piecewise' | 'inverse_reflection';
  choices: string[];
  correctAnswerIndex: number; // 0-indexed
  hints: string[];
  explanation: {
    stepByStep: string[];
    finalAnswer: string;
    keyConcept: string;
    misconceptionTrap: string;
    pedagogicalPrescription: string; // 해외 교수법 기반 처방
  };
}

export interface StudentInfo {
  grade: number;     // 학년
  classNum: number;  // 반
  studentNum: number;// 번호
  name: string;      // 이름
  deviceId: string;  // 하드웨어/브라우저 식별 토큰
  clientIp: string;  // 서버 감지 IP
  macSimulatedId: string; // MAC 주소 식별자 표기 (예: 7A:B4:9C:2D:11:FE)
}

export interface StudentSubmission {
  id: string;
  student: StudentInfo;
  unitId: UnitId;
  level: QuestionLevel | 'all';
  submittedAt: string;
  durationSeconds: number;
  answers: {
    questionId: string;
    selectedChoice: number;
    isCorrect: boolean;
    timeSpentSeconds: number;
  }[];
  score: number;
  totalQuestions: number;
  percentage: number;
  competencyScores: {
    conceptUnderstanding: number; // 개념 이해력 (0-100)
    algebraicReasoning: number;   // 대수/연산 추론력 (0-100)
    problemSolving: number;       // 종합 문제해결력 (0-100)
    multiRepresentation: number;  // 다중표상 변환력 (0-100)
  };
  feedbackSummary: string;
  prescriptions: string[];
}

export interface TeacherAnalytics {
  totalSubmissions: number;
  averageScore: number;
  classBreakdown: Record<string, { count: number; avgScore: number }>;
  itemAccuracy: Record<string, { correctCount: number; totalCount: number; rate: number }>;
  deviceLogs: Array<{
    studentKey: string;
    clientIp: string;
    macId: string;
    submittedAt: string;
    score: number;
  }>;
}
