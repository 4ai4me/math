import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TEXTBOOK_PAGES } from '../data/textbookPages';
import { TextbookPage, PageViewMode } from '../types';
import { MathView } from './MathView';
import { FunctionLab } from './FunctionLab';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Bookmark,
  Highlighter,
  StickyNote,
  List,
  Search,
  HelpCircle,
  Lightbulb,
  Sparkles,
  Layers,
  ArrowRight,
  Eraser,
  X,
  Volume2,
  VolumeX,
  SlidersHorizontal,
} from 'lucide-react';

interface TextbookViewerProps {
  onOpenExam?: () => void;
  onOpenPedagogy?: () => void;
  onOpenHistory?: () => void;
  initialPage?: number;
}

export type FlipAnimationType = '3d-flip' | 'slide' | 'fade';

export const TextbookViewer: React.FC<TextbookViewerProps> = ({
  onOpenExam,
  onOpenPedagogy,
  onOpenHistory,
  initialPage = 1,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [viewMode, setViewMode] = useState<PageViewMode>('double');
  const [flipAnimation, setFlipAnimation] = useState<FlipAnimationType>('3d-flip');
  const [flipDirection, setFlipDirection] = useState<number>(1); // 1 = forward, -1 = backward
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showToc, setShowToc] = useState<boolean>(false);
  const [bookmarkedPages, setBookmarkedPages] = useState<number[]>([1, 5, 9, 11]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [isPenActive, setIsPenActive] = useState<boolean>(false);
  const [penColor, setPenColor] = useState<string>('rgba(245, 158, 11, 0.4)');

  // Sticky notes per page
  const [stickyNotes, setStickyNotes] = useState<Record<number, Array<{ id: string; text: string; x: number; y: number }>>>({
    3: [{ id: 'note-1', text: '공역과 치역의 차이점: 치역 f(X)는 실제로 화살표를 받은 함숫값들의 부분집합임!', x: 60, y: 150 }],
    9: [{ id: 'note-2', text: '역함수 존재 조건 → 일대일대응 필수! (치역=공역 && 일대일함수)', x: 70, y: 120 }],
  });

  // Solved state for practice problems
  const [solvedPractice, setSolvedPractice] = useState<Record<number, boolean>>({});
  const [showSolution, setShowSolution] = useState<Record<number, boolean>>({});

  const totalPages = TEXTBOOK_PAGES.length;

  // Synthesize realistic paper flip rustle sound via Web Audio API
  const playPageFlipSound = useCallback(() => {
    if (!isSoundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const bufferSize = Math.floor(ctx.sampleRate * 0.22);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate filtered paper rustle noise
      for (let i = 0; i < bufferSize; i++) {
        const decay = Math.exp(-i / (ctx.sampleRate * 0.04));
        data[i] = (Math.random() * 2 - 1) * decay;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.18);
      filter.Q.value = 1.4;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.21);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
    } catch {
      // Audio autoplay policy fallback
    }
  }, [isSoundEnabled]);

  // Touch swipe support for mobile/tablet eBook page flipping
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;

    // Only swipe if horizontal distance is significantly greater than vertical scroll
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0) {
        goToNext(); // Swipe left -> Next page
      } else {
        goToPrev(); // Swipe right -> Previous page
      }
    }
  };

  // Auto-detect mobile screens and default to single page view for comfortable reading
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setViewMode((prev) => (prev === 'double' ? 'single' : prev));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const goToPrev = () => {
    if (currentPage <= 1) return;
    setFlipDirection(-1);
    playPageFlipSound();
    if (viewMode === 'double') {
      setCurrentPage((p) => Math.max(1, p - 2));
    } else {
      setCurrentPage((p) => Math.max(1, p - 1));
    }
  };

  const goToNext = () => {
    if (currentPage >= totalPages) return;
    setFlipDirection(1);
    playPageFlipSound();
    if (viewMode === 'double') {
      setCurrentPage((p) => Math.min(totalPages, p + 2));
    } else {
      setCurrentPage((p) => Math.min(totalPages, p + 1));
    }
  };

  // Keyboard navigation for page flip (ArrowLeft & ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        goToNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        goToPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, viewMode, totalPages]);

  const toggleBookmark = (pageNo: number) => {
    setBookmarkedPages((prev) =>
      prev.includes(pageNo) ? prev.filter((p) => p !== pageNo) : [...prev, pageNo]
    );
  };

  const addStickyNote = (pageNo: number, text: string) => {
    const newNote = {
      id: `note-${Date.now()}`,
      text,
      x: 30 + Math.random() * 40,
      y: 50 + Math.random() * 100,
    };
    setStickyNotes((prev) => ({
      ...prev,
      [pageNo]: [...(prev[pageNo] || []), newNote],
    }));
  };

  const removeStickyNote = (pageNo: number, noteId: string) => {
    setStickyNotes((prev) => ({
      ...prev,
      [pageNo]: (prev[pageNo] || []).filter((n) => n.id !== noteId),
    }));
  };

  // Canvas drawing reference for highlighter
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !isPenActive) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let drawing = false;

    const startDraw = (e: MouseEvent) => {
      drawing = true;
      const rect = canvas.getBoundingClientRect();
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };

    const draw = (e: MouseEvent) => {
      if (!drawing) return;
      const rect = canvas.getBoundingClientRect();
      ctx.strokeStyle = penColor;
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
    };

    const stopDraw = () => {
      drawing = false;
    };

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDraw);

    return () => {
      canvas.removeEventListener('mousedown', startDraw);
      canvas.removeEventListener('mousemove', draw);
      window.removeEventListener('mouseup', stopDraw);
    };
  }, [isPenActive, penColor]);

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // Pages to display based on viewMode
  const displayedPages: TextbookPage[] = [];
  const leftPageNum = currentPage % 2 === 1 ? currentPage : currentPage - 1;

  if (viewMode === 'double') {
    const left = TEXTBOOK_PAGES.find((p) => p.pageNumber === leftPageNum);
    const right = TEXTBOOK_PAGES.find((p) => p.pageNumber === leftPageNum + 1);
    if (left) displayedPages.push(left);
    if (right) displayedPages.push(right);
  } else {
    const single = TEXTBOOK_PAGES.find((p) => p.pageNumber === currentPage);
    if (single) displayedPages.push(single);
  }

  // Search Results
  const searchResults = searchQuery.trim()
    ? TEXTBOOK_PAGES.filter(
        (p) =>
          p.title.includes(searchQuery) ||
          p.sectionTitle.includes(searchQuery) ||
          p.content.bodyParagraphs.some((b) => b.includes(searchQuery))
      )
    : [];

  // Motion variants for Page Flip Animation
  const getPageVariants = (direction: number) => {
    if (flipAnimation === '3d-flip') {
      return {
        initial: {
          rotateY: direction > 0 ? 35 : -35,
          opacity: 0.4,
          scale: 0.98,
          filter: 'drop-shadow(0 25px 25px rgba(0,0,0,0.6))',
        },
        animate: {
          rotateY: 0,
          opacity: 1,
          scale: 1,
          filter: 'drop-shadow(0 15px 15px rgba(0,0,0,0.4))',
          transition: {
            duration: 0.52,
            ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
          },
        },
        exit: {
          rotateY: direction > 0 ? -35 : 35,
          opacity: 0.2,
          scale: 0.98,
          transition: {
            duration: 0.42,
            ease: [0.4, 0, 0.7, 0.2] as [number, number, number, number],
          },
        },
      };
    } else if (flipAnimation === 'slide') {
      return {
        initial: { x: direction > 0 ? 80 : -80, opacity: 0 },
        animate: { x: 0, opacity: 1, transition: { duration: 0.35, ease: 'easeOut' as const } },
        exit: { x: direction > 0 ? -80 : 80, opacity: 0, transition: { duration: 0.25, ease: 'easeIn' as const } },
      };
    } else {
      // Fade
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.25 } },
        exit: { opacity: 0, transition: { duration: 0.2 } },
      };
    }
  };

  const renderPageContent = (page: TextbookPage, isLeft: boolean) => (
    <article
      className={`bg-stone-900 border border-stone-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative flex flex-col justify-between min-h-[720px] text-stone-100 overflow-hidden ${
        viewMode === 'double'
          ? isLeft
            ? 'rounded-r-none border-r-0 shadow-[inset_-20px_0_30px_rgba(0,0,0,0.6)]'
            : 'rounded-l-none border-l-0 shadow-[inset_20px_0_30px_rgba(0,0,0,0.6)]'
          : ''
      }`}
    >
      {/* 3D Paper Texture & Gutter Shadow */}
      <div
        className={`absolute inset-0 pointer-events-none z-10 ${
          viewMode === 'double'
            ? isLeft
              ? 'bg-gradient-to-r from-transparent via-transparent to-black/35'
              : 'bg-gradient-to-l from-transparent via-transparent to-black/35'
            : ''
        }`}
      />

      {/* Page Bookmark Ribbon */}
      {bookmarkedPages.includes(page.pageNumber) && (
        <div className="absolute top-0 right-8 w-6 h-10 bg-amber-500 text-stone-950 flex items-center justify-center shadow-lg rounded-b-md z-20">
          <Bookmark className="w-3.5 h-3.5 fill-current" />
        </div>
      )}

      {/* Page Sticky Notes */}
      {(stickyNotes[page.pageNumber] || []).map((note) => (
        <div
          key={note.id}
          className="absolute bg-amber-200 text-stone-950 p-3 rounded-xl shadow-2xl border border-amber-300 text-xs max-w-[220px] z-30 transform -rotate-1 select-none"
          style={{ top: `${note.y}px`, right: `${note.x}px` }}
        >
          <div className="flex items-center justify-between pb-1 border-b border-amber-400/50 mb-1">
            <span className="font-bold text-[10px] text-amber-900 flex items-center gap-1">
              <StickyNote className="w-3 h-3" /> 메모
            </span>
            <button
              onClick={() => removeStickyNote(page.pageNumber, note.id)}
              className="text-amber-800 hover:text-red-700 font-bold"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="leading-snug text-stone-800 font-sans">{note.text}</p>
        </div>
      ))}

      {/* Page Header (Textbook Style) */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-stone-800 text-xs">
          <div className="flex items-center gap-2 text-stone-400">
            <span className="font-bold text-amber-400">{page.chapterTitle}</span>
            <span>•</span>
            <span className="truncate max-w-[220px]">{page.sectionTitle}</span>
          </div>

          {/* K-STEM Competency Badges */}
          <div className="flex items-center gap-1">
            {page.kStemCompetencies.map((comp) => (
              <span
                key={comp}
                className="px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 text-[10px] font-semibold border border-stone-700"
              >
                {comp}
              </span>
            ))}
          </div>
        </div>

        {/* Page Title & Subtitle */}
        <div className="mt-4 mb-5">
          <h2 className="text-xl sm:text-2xl font-black text-stone-100 tracking-tight">
            {page.title}
          </h2>
          {page.subtitle && (
            <p className="text-xs sm:text-sm text-stone-400 mt-1 font-medium">
              {page.subtitle}
            </p>
          )}
        </div>

        {/* Thought Opening Box (생각 열기 / 탐구 활동) */}
        {page.content.thoughtOpening && (
          <div className="mb-5 rounded-2xl bg-gradient-to-br from-amber-950/30 to-stone-950 border border-amber-800/40 p-4 shadow-inner space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wide">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>생각 열기 (Open Mind & Exploration)</span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed font-sans">
              {page.content.thoughtOpening.scenario}
            </p>
            <div className="p-3 rounded-xl bg-stone-900/90 border border-stone-800 text-xs text-amber-200/95 font-medium">
              <span className="font-bold text-amber-400 mr-1.5">[탐구 과제]</span>
              {page.content.thoughtOpening.question}
            </div>
          </div>
        )}

        {/* Concept Definition Box (개념 정리 / 공리) */}
        {page.content.conceptBox && (
          <div className="mb-5 rounded-2xl bg-stone-950 border-2 border-amber-500/40 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {page.content.conceptBox.definitionName}
              </span>
              <span className="text-[10px] text-stone-500 font-mono">수학적 정의 및 공리</span>
            </div>

            {/* Math Formula Card */}
            {page.content.conceptBox.mathFormula && (
              <div className="p-3 rounded-xl bg-stone-900 text-center border border-stone-800 overflow-x-auto">
                <MathView
                  math={page.content.conceptBox.mathFormula}
                  block={true}
                  className="text-base font-serif text-amber-300 font-bold"
                />
              </div>
            )}

            <p className="text-xs text-stone-200 leading-relaxed whitespace-pre-line font-sans">
              {page.content.conceptBox.description}
            </p>

            {/* Key Bullet Points */}
            {page.content.conceptBox.keyPoints.length > 0 && (
              <ul className="space-y-1.5 pt-1 text-xs text-stone-300">
                {page.content.conceptBox.keyPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-1.5 leading-snug">
                    <span className="text-amber-400 font-bold shrink-0">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Body Paragraphs */}
        <div className="space-y-3 text-xs sm:text-sm text-stone-300 leading-relaxed font-sans mb-5">
          {page.content.bodyParagraphs.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {/* Embedded Interactive Tool (e.g. Page 11 embeds Function Lab!) */}
        {page.content.interactiveTool === 'function_explorer' && (
          <div className="mb-5">
            <FunctionLab showTitle={false} />
          </div>
        )}

        {/* Example Problem & Practice (예제 및 풀이/유제) */}
        {page.content.exampleProblem && (
          <div className="mb-5 rounded-2xl bg-stone-950/90 border border-stone-800 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800 text-xs">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                [예제 1] 개념 적용 예제
              </span>
              <button
                onClick={() =>
                  setShowSolution((prev) => ({
                    ...prev,
                    [page.pageNumber]: !prev[page.pageNumber],
                  }))
                }
                className="text-[11px] text-stone-400 hover:text-white"
              >
                {showSolution[page.pageNumber] ? '풀이 가리기' : '풀이 보기'}
              </button>
            </div>

            <p className="text-xs font-semibold text-stone-200">
              {page.content.exampleProblem.question}
            </p>

            {showSolution[page.pageNumber] && (
              <div className="bg-stone-900/90 p-3 rounded-xl border border-stone-800 text-xs text-stone-300 space-y-1">
                {page.content.exampleProblem.solutionSteps.map((step, sIdx) => (
                  <p key={sIdx}>{step}</p>
                ))}
                <div className="pt-1.5 text-amber-400 font-bold">
                  답: {page.content.exampleProblem.answer}
                </div>
              </div>
            )}

            {/* Practice Problem */}
            <div className="pt-3 border-t border-stone-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-300">[유제 1-1] 실력 다지기</span>
                <button
                  onClick={() =>
                    setSolvedPractice((prev) => ({
                      ...prev,
                      [page.pageNumber]: !prev[page.pageNumber],
                    }))
                  }
                  className="text-[11px] text-stone-400 hover:text-amber-400"
                >
                  {solvedPractice[page.pageNumber] ? '정답 가리기' : '정답 확인'}
                </button>
              </div>
              <p className="text-xs text-stone-300">
                {page.content.exampleProblem.practiceProblem.question}
              </p>
              {solvedPractice[page.pageNumber] && (
                <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-200">
                  <strong>정답: {page.content.exampleProblem.practiceProblem.answer}</strong>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    {page.content.exampleProblem.practiceProblem.explanation}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Deep Thinking & Academic Link */}
        {page.content.deepThinking && (
          <div className="rounded-xl bg-stone-950 p-3.5 border border-indigo-900/40 text-xs space-y-1.5">
            <span className="font-bold text-indigo-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              {page.content.deepThinking.title}
            </span>
            <p className="text-stone-300 leading-relaxed font-sans">
              {page.content.deepThinking.prompt}
            </p>
            <span className="text-[11px] text-stone-500 font-mono block">
              참고 문헌: {page.content.deepThinking.academicLink}
            </span>
          </div>
        )}
      </div>

      {/* Page Footer */}
      <footer className="pt-4 mt-6 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400 relative z-20">
        <span className="font-bold text-stone-300 font-mono">
          Page {page.pageNumber}
        </span>

        <div className="flex items-center gap-3">
          {onOpenPedagogy && (
            <button
              onClick={onOpenPedagogy}
              className="text-stone-400 hover:text-amber-400 transition-colors"
            >
              해외 교수법 분석
            </button>
          )}
          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              className="text-stone-400 hover:text-amber-400 transition-colors"
            >
              수학자 아카이브
            </button>
          )}
          {onOpenExam && (
            <button
              onClick={onOpenExam}
              className="text-amber-400 hover:text-amber-300 font-bold transition-colors flex items-center gap-1"
            >
              평가 센터 <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </footer>

      {/* Interactive Dog-Ear Page Turn Corner (eBook Curl Effect) */}
      {viewMode === 'double' && !isLeft && page.pageNumber < totalPages && (
        <button
          onClick={goToNext}
          className="absolute bottom-0 right-0 w-12 h-12 bg-gradient-to-tl from-amber-500/40 via-amber-400/20 to-transparent hover:from-amber-400/70 cursor-pointer rounded-tl-3xl shadow-xl transition-all flex items-end justify-end p-1.5 text-stone-400 hover:text-white group z-20"
          title="다음 쪽으로 넘기기 (Click to Turn)"
        >
          <ChevronRight className="w-3.5 h-3.5 group-hover:scale-125 transition-transform" />
        </button>
      )}

      {viewMode === 'double' && isLeft && page.pageNumber > 1 && (
        <button
          onClick={goToPrev}
          className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-amber-500/40 via-amber-400/20 to-transparent hover:from-amber-400/70 cursor-pointer rounded-tr-3xl shadow-xl transition-all flex items-end justify-start p-1.5 text-stone-400 hover:text-white group z-20"
          title="이전 쪽으로 넘기기 (Click to Turn)"
        >
          <ChevronLeft className="w-3.5 h-3.5 group-hover:scale-125 transition-transform" />
        </button>
      )}
    </article>
  );

  return (
    <div className="flex flex-col space-y-4">
      {/* ================= 2BOOK K-STEM TOP DIGITAL TOOLBAR ================= */}
      <header className="bg-stone-900 border border-stone-800 rounded-2xl px-4 py-2.5 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs select-none">
        {/* Left: Brand & TOC & Chapter Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-amber-500 text-stone-950 font-black flex items-center justify-center text-sm shadow-md">
              K
            </span>
            <div>
              <span className="font-bold text-stone-100 flex items-center gap-1.5">
                K-STEM 2026 디지털 e-교과서
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono">
                  eBook v2.6
                </span>
              </span>
              <span className="text-[11px] text-stone-400 block truncate max-w-[200px] sm:max-w-[300px]">
                {TEXTBOOK_PAGES[currentPage - 1]?.sectionTitle || 'Ⅱ. 함수'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowToc(!showToc)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
              showToc
                ? 'bg-amber-500 text-stone-950 font-bold border-amber-400'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>목차</span>
          </button>
        </div>

        {/* Center: Page Controls [ < ] [ 3 / 12 ] [ > ] */}
        <div className="flex items-center gap-2 bg-stone-950/80 px-3 py-1.5 rounded-xl border border-stone-800">
          <button
            disabled={currentPage <= 1}
            onClick={goToPrev}
            className="p-1 rounded-md text-stone-400 hover:text-white hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="이전 페이지 넘김 (Keyboard ←)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 font-mono text-xs">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= totalPages) {
                  setFlipDirection(val > currentPage ? 1 : -1);
                  playPageFlipSound();
                  setCurrentPage(val);
                }
              }}
              className="w-8 text-center bg-stone-900 border border-stone-700 rounded py-0.5 text-amber-400 font-bold focus:outline-none"
            />
            <span className="text-stone-500">/</span>
            <span className="text-stone-400 font-semibold">{totalPages}</span>
          </div>

          <button
            disabled={currentPage >= totalPages}
            onClick={goToNext}
            className="p-1 rounded-md text-stone-400 hover:text-white hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="다음 페이지 넘김 (Keyboard →)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Digital Tools (Highlighter, Sticky Note, 3D Flip Effects, Sound, View Mode, Zoom) */}
        <div className="flex items-center gap-2">
          {/* Flip Animation Mode Selector */}
          <div className="flex items-center gap-1 bg-stone-950/80 px-2 py-1 rounded-xl border border-stone-800">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400 hidden sm:inline" />
            <select
              value={flipAnimation}
              onChange={(e) => setFlipAnimation(e.target.value as FlipAnimationType)}
              className="bg-transparent text-stone-300 font-medium text-[11px] focus:outline-none cursor-pointer"
              title="책장 넘김 효과 선택"
            >
              <option value="3d-flip" className="bg-stone-900 text-stone-100">3D 책장 넘김</option>
              <option value="slide" className="bg-stone-900 text-stone-100">슬라이드 넘김</option>
              <option value="fade" className="bg-stone-900 text-stone-100">페이드 전환</option>
            </select>
          </div>

          {/* Sound Effect Toggle */}
          <button
            onClick={() => {
              setIsSoundEnabled(!isSoundEnabled);
              if (!isSoundEnabled) playPageFlipSound();
            }}
            className={`p-1.5 rounded-lg border transition-colors ${
              isSoundEnabled
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-stone-800 text-stone-500 border-stone-700'
            }`}
            title={`책장 넘김 효과음: ${isSoundEnabled ? '켬' : '끔'}`}
          >
            {isSoundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Highlighter Tool */}
          <div className="flex items-center gap-1 bg-stone-950/80 px-2 py-1 rounded-xl border border-stone-800">
            <button
              onClick={() => setIsPenActive(!isPenActive)}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                isPenActive
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
              title="형광펜 판서 도구 토글"
            >
              <Highlighter className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">형광펜</span>
            </button>

            {isPenActive && (
              <>
                <button
                  onClick={() => setPenColor('rgba(245, 158, 11, 0.4)')}
                  className="w-4 h-4 rounded-full bg-amber-400 border border-stone-700"
                  title="노란색 형광펜"
                />
                <button
                  onClick={() => setPenColor('rgba(96, 165, 250, 0.4)')}
                  className="w-4 h-4 rounded-full bg-blue-400 border border-stone-700"
                  title="파란색 형광펜"
                />
                <button
                  onClick={() => setPenColor('rgba(236, 72, 153, 0.4)')}
                  className="w-4 h-4 rounded-full bg-pink-400 border border-stone-700"
                  title="분홍색 형광펜"
                />
                <button
                  onClick={clearCanvas}
                  className="p-1 rounded text-stone-400 hover:text-white"
                  title="판서 전체 지우기"
                >
                  <Eraser className="w-3 h-3" />
                </button>
              </>
            )}
          </div>

          {/* Sticky Note Button */}
          <button
            onClick={() => {
              const text = prompt('현재 페이지에 부착할 포스트잇 메모를 입력하세요:');
              if (text && text.trim()) {
                addStickyNote(currentPage, text.trim());
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700"
            title="포스트잇 메모 부착"
          >
            <StickyNote className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">포스트잇</span>
          </button>

          {/* Bookmark Button */}
          <button
            onClick={() => toggleBookmark(currentPage)}
            className={`p-1.5 rounded-lg border transition-colors ${
              bookmarkedPages.includes(currentPage)
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-stone-800 text-stone-400 hover:text-white border-stone-700'
            }`}
            title="책갈피 북마크"
          >
            <Bookmark className="w-3.5 h-3.5" />
          </button>

          {/* Search Toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-1.5 rounded-lg border transition-colors ${
              showSearch
                ? 'bg-amber-500 text-stone-950 font-bold border-amber-400'
                : 'bg-stone-800 text-stone-400 hover:text-white border-stone-700'
            }`}
            title="교과서 본문 검색"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* View Mode Toggle: Double vs Single */}
          <div className="hidden md:flex items-center bg-stone-950/80 rounded-xl border border-stone-800 p-0.5">
            <button
              onClick={() => setViewMode('double')}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                viewMode === 'double'
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              양면 보기
            </button>
            <button
              onClick={() => setViewMode('single')}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                viewMode === 'single'
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              단면 보기
            </button>
          </div>

          {/* Zoom Buttons */}
          <div className="hidden lg:flex items-center gap-1 bg-stone-950/80 px-2 py-1 rounded-xl border border-stone-800">
            <button
              disabled={zoomLevel <= 70}
              onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
              className="text-stone-400 hover:text-white p-0.5"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] text-stone-400 w-9 text-center font-bold">
              {zoomLevel}%
            </span>
            <button
              disabled={zoomLevel >= 140}
              onClick={() => setZoomLevel((z) => Math.min(140, z + 10))}
              className="text-stone-400 hover:text-white p-0.5"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ================= SEARCH OVERLAY DRAWER ================= */}
      {showSearch && (
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-3 shadow-lg flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="교과서 본문 검색 (예: 일대일대응, 역함수, 수평선, 디리클레)..."
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              onClick={() => setShowSearch(false)}
              className="text-stone-400 hover:text-white text-xs px-2 py-1 rounded bg-stone-800"
            >
              닫기
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-2 max-h-48 overflow-y-auto space-y-1.5 text-xs">
              {searchResults.map((res) => (
                <button
                  key={res.pageNumber}
                  onClick={() => {
                    setFlipDirection(res.pageNumber > currentPage ? 1 : -1);
                    playPageFlipSound();
                    setCurrentPage(res.pageNumber);
                    setShowSearch(false);
                  }}
                  className="w-full p-2 rounded-lg bg-stone-950 hover:bg-stone-800 text-left border border-stone-800 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-amber-400 mr-2">p.{res.pageNumber}</span>
                    <span className="text-stone-200">{res.title}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TABLE OF CONTENTS (TOC) DRAWER ================= */}
      {showToc && (
        <div className="bg-stone-900 border border-amber-900/40 rounded-2xl p-5 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <h3 className="font-bold text-sm text-stone-100 flex items-center gap-2">
              <List className="w-4 h-4 text-amber-400" />
              디지털 교과서 전체 목차 (Table of Contents)
            </h3>
            <button
              onClick={() => setShowToc(false)}
              className="text-stone-400 hover:text-white text-xs px-2 py-1 rounded bg-stone-800"
            >
              닫기
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            {TEXTBOOK_PAGES.map((page) => (
              <button
                key={page.pageNumber}
                onClick={() => {
                  setFlipDirection(page.pageNumber > currentPage ? 1 : -1);
                  playPageFlipSound();
                  setCurrentPage(page.pageNumber);
                  setShowToc(false);
                }}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                  currentPage === page.pageNumber
                    ? 'bg-amber-950/60 border-amber-500 text-amber-200 font-bold shadow-md'
                    : 'bg-stone-950 border-stone-800 text-stone-300 hover:bg-stone-850 hover:border-stone-700'
                }`}
              >
                <span className="px-2 py-0.5 rounded bg-stone-800 font-mono text-amber-400 font-bold shrink-0">
                  p.{page.pageNumber}
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-stone-100 truncate">{page.title}</div>
                  <div className="text-[11px] text-stone-400 truncate mt-0.5">{page.sectionTitle}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ================= 3D EBOOK SPREAD STAGE ================= */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full overflow-hidden flex items-center justify-center py-2 [perspective:2400px] touch-pan-y"
      >
        {/* Floating Quick Flip Arrows for Desktop */}
        <button
          disabled={currentPage <= 1}
          onClick={goToPrev}
          className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-30 w-11 h-16 rounded-r-2xl bg-stone-900/90 hover:bg-amber-500 hover:text-stone-950 text-stone-400 border border-stone-700/80 shadow-2xl items-center justify-center transition-all disabled:opacity-0 disabled:pointer-events-none group"
          title="이전 쪽으로 넘기기"
        >
          <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
        </button>

        <button
          disabled={currentPage >= totalPages}
          onClick={goToNext}
          className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-30 w-11 h-16 rounded-l-2xl bg-stone-900/90 hover:bg-amber-500 hover:text-stone-950 text-stone-400 border border-stone-700/80 shadow-2xl items-center justify-center transition-all disabled:opacity-0 disabled:pointer-events-none group"
          title="다음 쪽으로 넘기기"
        >
          <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Transparent Canvas for Highlighter Drawings */}
        {isPenActive && (
          <canvas
            ref={canvasRef}
            width={1200}
            height={850}
            className="absolute inset-0 w-full h-full z-20 pointer-events-auto cursor-crosshair"
          />
        )}

        {/* Animated 3D Book Stage */}
        <div
          className="w-full flex justify-center [transform-style:preserve-3d]"
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
        >
          <AnimatePresence mode="wait" custom={flipDirection}>
            <motion.div
              key={`${currentPage}-${viewMode}`}
              custom={flipDirection}
              variants={getPageVariants(flipDirection)}
              initial="initial"
              animate="animate"
              exit="exit"
              className={`w-full relative [transform-style:preserve-3d] ${
                viewMode === 'double'
                  ? 'grid grid-cols-1 lg:grid-cols-2 max-w-6xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] rounded-2xl bg-stone-950/60 p-1'
                  : 'max-w-3xl mx-auto'
              }`}
            >
              {/* Realistic Book Spine Center Crease (양면 제본 중심선) */}
              {viewMode === 'double' && displayedPages.length === 2 && (
                <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-6 -translate-x-1/2 z-20 pointer-events-none">
                  {/* Spine Depth Gradients */}
                  <div className="w-full h-full bg-gradient-to-r from-black/50 via-stone-800/60 to-black/50 shadow-inner" />
                  <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-stone-700/60 -translate-x-1/2" />
                </div>
              )}

              {/* Left Page (or Single Page) */}
              {displayedPages[0] && renderPageContent(displayedPages[0], true)}

              {/* Right Page (if Double Spread) */}
              {viewMode === 'double' && displayedPages[1] && renderPageContent(displayedPages[1], false)}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Quick Flip Floating Navigation (보조 넘김 바: 좌우 스와이프 제스처 및 원터치 버튼) */}
      <div className="flex md:hidden items-center justify-between bg-stone-900 border border-stone-800 rounded-xl px-4 py-2 text-xs shadow-lg">
        <button
          disabled={currentPage <= 1}
          onClick={goToPrev}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 disabled:opacity-40 disabled:pointer-events-none"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>이전 쪽</span>
        </button>
        <span className="text-stone-400 font-mono text-[11px]">
          손가락 좌우 스와이프로 책 넘김 가능 ({currentPage}/{totalPages})
        </span>
        <button
          disabled={currentPage >= totalPages}
          onClick={goToNext}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold disabled:opacity-40 disabled:pointer-events-none"
        >
          <span>다음 쪽</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ================= 2BOOK K-STEM BOTTOM THUMBNAIL SLIDER ================= */}
      <nav aria-label="교과서 페이지 썸네일 탐색" className="bg-stone-900 border border-stone-800 rounded-2xl p-3 shadow-xl flex items-center gap-2 overflow-x-auto select-none">
        <span className="text-xs font-bold text-stone-400 shrink-0 px-2 flex items-center gap-1">
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          썸네일 탐색
        </span>
        {TEXTBOOK_PAGES.map((page) => (
          <button
            key={page.pageNumber}
            onClick={() => {
              setFlipDirection(page.pageNumber > currentPage ? 1 : -1);
              playPageFlipSound();
              setCurrentPage(page.pageNumber);
            }}
            className={`flex-shrink-0 w-24 h-16 rounded-xl border p-1.5 flex flex-col justify-between text-left transition-all ${
              currentPage === page.pageNumber ||
              (viewMode === 'double' &&
                (currentPage % 2 === 1
                  ? page.pageNumber === currentPage + 1
                  : page.pageNumber === currentPage - 1))
                ? 'bg-amber-950/80 border-amber-400 shadow-md ring-1 ring-amber-400 scale-105'
                : 'bg-stone-950 border-stone-800 hover:border-stone-700'
            }`}
          >
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-mono font-bold text-amber-400">p.{page.pageNumber}</span>
              {bookmarkedPages.includes(page.pageNumber) && (
                <Bookmark className="w-2.5 h-2.5 text-amber-400 fill-current" />
              )}
            </div>
            <div className="text-[10px] text-stone-300 truncate font-semibold">
              {page.title.slice(0, 14)}
            </div>
          </button>
        ))}
      </nav>
    </div>
  );
};
