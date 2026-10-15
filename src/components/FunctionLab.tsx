import React, { useState, useMemo } from 'react';
import { FunctionParams, evaluateFunction, checkOneToOne } from '../utils/mathLogic';
import { MathView } from './MathView';
import { Sliders, RefreshCw, Eye, AlertTriangle, CheckCircle2, Compass, Layers } from 'lucide-react';

interface FunctionLabProps {
  initialType?: 'linear' | 'quadratic' | 'cubic' | 'rational' | 'square_root' | 'absolute' | 'exponential';
  showTitle?: boolean;
}

export const FunctionLab: React.FC<FunctionLabProps> = ({
  initialType = 'quadratic',
  showTitle = true,
}) => {
  const [fnType, setFnType] = useState<
    'linear' | 'quadratic' | 'cubic' | 'rational' | 'square_root' | 'absolute' | 'exponential'
  >(initialType);

  const [params, setParams] = useState<FunctionParams>({
    a: 1,
    b: 1,
    c: 0,
    d: 0,
  });

  const [showInverse, setShowInverse] = useState<boolean>(false);
  const [showIdentityLine, setShowIdentityLine] = useState<boolean>(true);
  const [showHorizontalTest, setShowHorizontalTest] = useState<boolean>(true);
  const [horizontalY, setHorizontalY] = useState<number>(1);
  const [tracerX, setTracerX] = useState<number>(2);

  // Canvas bounds
  const xMin = -6;
  const xMax = 6;
  const yMin = -6;
  const yMax = 6;
  const width = 520;
  const height = 400;

  const toSvgX = (x: number) => ((x - xMin) / (xMax - xMin)) * width;
  const toSvgY = (y: number) => height - ((y - yMin) / (yMax - yMin)) * height;

  // Generate primary function points
  const points = useMemo(() => {
    const pts: Array<{ x: number; y: number; svgX: number; svgY: number }> = [];
    const steps = 300;
    const stepSize = (xMax - xMin) / steps;

    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * stepSize;
      const y = evaluateFunction(fnType, x, params);
      if (y !== null && isFinite(y) && !isNaN(y) && y >= yMin - 10 && y <= yMax + 10) {
        pts.push({ x, y, svgX: toSvgX(x), svgY: toSvgY(y) });
      }
    }
    return pts;
  }, [fnType, params]);

  // Generate SVG path string with break on asymptotes
  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    let d = '';
    let isDrawing = false;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (i > 0) {
        const prev = points[i - 1];
        // Asymptote jump check
        if (Math.abs(p.svgY - prev.svgY) > 150 || Math.abs(p.x - prev.x) > 0.2) {
          isDrawing = false;
        }
      }

      if (!isDrawing) {
        d += ` M ${p.svgX.toFixed(1)} ${p.svgY.toFixed(1)}`;
        isDrawing = true;
      } else {
        d += ` L ${p.svgX.toFixed(1)} ${p.svgY.toFixed(1)}`;
      }
    }
    return d;
  }, [points]);

  // Generate Inverse points: reflection of (x, y) across y=x is (y, x)!
  const inversePathD = useMemo(() => {
    if (!showInverse) return '';
    const invPts = points
      .filter((p) => p.y >= xMin && p.y <= xMax)
      .map((p) => ({
        x: p.y,
        y: p.x,
        svgX: toSvgX(p.y),
        svgY: toSvgY(p.x),
      }))
      .sort((a, b) => a.svgX - b.svgX);

    if (invPts.length === 0) return '';
    let d = '';
    let isDrawing = false;

    for (let i = 0; i < invPts.length; i++) {
      const p = invPts[i];
      if (i > 0) {
        const prev = invPts[i - 1];
        if (Math.abs(p.svgY - prev.svgY) > 150 || Math.abs(p.x - prev.x) > 0.3) {
          isDrawing = false;
        }
      }
      if (!isDrawing) {
        d += ` M ${p.svgX.toFixed(1)} ${p.svgY.toFixed(1)}`;
        isDrawing = true;
      } else {
        d += ` L ${p.svgX.toFixed(1)} ${p.svgY.toFixed(1)}`;
      }
    }
    return d;
  }, [showInverse, points]);

  // Horizontal line intersections
  const intersections = useMemo(() => {
    if (!showHorizontalTest) return [];
    const rawInters: number[] = [];

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      if ((p1.y - horizontalY) * (p2.y - horizontalY) <= 0) {
        const ratio = Math.abs(horizontalY - p1.y) / (Math.abs(p2.y - p1.y) || 1e-6);
        const interX = p1.x + (p2.x - p1.x) * ratio;
        rawInters.push(interX);
      }
    }

    // Deduplicate adjacent roots within 0.15
    const dedupedX: number[] = [];
    for (const rx of rawInters) {
      if (!dedupedX.some((x) => Math.abs(x - rx) < 0.15)) {
        dedupedX.push(rx);
      }
    }

    return dedupedX.map((interX) => ({
      x: Math.round(interX * 100) / 100,
      y: horizontalY,
      svgX: toSvgX(interX),
      svgY: toSvgY(horizontalY),
    }));
  }, [showHorizontalTest, horizontalY, points]);

  // One-to-one check status
  const oneToOneStatus = useMemo(() => {
    return checkOneToOne((x) => evaluateFunction(fnType, x, params), xMin, xMax, 100);
  }, [fnType, params]);

  // Tracer point coordinates
  const tracerY = evaluateFunction(fnType, tracerX, params);

  const resetParams = () => {
    setParams({ a: 1, b: 1, c: 0, d: 0 });
    setHorizontalY(1);
    setTracerX(2);
  };

  const getLatexFormula = () => {
    const { a, b, c, d } = params;
    let base = '';
    if (fnType === 'quadratic') base = '(x)';
    if (fnType === 'linear') base = 'x';
    if (fnType === 'cubic') base = 'x^3';
    if (fnType === 'rational') base = '\\frac{1}{x}';
    if (fnType === 'square_root') base = '\\sqrt{x}';
    if (fnType === 'absolute') base = '|x|';
    if (fnType === 'exponential') base = '2^x';

    let inner = 'x';
    if (c !== 0) {
      inner = c > 0 ? `(x - ${c})` : `(x + ${Math.abs(c)})`;
    }
    if (b !== 1) {
      inner = `${b}${inner}`;
    }

    let core = '';
    if (fnType === 'quadratic') core = `${inner}^2`;
    else if (fnType === 'cubic') core = `${inner}^3`;
    else if (fnType === 'rational') core = `\\frac{1}{${inner}}`;
    else if (fnType === 'square_root') core = `\\sqrt{${inner}}`;
    else if (fnType === 'absolute') core = `|${inner}|`;
    else if (fnType === 'exponential') core = `2^{${inner}}`;
    else core = inner;

    let res = core;
    if (a !== 1) {
      res = a === -1 ? `-${core}` : `${a}${core}`;
    }
    if (d !== 0) {
      res = d > 0 ? `${res} + ${d}` : `${res} - ${Math.abs(d)}`;
    }
    return `y = ${res}`;
  };

  return (
    <div className="bg-stone-900 border border-stone-700/80 rounded-2xl p-5 shadow-2xl text-stone-100">
      {showTitle && (
        <div className="flex flex-wrap items-center justify-between pb-4 border-b border-stone-800 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-100 flex items-center gap-2">
                인터랙티브 함수 실험실 (Function Explorer)
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700/50">
                  GeoGebra Dynamic Engine
                </span>
              </h3>
              <p className="text-xs text-stone-400">파라미터 변환 y = a · f(b(x - c)) + d 및 대칭성·일대일성 실시간 탐구</p>
            </div>
          </div>
          <button
            onClick={resetParams}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            파라미터 초기화
          </button>
        </div>
      )}

      {/* Function Type Selector Buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        {[
          { id: 'linear', label: '일차함수 y=x' },
          { id: 'quadratic', label: '이차함수 y=x²' },
          { id: 'cubic', label: '삼차함수 y=x³' },
          { id: 'rational', label: '유리함수 y=1/x' },
          { id: 'square_root', label: '무리함수 y=√x' },
          { id: 'absolute', label: '절댓값 y=|x|' },
          { id: 'exponential', label: '지수함수 y=2ˣ' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setFnType(item.id as any);
              if (item.id === 'square_root') setParams((p) => ({ ...p, c: 0 }));
            }}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
              fnType === item.id
                ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-stone-800/80 hover:bg-stone-700 text-stone-300'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* SVG Graph Viewport */}
        <div className="lg:col-span-7 bg-stone-950 rounded-xl border border-stone-800 p-3 relative overflow-hidden flex flex-col items-center">
          {/* Formula Display Header */}
          <div className="w-full flex items-center justify-between px-2 mb-2">
            <div className="flex items-center gap-2 bg-stone-900/90 px-3 py-1 rounded-md border border-stone-800">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              <MathView math={getLatexFormula()} className="text-sm font-semibold text-amber-300" />
            </div>

            {/* One-to-one status badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${
                intersections.length <= 1
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                  : 'bg-rose-950/60 text-rose-300 border-rose-700/60'
              }`}
            >
              {intersections.length <= 1 ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  일대일 만족 (교점 {intersections.length}개)
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  일대일 불만족 (교점 {intersections.length}개, 역함수 불가)
                </>
              )}
            </div>
          </div>

          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto max-h-[380px] bg-stone-950 rounded-lg select-none"
          >
            {/* Grid Lines */}
            {[-5, -4, -3, -2, -1, 1, 2, 3, 4, 5].map((val) => (
              <g key={`grid-${val}`} className="opacity-20 stroke-stone-600">
                <line x1={toSvgX(val)} y1={0} x2={toSvgX(val)} y2={height} strokeWidth="1" strokeDasharray="3 3" />
                <line x1={0} y1={toSvgY(val)} x2={width} y2={toSvgY(val)} strokeWidth="1" strokeDasharray="3 3" />
              </g>
            ))}

            {/* Main Axes */}
            <line
              x1={0}
              y1={toSvgY(0)}
              x2={width}
              y2={toSvgY(0)}
              stroke="#78716c"
              strokeWidth="1.5"
            />
            <line
              x1={toSvgX(0)}
              y1={0}
              x2={toSvgX(0)}
              y2={height}
              stroke="#78716c"
              strokeWidth="1.5"
            />

            {/* Axis Ticks & Labels */}
            {[-4, -2, 2, 4].map((v) => (
              <g key={`label-${v}`}>
                <text
                  x={toSvgX(v)}
                  y={toSvgY(0) + 14}
                  textAnchor="middle"
                  className="fill-stone-400 text-[10px]"
                >
                  {v}
                </text>
                <text
                  x={toSvgX(0) - 10}
                  y={toSvgY(v) + 3}
                  textAnchor="middle"
                  className="fill-stone-400 text-[10px]"
                >
                  {v}
                </text>
              </g>
            ))}
            <text x={width - 15} y={toSvgY(0) - 8} className="fill-stone-400 text-xs font-semibold">
              x
            </text>
            <text x={toSvgX(0) + 10} y={15} className="fill-stone-400 text-xs font-semibold">
              y
            </text>

            {/* y = x Reflection Line */}
            {showIdentityLine && (
              <line
                x1={toSvgX(-6)}
                y1={toSvgY(-6)}
                x2={toSvgX(6)}
                y2={toSvgY(6)}
                stroke="#60a5fa"
                strokeWidth="1.2"
                strokeDasharray="5 5"
                className="opacity-70"
              />
            )}

            {/* Inverse Function Curve (Reflected) */}
            {showInverse && inversePathD && (
              <path
                d={inversePathD}
                fill="none"
                stroke="#a78bfa"
                strokeWidth="2.2"
                strokeDasharray="4 2"
                className="opacity-80"
              />
            )}

            {/* Main Function Curve */}
            <path
              d={pathD}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Horizontal Line Test Line: y = k */}
            {showHorizontalTest && (
              <g>
                <line
                  x1={0}
                  y1={toSvgY(horizontalY)}
                  x2={width}
                  y2={toSvgY(horizontalY)}
                  stroke="#ec4899"
                  strokeWidth="1.8"
                  strokeDasharray="4 4"
                />
                <text
                  x={width - 45}
                  y={toSvgY(horizontalY) - 5}
                  className="fill-pink-400 text-[10px] font-mono font-bold"
                >
                  y = {horizontalY}
                </text>

                {/* Intersection dots */}
                {intersections.map((inter, idx) => (
                  <g key={`inter-${idx}`}>
                    <circle
                      cx={inter.svgX}
                      cy={inter.svgY}
                      r="5.5"
                      fill="#ec4899"
                      stroke="#fff"
                      strokeWidth="1.5"
                    />
                    <text
                      x={inter.svgX}
                      y={inter.svgY - 10}
                      textAnchor="middle"
                      className="fill-pink-200 text-[10px] font-mono bg-stone-900"
                    >
                      ({inter.x}, {inter.y})
                    </text>
                  </g>
                ))}
              </g>
            )}

            {/* Tracer Point */}
            {tracerY !== null && isFinite(tracerY) && tracerY >= yMin && tracerY <= yMax && (
              <g>
                <circle
                  cx={toSvgX(tracerX)}
                  cy={toSvgY(tracerY)}
                  r="6"
                  fill="#38bdf8"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <line
                  x1={toSvgX(tracerX)}
                  y1={toSvgY(0)}
                  x2={toSvgX(tracerX)}
                  y2={toSvgY(tracerY)}
                  stroke="#38bdf8"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  className="opacity-50"
                />
                <line
                  x1={toSvgX(0)}
                  y1={toSvgY(tracerY)}
                  x2={toSvgX(tracerX)}
                  y2={toSvgY(tracerY)}
                  stroke="#38bdf8"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  className="opacity-50"
                />
                <text
                  x={toSvgX(tracerX) + 8}
                  y={toSvgY(tracerY) - 8}
                  className="fill-sky-200 text-[10px] font-mono font-bold"
                >
                  P({tracerX.toFixed(1)}, {tracerY.toFixed(2)})
                </text>
              </g>
            )}
          </svg>

          {/* Graph Legend & Toggles */}
          <div className="w-full mt-2.5 flex flex-wrap items-center justify-between text-xs text-stone-300 px-2 gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <span className="w-3 h-0.5 bg-amber-400 inline-block" /> y = f(x)
              </span>
              <label className="flex items-center gap-1 cursor-pointer hover:text-stone-100">
                <input
                  type="checkbox"
                  checked={showIdentityLine}
                  onChange={(e) => setShowIdentityLine(e.target.checked)}
                  className="accent-blue-500 rounded"
                />
                <span className="text-blue-400">직선 y = x</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer hover:text-stone-100">
                <input
                  type="checkbox"
                  checked={showInverse}
                  onChange={(e) => setShowInverse(e.target.checked)}
                  className="accent-purple-500 rounded"
                />
                <span className="text-purple-400">역함수 y = f⁻¹(x)</span>
              </label>
            </div>
            <label className="flex items-center gap-1 cursor-pointer hover:text-stone-100">
              <input
                type="checkbox"
                checked={showHorizontalTest}
                onChange={(e) => setShowHorizontalTest(e.target.checked)}
                className="accent-pink-500 rounded"
              />
              <span className="text-pink-400">수평선 판별기</span>
            </label>
          </div>
        </div>

        {/* Sliders & Exploration Controls */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-stone-950/70 p-4 rounded-xl border border-stone-800 space-y-3.5">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-300">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-amber-400" />
                파라미터 변환 슬라이더
              </span>
              <span className="text-stone-400">y = a · f(b(x - c)) + d</span>
            </div>

            {/* Slider a */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-stone-300">세로 신축 / 반전 (a)</span>
                <span className="font-mono text-amber-400 font-bold">{params.a}</span>
              </div>
              <input
                type="range"
                min="-3"
                max="3"
                step="0.5"
                value={params.a}
                onChange={(e) => setParams({ ...params, a: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Slider b */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-stone-300">가로 신축 / 주기 (b)</span>
                <span className="font-mono text-amber-400 font-bold">{params.b}</span>
              </div>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.5"
                value={params.b}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setParams({ ...params, b: val === 0 ? 0.5 : val });
                }}
                className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Slider c */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-stone-300">x축 평행이동 (c)</span>
                <span className="font-mono text-amber-400 font-bold">{params.c}</span>
              </div>
              <input
                type="range"
                min="-4"
                max="4"
                step="0.5"
                value={params.c}
                onChange={(e) => setParams({ ...params, c: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Slider d */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-stone-300">y축 평행이동 (d)</span>
                <span className="font-mono text-amber-400 font-bold">{params.d}</span>
              </div>
              <input
                type="range"
                min="-4"
                max="4"
                step="0.5"
                value={params.d}
                onChange={(e) => setParams({ ...params, d: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Dynamic Inspector: Horizontal Line & Tracer */}
          <div className="bg-stone-950/70 p-4 rounded-xl border border-stone-800 space-y-3">
            <div className="text-xs font-semibold text-stone-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-pink-400" />
                동적 검사 도구 조작
              </span>
            </div>

            {/* Horizontal Line Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-pink-300 font-medium">수평선 높이 (y = k)</span>
                <span className="font-mono text-pink-400 font-bold">{horizontalY.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.5"
                value={horizontalY}
                onChange={(e) => setHorizontalY(parseFloat(e.target.value))}
                className="w-full accent-pink-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-stone-400 mt-1">
                {intersections.length <= 1
                  ? '✓ 수평선과 오직 한 점(또는 0개)에서 만나므로 일대일 성질을 만족합니다.'
                  : `⚠️ y = ${horizontalY} 에서 ${intersections.length}개의 교점이 발생하여 일대일함수가 아닙니다.`}
              </p>
            </div>

            {/* Tracer X Slider */}
            <div className="pt-2 border-t border-stone-800">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-sky-300 font-medium">점 트레이서 위치 (x)</span>
                <span className="font-mono text-sky-400 font-bold">{tracerX.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.2"
                value={tracerX}
                onChange={(e) => setTracerX(parseFloat(e.target.value))}
                className="w-full accent-sky-400 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
              />
              <div className="text-[11px] text-stone-400 mt-1 flex justify-between font-mono">
                <span>입력: x = {tracerX.toFixed(1)}</span>
                <span className="text-amber-400 font-bold">
                  출력: f(x) = {tracerY !== null ? tracerY.toFixed(2) : '정의되지 않음'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
