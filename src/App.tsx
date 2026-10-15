import React, { useState } from 'react';
import { TextbookViewer } from './components/TextbookViewer';
import { FunctionLab } from './components/FunctionLab';
import { PedagogyExplorer } from './components/PedagogyExplorer';
import { HistoryPapersExplorer } from './components/HistoryPapersExplorer';
import { ExamCenter } from './components/ExamCenter';
import { TeacherDashboard } from './components/TeacherDashboard';
import {
  BookOpen,
  Compass,
  Globe,
  History,
  Award,
  Users,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

type NavTab = 'textbook' | 'lab' | 'pedagogy' | 'history' | 'exam' | 'teacher';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('textbook');
  const [textbookTargetPage, setTextbookTargetPage] = useState<number>(1);

  const handleOpenTextbookAt = (page: number = 1) => {
    setTextbookTargetPage(page);
    setActiveTab('textbook');
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      {/* ================= GLOBAL APP HEADER ================= */}
      <header className="sticky top-0 z-40 bg-stone-900/90 backdrop-blur-md border-b border-stone-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-stone-950 font-black text-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              ∑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-stone-100">
                  K-STEM 2026 고교 2학년 수학
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold hidden sm:inline">
                  함수(Functions) 대단원
                </span>
              </div>
              <p className="text-[11px] text-stone-400 hidden sm:block">
                디지털 e-교과서 포맷 • 글로벌 교수법 • 학술 원전 아카이브 • 지능형 수준별 평가
              </p>
            </div>
          </div>

          {/* Navigation Bar */}
          <nav aria-label="메인 내비게이션" className="flex items-center gap-1 overflow-x-auto py-1">
            {[
              { id: 'textbook', label: 'e-교과서', icon: BookOpen },
              { id: 'lab', label: '함수 실험실', icon: Compass },
              { id: 'pedagogy', label: '해외 교수법', icon: Globe },
              { id: 'history', label: '수학자·논문', icon: History },
              { id: 'exam', label: '수준별 평가', icon: Award, highlight: true },
              { id: 'teacher', label: '교사용 콘솔', icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as NavTab)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? tab.highlight
                        ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                        : 'bg-stone-800 text-amber-400 shadow-md ring-1 ring-stone-700'
                      : tab.highlight
                      ? 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/60 border border-amber-700/40'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ================= MAIN CONTENT CONTAINER ================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5">
        {activeTab === 'textbook' && (
          <TextbookViewer
            initialPage={textbookTargetPage}
            onOpenExam={() => setActiveTab('exam')}
            onOpenPedagogy={() => setActiveTab('pedagogy')}
            onOpenHistory={() => setActiveTab('history')}
          />
        )}

        {activeTab === 'lab' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-stone-100 flex items-center gap-2 mb-1">
                <Compass className="w-5 h-5 text-amber-400" />
                공학 도구 활용: GeoGebra 스타일 동적 함수 실험실
              </h2>
              <p className="text-xs text-stone-400 leading-relaxed">
                다양한 원형 함수(Parent Functions)를 선택하고 슬라이더를 조작하여 수평선 판별법(Horizontal Line Test)과
                직선 y = x 대칭 역함수의 거동을 실시간으로 탐색해 보세요.
              </p>
            </div>
            <FunctionLab initialType="quadratic" showTitle={false} />
          </div>
        )}

        {activeTab === 'pedagogy' && <PedagogyExplorer />}

        {activeTab === 'history' && <HistoryPapersExplorer />}

        {activeTab === 'exam' && (
          <ExamCenter onGoToTextbook={(p) => handleOpenTextbookAt(p || 1)} />
        )}

        {activeTab === 'teacher' && <TeacherDashboard />}
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="bg-stone-900 border-t border-stone-800 py-6 text-xs text-stone-400 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-300">
              K-STEM 2026 고등학교 2학년 수학 지능형 교육 플랫폼
            </span>
            <span>•</span>
            <span className="text-stone-400">대단원 Ⅱ. 함수 (Functions)</span>
          </div>

          <div className="flex items-center gap-4 text-stone-400">
            <span>참조 규격: 2026 K-STEM 디지털 교과서</span>
            <span>•</span>
            <span>네트워크 단말기 IP/MAC 비회원 인증 모듈 내장</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
