import React, { useState, useEffect } from 'react';
import { QuestionItem, StudentInfo, StudentSubmission, QuestionLevel, UnitId } from '../types';
import { QUESTION_BANK } from '../data/questions';
import { CURRICULUM_UNITS } from '../data/curriculumUnits';
import { MathView } from './MathView';
import { calculateEvaluation, generateDeviceTokenAndMac } from '../utils/mathLogic';
import confetti from 'canvas-confetti';
import {
  UserCheck,
  Cpu,
  Wifi,
  Clock,
  Award,
  BarChart3,
  HelpCircle,
  FileCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Printer,
  ChevronRight,
  ChevronLeft,
  Edit3,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface ExamCenterProps {
  onGoToTextbook?: (page?: number) => void;
}

export const ExamCenter: React.FC<ExamCenterProps> = ({ onGoToTextbook }) => {
  // Test Lifecycle: 'setup' | 'testing' | 'result'
  const [phase, setPhase] = useState<'setup' | 'testing' | 'result'>('setup');

  // Student Identification State
  const [student, setStudent] = useState<StudentInfo>({
    grade: 2,
    classNum: 3,
    studentNum: 15,
    name: '',
    deviceId: 'DEV-F89A12BC4401',
    clientIp: '127.0.0.1',
    macSimulatedId: 'F8:9A:12:BC:44:01',
  });

  const [deviceLoading, setDeviceLoading] = useState<boolean>(true);
  const [selectedUnitId, setSelectedUnitId] = useState<UnitId>('functions');
  const [selectedLevel, setSelectedLevel] = useState<QuestionLevel | 'all'>('all');

  // Active Test State
  const [activeQuestions, setActiveQuestions] = useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [questionTimers, setQuestionTimers] = useState<Record<string, number>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [scratchpadText, setScratchpadText] = useState<string>('');
  const [showScratchpad, setShowScratchpad] = useState<boolean>(false);

  // Result State
  const [submissionResult, setSubmissionResult] = useState<StudentSubmission | null>(null);

  // Fetch client device identity on mount (with GitHub Pages fallback)
  useEffect(() => {
    fetch('/api/device/identify')
      .then((res) => {
        if (!res.ok) throw new Error('API unavailable');
        return res.json();
      })
      .then((data) => {
        setStudent((prev) => ({
          ...prev,
          clientIp: data.clientIp || '127.0.0.1',
          deviceId: data.deviceToken || 'DEV-F89A12BC4401',
          macSimulatedId: data.macSimulatedId || 'F8:9A:12:BC:44:01',
        }));
        setDeviceLoading(false);
      })
      .catch(() => {
        // Standalone / GitHub Pages Fallback
        const seed = navigator.userAgent || 'KSTEM-CLIENT-MOBILE';
        const clientIp = '127.0.0.1 (단말 자체 감지)';
        const { deviceToken, macSimulatedId } = generateDeviceTokenAndMac(clientIp, seed);
        setStudent((prev) => ({
          ...prev,
          clientIp,
          deviceId: deviceToken,
          macSimulatedId,
        }));
        setDeviceLoading(false);
      });
  }, []);

  // Timer during testing
  useEffect(() => {
    let interval: any = null;
    if (phase === 'testing') {
      interval = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
        if (activeQuestions[currentIndex]) {
          const qId = activeQuestions[currentIndex].id;
          setQuestionTimers((prev) => ({
            ...prev,
            [qId]: (prev[qId] || 0) + 1,
          }));
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase, currentIndex, activeQuestions]);

  // Start Exam
  const handleStartExam = () => {
    if (!student.name.trim()) {
      alert('학습자의 이름을 입력해 주세요.');
      return;
    }

    // Filter questions by unit and level
    let filtered = QUESTION_BANK.filter((q) => q.unitId === selectedUnitId);
    if (selectedLevel !== 'all') {
      filtered = filtered.filter((q) => q.level === selectedLevel);
    } else {
      // Pick balanced spread for mock exam
      const l1 = filtered.filter((q) => q.level === 1).slice(0, 2);
      const l2 = filtered.filter((q) => q.level === 2).slice(0, 2);
      const l3 = filtered.filter((q) => q.level === 3).slice(0, 2);
      const l4 = filtered.filter((q) => q.level === 4).slice(0, 2);
      filtered = [...l1, ...l2, ...l3, ...l4];
    }

    if (filtered.length === 0) {
      filtered = QUESTION_BANK.filter((q) => q.unitId === 'functions').slice(0, 4);
    }

    setActiveQuestions(filtered);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setQuestionTimers({});
    setElapsedSeconds(0);
    setShowHint(false);
    setScratchpadText('');
    setPhase('testing');
  };

  // Submit Exam
  const handleSubmitExam = async () => {
    const unansweredCount = activeQuestions.filter((q) => selectedAnswers[q.id] === undefined).length;
    if (unansweredCount > 0) {
      const confirmSubmit = window.confirm(
        `아직 풀지 않은 문제가 ${unansweredCount}문항 있습니다. 정말 답안을 제출하고 채점하시겠습니까?`
      );
      if (!confirmSubmit) return;
    }

    const answersPayload = activeQuestions.map((q) => ({
      questionId: q.id,
      selectedChoice: selectedAnswers[q.id] ?? -1,
      isCorrect: selectedAnswers[q.id] === q.correctAnswerIndex,
      timeSpentSeconds: questionTimers[q.id] || 30,
    }));

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student,
          unitId: selectedUnitId,
          level: selectedLevel,
          answers: answersPayload,
          durationSeconds: elapsedSeconds,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissionResult(data.submission);
        setPhase('result');
        if (data.submission.percentage >= 80) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
        return;
      }
    } catch {
      // Backend unavailable (e.g. GitHub Pages static deployment)
    }

    // Client-side Standalone Evaluation (GitHub Pages Fallback)
    const meta: Record<string, { level: number; topic: string }> = {};
    for (const q of QUESTION_BANK) {
      meta[q.id] = { level: q.level, topic: q.topic };
    }
    const evaluation = calculateEvaluation(answersPayload, meta);

    const fallbackSubmission: StudentSubmission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      student,
      unitId: selectedUnitId,
      level: selectedLevel,
      submittedAt: new Date().toISOString(),
      durationSeconds: elapsedSeconds,
      answers: answersPayload,
      score: evaluation.score,
      totalQuestions: answersPayload.length,
      percentage: evaluation.percentage,
      competencyScores: evaluation.competencyScores,
      feedbackSummary: evaluation.feedbackSummary,
      prescriptions: evaluation.prescriptions,
    };

    // Save to localStorage for Teacher Dashboard
    try {
      const existing = JSON.parse(localStorage.getItem('kstem_submissions') || '[]');
      localStorage.setItem('kstem_submissions', JSON.stringify([fallbackSubmission, ...existing]));
    } catch {}

    setSubmissionResult(fallbackSubmission);
    setPhase('result');

    if (fallbackSubmission.percentage >= 80) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* ===================== PHASE 1: SETUP SCREEN ===================== */}
      {phase === 'setup' && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-stone-900 via-amber-950/40 to-stone-900 border border-amber-800/40 rounded-2xl p-6 shadow-xl text-center">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-700/50 inline-block mb-2">
              K-STEM 지능형 수준별 평가 시스템
            </span>
            <h2 className="text-2xl font-extrabold text-stone-100">
              고교 2학년 수학 기출 평가 & 인지 진단 센터
            </h2>
            <p className="mt-2 text-stone-300 text-sm max-w-2xl mx-auto leading-relaxed">
              별도의 번거로운 회원가입 절차 없이, 학년·반·번호와 접속 단말기(IP/MAC) 정보로 학습자를 자동 식별하여
              수준별 기출 문제 풀이 및 4대 역량 진단 평가표를 도출합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left: Student Information Form */}
            <div className="md:col-span-6 bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-lg space-y-4">
              <h3 className="text-base font-bold text-stone-100 flex items-center gap-2 pb-3 border-b border-stone-800">
                <UserCheck className="w-5 h-5 text-amber-400" />
                학습자 정보 입력 (비회원 고유 식별)
              </h3>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1">학년</label>
                  <select
                    value={student.grade}
                    onChange={(e) => setStudent({ ...student, grade: parseInt(e.target.value, 10) })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value={1}>1학년</option>
                    <option value={2}>2학년</option>
                    <option value={3}>3학년</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1">반</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={student.classNum}
                    onChange={(e) => setStudent({ ...student, classNum: parseInt(e.target.value, 10) || 1 })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1">번호</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={student.studentNum}
                    onChange={(e) => setStudent({ ...student, studentNum: parseInt(e.target.value, 10) || 1 })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1">학습자 이름</label>
                <input
                  type="text"
                  placeholder="예: 홍길동"
                  value={student.name}
                  onChange={(e) => setStudent({ ...student, name: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3.5 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500 placeholder:text-stone-600"
                />
              </div>

              {/* Terminal & Network Specs Badge */}
              <div className="bg-stone-950/80 rounded-xl p-3.5 border border-stone-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-stone-400 font-semibold border-b border-stone-800/80 pb-1.5">
                  <span className="flex items-center gap-1.5 text-indigo-400">
                    <Cpu className="w-3.5 h-3.5" />
                    자동 감지 단말기 식별 정보
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> 인증 완료
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">접속 Client IP:</span>
                  <span className="font-mono text-stone-200 font-bold">{student.clientIp}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">단말기 MAC 식별자:</span>
                  <span className="font-mono text-amber-400 font-bold">{student.macSimulatedId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">하드웨어 지문 토큰:</span>
                  <span className="font-mono text-[11px] text-stone-400">{student.deviceId}</span>
                </div>
                <p className="text-[10px] text-stone-400 leading-tight pt-1">
                  ※ 웹 표준 보안상 원시 MAC 직접 추출 대신, 접속 IP와 단말 하드웨어 지문(Device Token)을 결합하여 중복 부정 응시를 방지합니다.
                </p>
              </div>
            </div>

            {/* Right: Unit & Difficulty Level Selector */}
            <div className="md:col-span-6 bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-lg space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-base font-bold text-stone-100 flex items-center gap-2 pb-3 border-b border-stone-800">
                  <Award className="w-5 h-5 text-amber-400" />
                  평가 단원 및 난이도 설정
                </h3>

                {/* Unit Switcher */}
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-2">
                    평가 대상 대단원 (지속 업데이트 지원)
                  </label>
                  <div className="space-y-2">
                    {CURRICULUM_UNITS.map((unit) => (
                      <button
                        key={unit.id}
                        type="button"
                        onClick={() => setSelectedUnitId(unit.id)}
                        className={`w-full p-2.5 rounded-xl text-left text-xs transition-all flex items-center justify-between border ${
                          selectedUnitId === unit.id
                            ? 'bg-amber-950/40 border-amber-500/80 text-amber-200 font-bold'
                            : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
                        }`}
                      >
                        <div>
                          <div className="font-bold">{unit.name}</div>
                          <div className="text-[11px] text-stone-400 mt-0.5">{unit.subtitle}</div>
                        </div>
                        {selectedUnitId === unit.id && <CheckCircle className="w-4 h-4 text-amber-400" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Level Selector */}
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-2">도전 난이도 선택</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'all', label: '전체 모의평가 (8문항)', desc: '기초부터 심화까지 종합' },
                      { id: 1, label: 'Level 1: 기초 확인', desc: '정의, 치역, 기본 판별' },
                      { id: 2, label: 'Level 2: 기본 정복', desc: '일대일대응, 역함수 연산' },
                      { id: 3, label: 'Level 3: 발전 기출', desc: '구간별 함수, 교점 대칭' },
                      { id: 4, label: 'Level 4: 최고난도', desc: '함수방정식, 수리논술' },
                    ].map((lvl) => (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setSelectedLevel(lvl.id as any)}
                        className={`p-2.5 rounded-xl text-left transition-all border ${
                          selectedLevel === lvl.id
                            ? 'bg-amber-500 text-stone-950 font-bold border-amber-400 shadow-md'
                            : 'bg-stone-950 border-stone-800 text-stone-300 hover:bg-stone-800'
                        }`}
                      >
                        <div className="text-xs font-bold">{lvl.label}</div>
                        <div className="text-[10px] opacity-80 mt-0.5">{lvl.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Start Button */}
              <button
                type="button"
                onClick={handleStartExam}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5"
              >
                <span>평가 응시 시작하기</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== PHASE 2: CBT TESTING SCREEN ===================== */}
      {phase === 'testing' && activeQuestions.length > 0 && (
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Top Status Bar: Timer, Question Tracker, Scratchpad toggle */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-stone-200">
                {student.grade}학년 {student.classNum}반 {student.studentNum}번 {student.name}
              </span>
              <span className="text-stone-500">|</span>
              <span className="text-stone-400 font-mono">
                단말: {student.macSimulatedId} ({student.clientIp})
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-950 border border-stone-800 font-mono text-amber-400 font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>소요시간 {formatTime(elapsedSeconds)}</span>
              </div>
              <button
                onClick={() => setShowScratchpad(!showScratchpad)}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg border transition-colors ${
                  showScratchpad
                    ? 'bg-amber-500 text-stone-950 font-bold border-amber-400'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>연습장 {showScratchpad ? '닫기' : '열기'}</span>
              </button>
            </div>
          </div>

          {/* Question Navigator Pills */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-3 flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-stone-400 mr-2">문항 선택:</span>
            {activeQuestions.map((q, idx) => {
              const isAnswered = selectedAnswers[q.id] !== undefined;
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setShowHint(false);
                  }}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                    isCurrent
                      ? 'bg-amber-500 text-stone-950 ring-2 ring-amber-300'
                      : isAnswered
                      ? 'bg-indigo-600 text-white'
                      : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Scratchpad (Collapsible) */}
          {showScratchpad && (
            <div className="bg-stone-950 border border-amber-800/50 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
                <span>자유 풀이 메모장 (Scratchpad)</span>
                <span className="text-stone-500">계산 및 풀이 과정을 자유롭게 메모하세요.</span>
              </div>
              <textarea
                value={scratchpadText}
                onChange={(e) => setScratchpadText(e.target.value)}
                placeholder="여기에 풀이 과정이나 중간 연산값을 메모하세요..."
                rows={3}
                className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          )}

          {/* Main Question Card */}
          {activeQuestions[currentIndex] && (
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-5">
              {/* Question Header */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-stone-950 font-black text-sm">
                    Q{currentIndex + 1}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 border border-stone-700">
                    {activeQuestions[currentIndex].levelLabel}
                  </span>
                  <span className="text-xs text-stone-400">{activeQuestions[currentIndex].source}</span>
                </div>
                <span className="text-xs text-indigo-300 font-medium">
                  {activeQuestions[currentIndex].topic}
                </span>
              </div>

              {/* Question Text & Formula */}
              <div className="text-stone-100 text-sm leading-relaxed whitespace-pre-line font-medium">
                {activeQuestions[currentIndex].questionText}
              </div>

              {/* Multiple Choices */}
              <div className="space-y-2.5 pt-2">
                {activeQuestions[currentIndex].choices.map((choice, cIdx) => {
                  const isSelected = selectedAnswers[activeQuestions[currentIndex].id] === cIdx;
                  return (
                    <button
                      key={cIdx}
                      onClick={() =>
                        setSelectedAnswers({
                          ...selectedAnswers,
                          [activeQuestions[currentIndex].id]: cIdx,
                        })
                      }
                      className={`w-full p-3.5 rounded-xl text-left text-xs transition-all flex items-center gap-3 border ${
                        isSelected
                          ? 'bg-amber-950/60 border-amber-500 text-amber-200 font-bold shadow-md'
                          : 'bg-stone-950 border-stone-800 text-stone-300 hover:bg-stone-800/80 hover:border-stone-700'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected
                            ? 'bg-amber-500 text-stone-950'
                            : 'bg-stone-800 text-stone-400'
                        }`}
                      >
                        {cIdx + 1}
                      </span>
                      <span className="flex-1 leading-snug">{choice}</span>
                    </button>
                  );
                })}
              </div>

              {/* Hint Accordion */}
              <div className="pt-2">
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="text-xs text-stone-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>단계별 힌트 {showHint ? '접기' : '보기'}</span>
                </button>
                {showHint && (
                  <div className="mt-2.5 p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200/90 space-y-1">
                    {activeQuestions[currentIndex].hints.map((hint, hIdx) => (
                      <p key={hIdx} className="leading-relaxed">
                        • {hint}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Nav: Prev, Next, Submit */}
              <div className="flex items-center justify-between pt-4 border-t border-stone-800">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => {
                    setCurrentIndex((i) => Math.max(0, i - 1));
                    setShowHint(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-300 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> 이전 문제
                </button>

                <div className="flex items-center gap-3">
                  {currentIndex < activeQuestions.length - 1 ? (
                    <button
                      onClick={() => {
                        setCurrentIndex((i) => i + 1);
                        setShowHint(false);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center gap-1"
                    >
                      다음 문제 <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitExam}
                      className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
                    >
                      <FileCheck className="w-4 h-4" /> 답안 제출 및 채점
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== PHASE 3: DIAGNOSTIC EVALUATION REPORT ===================== */}
      {phase === 'result' && submissionResult && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Diagnostic Header Stamp */}
          <div className="bg-gradient-to-r from-stone-900 via-indigo-950/60 to-stone-900 border border-indigo-700/50 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-indigo-800/40">
              <div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 inline-flex items-center gap-1 mb-2">
                  <CheckCircle className="w-3.5 h-3.5" /> 자동 채점 및 종합 진단 완료
                </span>
                <h2 className="text-2xl font-black text-stone-100">
                  {submissionResult.student.grade}학년 {submissionResult.student.classNum}반 {submissionResult.student.studentNum}번 {submissionResult.student.name} 학습 진단서
                </h2>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-stone-400 font-mono">
                  <span>접속 단말기: {submissionResult.student.macSimulatedId}</span>
                  <span>IP: {submissionResult.student.clientIp}</span>
                  <span>응시일시: {new Date(submissionResult.submittedAt).toLocaleString('ko-KR')}</span>
                </div>
              </div>

              {/* Total Score Circle */}
              <div className="text-center px-5 py-3 rounded-2xl bg-stone-950/90 border border-amber-500/40 shadow-inner">
                <span className="text-xs text-stone-400 font-semibold block">종합 성취 점수</span>
                <span className="text-3xl font-black text-amber-400 font-mono">
                  {submissionResult.percentage}
                  <span className="text-sm text-stone-400 font-normal"> / 100점</span>
                </span>
              </div>
            </div>

            {/* Feedback Summary */}
            <div className="mt-4 p-3.5 rounded-xl bg-stone-950/80 border border-stone-800">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                학습 성취 진단 총평
              </span>
              <p className="text-xs text-stone-200 leading-relaxed font-sans">
                {submissionResult.feedbackSummary}
              </p>
            </div>
          </div>

          {/* K-STEM 4 Core Competency Breakdown */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              K-STEM 4대 핵심 수학 역량 분석표
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  label: '개념 이해력 (Concept Understanding)',
                  score: submissionResult.competencyScores.conceptUnderstanding,
                  desc: '정의역·공역·치역의 집합론적 엄밀화 및 함수의 성립 요건',
                  color: 'bg-blue-500',
                },
                {
                  label: '대수/연산 추론력 (Algebraic Reasoning)',
                  score: submissionResult.competencyScores.algebraicReasoning,
                  desc: '합성함수 결합법칙, 역함수 공식 계산 및 미지계수 연립',
                  color: 'bg-amber-500',
                },
                {
                  label: '복합 문제 해결력 (Problem Solving)',
                  score: submissionResult.competencyScores.problemSolving,
                  desc: '구간별 정의 함수, 절댓값 꺾은선 및 미분 융합 추론',
                  color: 'bg-emerald-500',
                },
                {
                  label: '다중 표상 변환력 (Multi-Representation)',
                  score: submissionResult.competencyScores.multiRepresentation,
                  desc: 'Rule of Four(식 ↔ 그래프 ↔ 표 ↔ 언어) 상호 전환 유연성',
                  color: 'bg-purple-500',
                },
              ].map((comp, idx) => (
                <div key={idx} className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-stone-300">{comp.label}</span>
                    <span className="font-mono font-bold text-amber-400">{comp.score}점</span>
                  </div>
                  <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${comp.color} rounded-full transition-all duration-700`}
                      style={{ width: `${comp.score}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-stone-500">{comp.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Overseas Pedagogical Prescription Box */}
          <div className="bg-stone-900 border border-amber-900/40 rounded-2xl p-6 shadow-lg space-y-3">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              해외 수학교육학 기반 개인 맞춤형 처방전 (Pedagogical Prescriptions)
            </h3>
            <div className="space-y-2">
              {submissionResult.prescriptions.map((presc, pIdx) => (
                <div
                  key={pIdx}
                  className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/30 text-xs text-amber-100 leading-relaxed font-sans"
                >
                  {presc}
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Question Review List */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-stone-100 flex items-center justify-between">
              <span>문항별 정답 및 오답 상세 풀이 해설</span>
              <span className="text-xs text-stone-400 font-normal">
                정답: {submissionResult.answers.filter((a) => a.isCorrect).length} / {submissionResult.answers.length}문항
              </span>
            </h3>

            <div className="space-y-4">
              {submissionResult.answers.map((ans, aIdx) => {
                const q = activeQuestions.find((item) => item.id === ans.questionId);
                if (!q) return null;
                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-xl border text-xs space-y-3 ${
                      ans.isCorrect
                        ? 'bg-stone-950/80 border-emerald-900/50'
                        : 'bg-stone-950/80 border-rose-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                            ans.isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                          }`}
                        >
                          {aIdx + 1}
                        </span>
                        <span className="font-bold text-stone-200">{q.topic}</span>
                        <span className="text-[10px] text-stone-500">({q.levelLabel})</span>
                      </div>
                      <span
                        className={`font-semibold flex items-center gap-1 ${
                          ans.isCorrect ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {ans.isCorrect ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {ans.isCorrect ? '정답' : '오답'}
                      </span>
                    </div>

                    <div className="text-stone-300 leading-relaxed whitespace-pre-line">
                      {q.questionText}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 bg-stone-900/90 p-2.5 rounded-lg text-[11px]">
                      <span>
                        <strong className="text-stone-400">학습자 선택: </strong>
                        <span className={ans.isCorrect ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {ans.selectedChoice >= 0 ? `${ans.selectedChoice + 1}번` : '미응답'}
                        </span>
                      </span>
                      <span>
                        <strong className="text-stone-400">정답: </strong>
                        <span className="text-emerald-400 font-bold">{q.correctAnswerIndex + 1}번</span>
                      </span>
                      <span>
                        <strong className="text-stone-400">소요 시간: </strong>
                        <span className="font-mono text-stone-300">{ans.timeSpentSeconds}초</span>
                      </span>
                    </div>

                    {/* Step-by-Step Explanation */}
                    <div className="bg-stone-900/60 p-3 rounded-lg border border-stone-800/80 space-y-1.5 text-[11px]">
                      <span className="font-bold text-amber-400 block">단계별 해설 및 정답 유도:</span>
                      {q.explanation.stepByStep.map((step, sIdx) => (
                        <p key={sIdx} className="text-stone-300">
                          {step}
                        </p>
                      ))}
                      <div className="pt-1.5 border-t border-stone-800 text-rose-300">
                        <strong>오개념 함정(Misconception Trap): </strong> {q.explanation.misconceptionTrap}
                      </div>
                      <div className="text-indigo-300">
                        <strong>해외 교수법 처방: </strong> {q.explanation.pedagogicalPrescription}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons: Retest, Print, Textbook Link */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={() => {
                setPhase('setup');
                setSubmissionResult(null);
              }}
              className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> 다른 단원/난이도로 재응시
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> 성적표 인쇄 / PDF 저장
              </button>
              {onGoToTextbook && (
                <button
                  onClick={() => onGoToTextbook(1)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-extrabold flex items-center gap-1.5"
                >
                  교과서 본문으로 돌아가기 <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
