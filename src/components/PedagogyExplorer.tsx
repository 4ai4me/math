import React, { useState } from 'react';
import { OVERSEAS_PEDAGOGIES } from '../data/pedagogies';
import { PedagogyFramework, OverseasPedagogy } from '../types';
import { MathView } from './MathView';
import { Globe, BookOpen, Layers, Lightbulb, CheckCircle2, ArrowRight, Sparkles, HelpCircle } from 'lucide-react';

export const PedagogyExplorer: React.FC = () => {
  const [selectedPedagogyId, setSelectedPedagogyId] = useState<PedagogyFramework>('rule_of_four');
  const [activeSquareTab, setActiveSquareTab] = useState<'verbal' | 'numerical' | 'graphical' | 'algebraic'>('verbal');

  const selectedPedagogy: OverseasPedagogy =
    OVERSEAS_PEDAGOGIES.find((p) => p.id === selectedPedagogyId) || OVERSEAS_PEDAGOGIES[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-indigo-950/70 to-stone-900 border border-indigo-800/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="flex items-center gap-2.5 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
          <Globe className="w-4 h-4" />
          <span>Global Mathematics Didactics & Research</span>
        </div>
        <h2 className="text-2xl font-extrabold text-stone-100">
          해외 수학교육계의 함수 교수법(Pedagogies) 심층 탐구
        </h2>
        <p className="mt-2 text-stone-300 text-sm max-w-3xl leading-relaxed">
          미국 NCTM, 하버드 대학 미적분학 컨소시엄, 피아제 구성주의 기반 APOS 이론, 영국 Tall & Vinner의 개념 심상론,
          싱가포르의 CPA 단계 지도법 등 세계 주요 선진 수학교육 모델이 함수를 어떻게 가르치는지 비교 분석합니다.
        </p>

        {/* Framework Selector Pills */}
        <div className="mt-5 flex flex-wrap gap-2">
          {OVERSEAS_PEDAGOGIES.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPedagogyId(p.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                selectedPedagogyId === p.id
                  ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400/50'
                  : 'bg-stone-800/80 hover:bg-stone-700/80 text-stone-300'
              }`}
            >
              <span>{p.name.split(' (')[0]}</span>
              <span className="text-[10px] opacity-75">({p.originCountry.split(' (')[0]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Pedagogy Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Core Philosophy & Theoretical Structure */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-800">
              <div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                  {selectedPedagogy.originCountry}
                </span>
                <h3 className="text-lg font-bold text-stone-100 mt-2">{selectedPedagogy.name}</h3>
                <p className="text-xs text-indigo-300/80 font-mono mt-0.5">{selectedPedagogy.englishName}</p>
              </div>
              <div className="text-right text-xs text-stone-400">
                <span className="block font-semibold text-stone-300">주요 학자 / 연구진</span>
                {selectedPedagogy.keyProponents.map((pro, i) => (
                  <span key={i} className="block text-stone-400">
                    {pro}
                  </span>
                ))}
              </div>
            </div>

            {/* Core Philosophy */}
            <div className="mt-4 bg-stone-950/70 rounded-xl p-4 border border-stone-800">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                교수학적 핵심 철학 (Core Philosophy)
              </h4>
              <p className="text-xs text-stone-300 leading-relaxed">{selectedPedagogy.corePhilosophy}</p>
            </div>

            {/* Application to High School Functions */}
            <div className="mt-5">
              <h4 className="text-xs font-bold text-stone-200 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                <Layers className="w-4 h-4 text-indigo-400" />
                고등학교 2학년 함수 단원 적용 단계 & 오개념 처방
              </h4>

              <div className="space-y-3">
                {selectedPedagogy.applicationToFunctions.map((app, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 hover:border-indigo-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-300 mb-1">
                      <span>{app.stageOrComponent}</span>
                      <span className="text-[10px] text-stone-500">Step {idx + 1}</span>
                    </div>
                    <p className="text-xs text-stone-300 mb-2">{app.description}</p>
                    <div className="bg-stone-900/90 rounded-lg p-2.5 text-[11px] space-y-1.5 border border-stone-800/80">
                      <div className="text-emerald-400">
                        <strong className="text-emerald-300 font-semibold">교실 수업 예시: </strong>
                        {app.classroomExample}
                      </div>
                      <div className="text-rose-400">
                        <strong className="text-rose-300 font-semibold">해소되는 학생 오개념: </strong>
                        {app.studentMisconceptionFixed}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparative Analysis */}
            <div className="mt-5 pt-4 border-t border-stone-800 text-xs text-stone-400 space-y-2">
              <div className="flex items-start gap-2">
                <span className="font-bold text-stone-300 shrink-0">한국 교육과정과의 비교:</span>
                <span className="text-stone-300">{selectedPedagogy.comparativeAnalysis}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-amber-400 shrink-0">추천 수업 액티비티:</span>
                <span className="text-amber-200/90">{selectedPedagogy.recommendedActivity}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Interactive Rule of Four Studio & Concept Image Simulator */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                하버드 Rule of Four 다중 표상 실습기
              </h3>
              <span className="text-[10px] text-stone-400">함수: f(x) = 2x - 3</span>
            </div>

            <p className="text-xs text-stone-400 mt-2">
              하나의 수학적 함수가 4가지 표상 체계(Verbal, Numerical, Graphical, Algebraic)로 어떻게 번역되는지 직접 확인해보세요.
            </p>

            {/* 4 Tabs */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                { id: 'verbal', label: '1. 언어적 (Verbal)' },
                { id: 'numerical', label: '2. 수치적 (Table)' },
                { id: 'graphical', label: '3. 시각적 (Graph)' },
                { id: 'algebraic', label: '4. 대수적 (Formula)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSquareTab(tab.id as any)}
                  className={`p-2 rounded-lg text-xs font-medium text-left transition-all ${
                    activeSquareTab === tab.id
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                      : 'bg-stone-950 text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Display Area for Active Representation */}
            <div className="mt-4 bg-stone-950 p-4 rounded-xl border border-stone-800 min-h-[220px] flex flex-col justify-center">
              {activeSquareTab === 'verbal' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <span>자연어 맥락 묘사</span>
                  </div>
                  <blockquote className="p-3 rounded-lg bg-stone-900 border-l-4 border-amber-500 text-stone-200 italic leading-relaxed">
                    "주차장에 차를 주차할 때, 기본요금 3000원이 할인되고 1시간마다 2000원씩 요금이 부과된다. 이때 총 주차비는 주차 시간 x의 일차함수 관계를 갖는다."
                  </blockquote>
                  <p className="text-stone-400 text-[11px]">
                    ★ 학생에게 식을 외우게 하기 전, 실세계의 원인(시간 x)과 결과(비용 y)의 인과성을 언어로 기술하게 함으로써 수학의 추상성을 탈피시킵니다.
                  </p>
                </div>
              )}

              {activeSquareTab === 'numerical' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between text-amber-400 font-bold">
                    <span>수치 데이터 테이블</span>
                    <span className="text-[10px] text-stone-400">Δx = 1 ➔ Δy = +2</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse text-xs">
                      <thead>
                        <tr className="bg-stone-900 text-stone-400 border-b border-stone-800">
                          <th className="py-1.5 px-2">x (입력)</th>
                          <th className="py-1.5 px-2">-1</th>
                          <th className="py-1.5 px-2">0</th>
                          <th className="py-1.5 px-2">1</th>
                          <th className="py-1.5 px-2">2</th>
                          <th className="py-1.5 px-2">3</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-stone-200">
                          <td className="py-1.5 px-2 font-bold text-amber-400">y (출력)</td>
                          <td className="py-1.5 px-2">-5</td>
                          <td className="py-1.5 px-2">-3</td>
                          <td className="py-1.5 px-2">-1</td>
                          <td className="py-1.5 px-2">1</td>
                          <td className="py-1.5 px-2">3</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-stone-400 text-[11px]">
                    ★ 모든 y값이 중복 없이 2씩 일정하게 증가함을 관찰하여 일대일함수(Injective)임을 수치적으로 직접 확인합니다.
                  </p>
                </div>
              )}

              {activeSquareTab === 'graphical' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between text-amber-400 font-bold">
                    <span>좌표평면 시각 기하학</span>
                    <span className="text-[10px] text-stone-400">기울기 2, y절편 -3</span>
                  </div>
                  <div className="h-32 bg-stone-900 rounded-lg flex items-center justify-center border border-stone-800 relative overflow-hidden">
                    <svg viewBox="0 0 200 100" className="w-full h-full">
                      {/* Axes */}
                      <line x1="10" y1="50" x2="190" y2="50" stroke="#57534e" strokeWidth="1" />
                      <line x1="100" y1="10" x2="100" y2="90" stroke="#57534e" strokeWidth="1" />
                      {/* Line y = 2x - 3 */}
                      <line x1="40" y1="90" x2="140" y2="10" stroke="#f59e0b" strokeWidth="2.5" />
                      {/* Horizontal test line */}
                      <line x1="10" y1="35" x2="190" y2="35" stroke="#ec4899" strokeWidth="1" strokeDasharray="3 3" />
                      <circle cx="115" cy="35" r="3.5" fill="#ec4899" stroke="#fff" />
                    </svg>
                  </div>
                  <p className="text-stone-400 text-[11px]">
                    ★ 수직선 판별법(오직 한 점에서 만남 ➔ 함수)과 수평선 판별법(오직 한 점에서 만남 ➔ 일대일대응 ➔ 역함수 존재)을 동시에 검증합니다.
                  </p>
                </div>
              )}

              {activeSquareTab === 'algebraic' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between text-amber-400 font-bold">
                    <span>대수적 기호 체계 & 역함수 연산</span>
                  </div>
                  <div className="p-3 bg-stone-900 rounded-lg border border-stone-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400">원래 함수:</span>
                      <MathView math="f(x) = 2x - 3" className="text-amber-300 font-bold" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400">역함수 변환:</span>
                      <MathView math="x = \frac{y + 3}{2} \implies f^{-1}(x) = \frac{1}{2}x + \frac{3}{2}" className="text-purple-300 font-mono text-xs" />
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-800">
                      <span className="text-stone-400">합성 확인:</span>
                      <MathView math="(f^{-1} \circ f)(x) = x" className="text-emerald-400 font-mono" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cognitive Conflict Note */}
            <div className="mt-4 p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs">
              <span className="font-bold text-indigo-300 flex items-center gap-1 mb-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                Tall & Vinner의 오개념 교정 팁
              </span>
              <p className="text-stone-300 text-[11px] leading-relaxed">
                학생들이 "공식만 외우고 그래프를 못 그린다"거나 "그래프는 보는데 수식으로 못 푼다"는 현상은
                표상 간의 단절 때문입니다. 4분할 시트를 통해 각 표상을 자유자재로 넘나드는 훈련이 수능 고난도 문제해결의 열쇠입니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
