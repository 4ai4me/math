import React, { useState } from 'react';
import { MATHEMATICIANS_PAPERS } from '../data/mathematicians';
import { MathematicianPaper } from '../types';
import { History, FileText, Award, Calendar, Quote, BookOpen, ExternalLink, Sparkles } from 'lucide-react';

export const HistoryPapersExplorer: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>('dirichlet');

  const selected: MathematicianPaper =
    MATHEMATICIANS_PAPERS.find((m) => m.id === selectedId) || MATHEMATICIANS_PAPERS[2];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-stone-900 via-amber-950/40 to-stone-900 border border-amber-800/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
          <History className="w-4 h-4" />
          <span>Historical Evolution & Seminal Research Papers</span>
        </div>
        <h2 className="text-2xl font-extrabold text-stone-100">
          저명 수학자 아카이브 & 학술 논문 심층 탐구
        </h2>
        <p className="mt-2 text-stone-300 text-sm max-w-3xl leading-relaxed">
          1673년 라이프니츠가 인류 최초로 '함수(Functio)'라는 용어를 쓴 순간부터, 오일러의 식 중심 표기법,
          디리클레의 임의 대응 혁명, 부르바키의 공리주의, 그리고 20세기 말 스파드와 칼슨의 현대 인지과학 논문에
          이르기까지 함수의 350년 사상적 변천사를 원문과 함께 살펴봅니다.
        </p>

        {/* Timeline Pills */}
        <div className="mt-5 flex flex-wrap gap-2">
          {MATHEMATICIANS_PAPERS.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedId(m.id)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
                selectedId === m.id
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-lg shadow-amber-500/30 ring-2 ring-amber-300'
                  : 'bg-stone-800/80 hover:bg-stone-700/80 text-stone-300'
              }`}
            >
              <span>{m.portraitOrSymbol}</span>
              <span>{m.mathematician}</span>
              <span className="text-[10px] opacity-75">({m.year}년)</span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Mathematician & Paper Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Biography & Historical Contribution */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-800">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                  {selected.portraitOrSymbol}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-stone-800 text-amber-300 border border-stone-700">
                      {selected.era}
                    </span>
                    <span className="text-xs text-stone-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {selected.year}년
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-stone-100 mt-1">{selected.mathematician}</h3>
                  <p className="text-xs text-stone-400 font-mono">{selected.englishName}</p>
                </div>
              </div>
            </div>

            {/* Role & Core Contribution */}
            <div className="mt-4 space-y-3">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">학술적 위상 및 역할</span>
                <p className="text-sm font-semibold text-stone-200 mt-0.5">{selected.role}</p>
              </div>

              <div className="bg-stone-950/80 p-4 rounded-xl border border-stone-800/80">
                <span className="text-xs font-bold text-stone-300 uppercase tracking-wide block mb-1">
                  역사적 기여 및 패러다임 전환
                </span>
                <p className="text-xs text-stone-300 leading-relaxed">{selected.historicalContribution}</p>
              </div>

              {/* Definition at that time */}
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 mb-1">
                  <Award className="w-3.5 h-3.5" />
                  당시의 함수 정의 (Definition in that era)
                </div>
                <p className="text-xs text-amber-100/90 italic leading-relaxed">
                  "{selected.definitionAtThatTime}"
                </p>
              </div>

              {/* Modern Significance */}
              <div className="pt-2 text-xs text-stone-400">
                <span className="font-bold text-stone-300">현대 수학 및 고교 교육과정에서의 의의: </span>
                <span className="text-stone-300">{selected.modernSignificance}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Seminal Paper / Book Excerpt & Academic Translation */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-stone-800 text-xs font-bold text-stone-300 uppercase tracking-wider">
                <FileText className="w-4 h-4 text-amber-400" />
                대표 학술 논문 및 원전(Primary Source)
              </div>

              <div className="mt-4">
                <h4 className="text-base font-bold text-amber-300">
                  《{selected.seminalPaperOrBook.title}》
                </h4>
                <p className="text-xs text-stone-400 font-mono italic mt-0.5">
                  {selected.seminalPaperOrBook.originalTitle} ({selected.seminalPaperOrBook.publishedYear})
                </p>
              </div>

              {/* Original Excerpt */}
              <div className="mt-4 bg-stone-950 p-4 rounded-xl border border-stone-800 relative">
                <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>원문 발췌 (Original Excerpt)</span>
                  <Quote className="w-3.5 h-3.5 opacity-40" />
                </div>
                <blockquote className="text-xs font-serif text-stone-300 italic leading-relaxed">
                  "{selected.seminalPaperOrBook.keyExcerpt}"
                </blockquote>
              </div>

              {/* Korean Academic Translation */}
              <div className="mt-3 bg-stone-950 p-4 rounded-xl border border-amber-900/40">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1.5">
                  한국어 학술 번역 (Academic Translation)
                </div>
                <p className="text-xs text-stone-200 leading-relaxed font-sans">
                  {selected.seminalPaperOrBook.excerptKorean}
                </p>
              </div>
            </div>

            {/* Impact on High School Curriculum */}
            <div className="mt-5 pt-4 border-t border-stone-800 bg-stone-950/50 p-3 rounded-xl border border-stone-800">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                <BookOpen className="w-3.5 h-3.5" />
                고교 2학년 교과서 연계 분석
              </span>
              <p className="text-xs text-stone-300 leading-relaxed">
                {selected.seminalPaperOrBook.impactOnCurriculum}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
