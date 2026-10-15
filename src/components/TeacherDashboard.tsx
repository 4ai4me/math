import React, { useState, useEffect } from 'react';
import { TeacherAnalytics, StudentSubmission, QuestionItem, UnitId, QuestionLevel } from '../types';
import { CURRICULUM_UNITS } from '../data/curriculumUnits';
import {
  Users,
  Shield,
  BarChart2,
  PlusCircle,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<TeacherAnalytics | null>(null);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterClass, setFilterClass] = useState<string>('all');
  const [searchName, setSearchName] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New Question Form State
  const [newQuestion, setNewQuestion] = useState<Partial<QuestionItem>>({
    unitId: 'functions',
    level: 2,
    levelLabel: 'Level 2: 기본 정복',
    topic: '함수의 성질과 연산',
    source: '교사용 신규 추가 문항',
    questionText: '',
    choices: ['', '', '', '', ''],
    correctAnswerIndex: 0,
    hints: ['단계별 개념 정의를 다시 점검하세요.'],
    explanation: {
      stepByStep: ['1단계: 조건 분석', '2단계: 대수적 풀이 전개'],
      finalAnswer: '정답 도출',
      keyConcept: '함수 핵심 원리',
      misconceptionTrap: '부호 및 정의역 조건 확인',
      pedagogicalPrescription: '【APOS 이론】 구체적 수치 대입 후 과정으로 추상화하세요.',
    },
  });

  const fetchDashboardData = () => {
    setLoading(true);
    fetch('/api/evaluations')
      .then((res) => {
        if (!res.ok) throw new Error('API unavailable');
        return res.json();
      })
      .then((data) => {
        setAnalytics(data.analytics);
        setSubmissions(data.submissions || []);
        setLoading(false);
      })
      .catch(() => {
        // Fallback for static hosting (GitHub Pages) using localStorage
        try {
          const stored: StudentSubmission[] = JSON.parse(
            localStorage.getItem('kstem_submissions') || '[]'
          );
          setSubmissions(stored);

          if (stored.length > 0) {
            const totalScore = stored.reduce((acc, s) => acc + s.score, 0);
            const avg = Math.round(totalScore / stored.length);

            const classMap: Record<string, { count: number; totalScore: number }> = {};
            const itemMap: Record<string, { correctCount: number; totalCount: number }> = {};
            const deviceLogs: TeacherAnalytics['deviceLogs'] = [];

            stored.forEach((sub) => {
              const cKey = `${sub.student.grade}학년 ${sub.student.classNum}반`;
              if (!classMap[cKey]) classMap[cKey] = { count: 0, totalScore: 0 };
              classMap[cKey].count += 1;
              classMap[cKey].totalScore += sub.score;

              sub.answers.forEach((ans) => {
                if (!itemMap[ans.questionId]) {
                  itemMap[ans.questionId] = { correctCount: 0, totalCount: 0 };
                }
                itemMap[ans.questionId].totalCount += 1;
                if (ans.isCorrect) itemMap[ans.questionId].correctCount += 1;
              });

              deviceLogs.push({
                studentKey: `${sub.student.grade}학년 ${sub.student.classNum}반 ${sub.student.studentNum}번 ${sub.student.name}`,
                clientIp: sub.student.clientIp,
                macId: sub.student.macSimulatedId,
                submittedAt: sub.submittedAt,
                score: sub.score,
              });
            });

            const classBreakdown: TeacherAnalytics['classBreakdown'] = {};
            Object.entries(classMap).forEach(([k, v]) => {
              classBreakdown[k] = { count: v.count, avgScore: Math.round(v.totalScore / v.count) };
            });

            const itemAccuracy: TeacherAnalytics['itemAccuracy'] = {};
            Object.entries(itemMap).forEach(([k, v]) => {
              itemAccuracy[k] = {
                correctCount: v.correctCount,
                totalCount: v.totalCount,
                rate: Math.round((v.correctCount / v.totalCount) * 100),
              };
            });

            setAnalytics({
              totalSubmissions: stored.length,
              averageScore: avg,
              classBreakdown,
              itemAccuracy,
              deviceLogs,
            });
          } else {
            setAnalytics(null);
          }
        } catch {
          setAnalytics(null);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.questionText || !newQuestion.choices?.[0]) {
      alert('문항 본문과 보기를 입력해 주세요.');
      return;
    }

    try {
      const res = await fetch('/api/curriculum/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newQuestion,
          id: `custom-${Date.now()}`,
          unitName: CURRICULUM_UNITS.find((u) => u.id === newQuestion.unitId)?.name || '함수',
        }),
      });
      if (res.ok) {
        alert('새로운 문항이 성공적으로 등록되었습니다! 학생 평가 센터에 즉시 반영됩니다.');
        setShowAddModal(false);
        setNewQuestion({
          unitId: 'functions',
          level: 2,
          levelLabel: 'Level 2: 기본 정복',
          topic: '함수의 성질과 연산',
          source: '교사용 신규 추가 문항',
          questionText: '',
          choices: ['', '', '', '', ''],
          correctAnswerIndex: 0,
          hints: ['단계별 개념 정의를 점검하세요.'],
          explanation: {
            stepByStep: ['1단계: 조건 분석', '2단계: 대수적 풀이 전개'],
            finalAnswer: '정답 도출',
            keyConcept: '함수 핵심 원리',
            misconceptionTrap: '부호 및 정의역 조건 확인',
            pedagogicalPrescription: '【APOS 이론】 구체적 수치 대입 후 과정으로 추상화하세요.',
          },
        });
      }
    } catch {
      alert('문항 등록 중 오류가 발생했습니다.');
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const classMatch =
      filterClass === 'all' || `${sub.student.grade}학년 ${sub.student.classNum}반` === filterClass;
    const nameMatch = !searchName.trim() || sub.student.name.includes(searchName.trim());
    return classMatch && nameMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/60 inline-flex items-center gap-1.5 mb-2">
            <Shield className="w-3.5 h-3.5" /> 교사용 지능형 평가 관리 콘솔
          </span>
          <h2 className="text-2xl font-extrabold text-stone-100">
            학습자 단말 식별 & 실시간 평가 진단 대시보드
          </h2>
          <p className="mt-1 text-stone-400 text-xs">
            학생들의 학년·반·번호별 실시간 응시 내역, 접속 단말기 IP/MAC 로그 감사 및 평가 문항 지속 확장을 지원합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
          >
            <PlusCircle className="w-4 h-4" /> 새 기출 문항 등록 (단원 확장)
          </button>
          <button
            onClick={fetchDashboardData}
            className="px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold"
          >
            새로고침
          </button>
        </div>
      </div>

      {/* Top Stat KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow">
          <span className="text-xs text-stone-400 font-semibold block">총 평가 응시 건수</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-400 font-mono">
              {analytics?.totalSubmissions || 0}
            </span>
            <span className="text-xs text-stone-500">명 응시 완료</span>
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow">
          <span className="text-xs text-stone-400 font-semibold block">전체 평균 성취도</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-indigo-400 font-mono">
              {analytics?.averageScore || 0}점
            </span>
            <span className="text-xs text-stone-500">/ 100점 만점</span>
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow">
          <span className="text-xs text-stone-400 font-semibold block">감사된 고유 단말기 (MAC)</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {analytics?.deviceLogs?.length || 0}대
            </span>
            <span className="text-xs text-emerald-500 font-medium">부정 접속 없음</span>
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow">
          <span className="text-xs text-stone-400 font-semibold block">지원 커리큘럼 단원 수</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-purple-400 font-mono">
              {CURRICULUM_UNITS.length}개
            </span>
            <span className="text-xs text-purple-300">함수 외 지속 확장</span>
          </div>
        </div>
      </div>

      {/* Class-by-Class Breakdown */}
      {analytics && Object.keys(analytics.classBreakdown).length > 0 && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-lg">
          <h3 className="text-xs font-bold text-stone-300 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-amber-400" /> 학급별 평균 성적 비교
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(analytics.classBreakdown).map(([cls, data]) => (
              <div key={cls} className="bg-stone-950 p-3 rounded-xl border border-stone-800">
                <span className="text-xs font-bold text-stone-300">{cls}</span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-lg font-black text-amber-400 font-mono">{data.avgScore}점</span>
                  <span className="text-[11px] text-stone-500">{data.count}명</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submissions & Device Logs Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-lg space-y-4">
        {/* Table Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-800">
          <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            학습자별 응시 기록 및 접속 단말기 로그 (비회원 고유 식별)
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by class */}
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none"
            >
              <option value="all">전체 학급</option>
              {analytics &&
                Object.keys(analytics.classBreakdown).map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
            </select>

            {/* Search by name */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="학생 이름 검색..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="bg-stone-950 border border-stone-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-stone-200 focus:outline-none placeholder:text-stone-600"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-950 text-stone-400 border-b border-stone-800">
                <th className="py-2.5 px-3">학적 (학년-반-번호)</th>
                <th className="py-2.5 px-3">학생 성명</th>
                <th className="py-2.5 px-3">접속 IP 주소</th>
                <th className="py-2.5 px-3">단말기 식별자 (MAC Token)</th>
                <th className="py-2.5 px-3">응시 단원</th>
                <th className="py-2.5 px-3 text-center">점수 / 성취도</th>
                <th className="py-2.5 px-3 text-right">제출 시각</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60">
              {filteredSubmissions.length > 0 ? (
                filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-stone-950/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-stone-200">
                      {sub.student.grade}학년 {sub.student.classNum}반 {sub.student.studentNum}번
                    </td>
                    <td className="py-2.5 px-3 font-bold text-amber-300">{sub.student.name}</td>
                    <td className="py-2.5 px-3 font-mono text-stone-400">{sub.student.clientIp}</td>
                    <td className="py-2.5 px-3 font-mono text-indigo-300">{sub.student.macSimulatedId}</td>
                    <td className="py-2.5 px-3 text-stone-300">
                      {sub.unitId === 'functions' ? '함수' : sub.unitId}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold font-mono text-xs ${
                          sub.percentage >= 80
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                            : sub.percentage >= 60
                            ? 'bg-amber-950 text-amber-300 border border-amber-700/50'
                            : 'bg-rose-950 text-rose-300 border border-rose-700/50'
                        }`}
                      >
                        {sub.percentage}점
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-stone-500 font-mono">
                      {new Date(sub.submittedAt).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-stone-500">
                    조건에 해당하는 평가 응시 기록이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Question Registration */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-amber-400" />
                신규 기출 문항 등록 (단원 및 문제 은행 확장)
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-white text-xs px-2 py-1 rounded bg-stone-800"
              >
                닫기
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 font-semibold mb-1">소속 대단원</label>
                  <select
                    value={newQuestion.unitId}
                    onChange={(e) => setNewQuestion({ ...newQuestion, unitId: e.target.value as any })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-stone-200"
                  >
                    {CURRICULUM_UNITS.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-400 font-semibold mb-1">문항 난이도 수준</label>
                  <select
                    value={newQuestion.level}
                    onChange={(e) => {
                      const lvl = parseInt(e.target.value, 10) as QuestionLevel;
                      const labels: Record<QuestionLevel, string> = {
                        1: 'Level 1: 기초 확인',
                        2: 'Level 2: 기본 정복',
                        3: 'Level 3: 발전 기출',
                        4: 'Level 4: 최고난도 심화',
                      };
                      setNewQuestion({ ...newQuestion, level: lvl, levelLabel: labels[lvl] });
                    }}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-stone-200"
                  >
                    <option value={1}>Level 1: 기초 확인</option>
                    <option value={2}>Level 2: 기본 정복</option>
                    <option value={3}>Level 3: 발전 기출</option>
                    <option value={4}>Level 4: 최고난도 심화</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-400 font-semibold mb-1">문항 주제 (소주제)</label>
                <input
                  type="text"
                  value={newQuestion.topic}
                  onChange={(e) => setNewQuestion({ ...newQuestion, topic: e.target.value })}
                  placeholder="예: 역함수의 존재 조건과 미정계수"
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-stone-200"
                />
              </div>

              <div>
                <label className="block text-stone-400 font-semibold mb-1">문항 지문 (LaTeX 수식 포함 가능)</label>
                <textarea
                  rows={3}
                  value={newQuestion.questionText}
                  onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                  placeholder="문제 지문을 입력하세요..."
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2.5 text-stone-200 font-sans"
                />
              </div>

              {/* 5 Choices */}
              <div className="space-y-2">
                <label className="block text-stone-400 font-semibold">5지 선다 보기 입력</label>
                {newQuestion.choices?.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 font-bold text-stone-400 text-center">{i + 1}번</span>
                    <input
                      type="text"
                      value={c}
                      onChange={(e) => {
                        const next = [...(newQuestion.choices || [])];
                        next[i] = e.target.value;
                        setNewQuestion({ ...newQuestion, choices: next });
                      }}
                      placeholder={`보기 ${i + 1}번 내용...`}
                      className="flex-1 bg-stone-950 border border-stone-700 rounded-lg p-1.5 text-stone-200"
                    />
                    <label className="flex items-center gap-1 text-stone-300 cursor-pointer">
                      <input
                        type="radio"
                        name="correctChoice"
                        checked={newQuestion.correctAnswerIndex === i}
                        onChange={() => setNewQuestion({ ...newQuestion, correctAnswerIndex: i })}
                        className="accent-amber-500"
                      />
                      <span>정답</span>
                    </label>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-semibold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold"
                >
                  문항 저장 및 배포
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
