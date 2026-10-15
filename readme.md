# K-STEM 2026 고교 2학년 수학 디지털 교과서 & 지능형 평가 시스템
### Ⅱ. 함수 (Functions) 대단원 인터랙티브 e-교과서 및 에듀테크 플랫폼

[![GitHub Pages Deployment](https://img.shields.io/badge/Deployment-GitHub%20Pages-brightgreen)](https://4ai4me.github.io/math/)
[![Reference Standard](https://img.shields.io/badge/Reference-2book%20K--STEM%202026-blue)](https://www.2book.co.kr/2026k-stem4/)
[![Target Grade](https://img.shields.io/badge/Target-고등학교%202학년-orange)]()
[![React](https://img.shields.io/badge/React-19.0-61dafb?logo=react)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-blue?logo=typescript)]()
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.3-38bdf8?logo=tailwindcss)]()

---

## 📌 1. 프로젝트 개요 (Overview)

본 플랫폼은 **2026 K-STEM 디지털 교과서 표준 규격([2book.co.kr/2026k-stem4](https://www.2book.co.kr/2026k-stem4/))**을 기반으로 개발된 **고등학교 2학년 수학 '함수(Functions)' 대단원 e-교과서 및 지능형 평가 시스템**입니다.

단순한 PDF 뷰어 방식을 넘어, **3D 실감형 페이지 넘김 애니메이션과 음향 효과**, **공학 도구를 결합한 동적 함수 실험실**, **해외 유수 수학교육 교수법(하버드 다중 표상, APOS, 공변 추론 등)**, **저명 수학자들의 역사적 학술 논문 아카이브**, 그리고 별도의 회원가입 없이 **단말기 IP 및 브라우저 하드웨어 핑거프린트로 학습자를 식별하는 지능형 4단계 수준별 평가 시스템**을 통합 제공합니다.

- **🌐 온라인 접속 주소 (GitHub Pages)**: [https://4ai4me.github.io/math/](https://4ai4me.github.io/math/)
- **💻 소스코드 저장소 (GitHub Repo)**: [https://github.com/4ai4me/math](https://github.com/4ai4me/math)

---

## 🚀 2. 주요 핵심 기능 (Key Features)

### 📖 ① 2book 포맷 디지털 e-교과서 (eBook Viewer)
- **실감형 3D 페이지 넘김 효과 (3D Page Turn)**: 
  - CSS 3D 원근법(`perspective: 2400px`)과 모션 스프링 애니메이션(`motion/react`)을 결합하여 실제 교과서를 손으로 넘기는 듯한 입체감 구현.
  - 전환 효과 옵션 제공: `3D 실감 넘김(3D Flip)`, `부드러운 슬라이드(Slide)`, `페이드(Fade)`.
- **웹 오디오 기반 종이 마찰음 합성 (Paper Rustle Sound)**:
  - 외부 음원 파일 의존 없이 **Web Audio API**를 통해 백색 잡음 및 대역 통과 필터(Bandpass Filter)로 책장 넘기는 소리를 실시간 합성 재생.
- **모바일/태블릿 반응형 완벽 대응**:
  - 화면 너비 자동 감지: PC 환경에서는 **양면 보기(Double Page Spread)**, 1024px 미만 태블릿 및 스마트폰에서는 **단면 보기(Single Page)**로 자동 전환.
  - **터치 스와이프 제스처(Touch Swipe)**: 손가락으로 화면을 좌우로 넘겨 책장을 넘기는 모바일 최적화 UX.
  - **하단 모바일 퀵 내비게이션 바**: 한 손 조작을 위한 원터치 이전/다음 쪽 이동 버튼.
- **풍부한 디지털 학습 도구**:
  - 디지털 형광펜(Highlighter) 드로잉 캔버스 및 색상 선택.
  - 페이지별 포스트잇 스티커 메모 추가 및 삭제.
  - 북마크(책갈피), 교과서 전체 본문 실시간 검색, 전체 목차(TOC) 서랍, 하단 썸네일 캐러셀.

### 🧪 ② GeoGebra 스타일 동적 함수 실험실 (Function Lab)
- **다양한 원형 함수(Parent Functions) 탐구**:
  - 일차함수, 이차함수, 삼차함수, 유리함수, 무리함수, 지수함수, 로그함수, 삼각함수, 절댓값/가우스 함수.
- **동적 파라미터 변환 ($y = a \cdot f(b(x-c)) + d$)**:
  - 슬라이더를 통해 진폭($a$), 주기/신축($b$), x축 평행이동($c$), y축 평행이동($d$)의 변화를 SVG 좌표계에 실시간 시각화.
- **수평선 판별법 (Horizontal Line Test)**:
  - 가상의 수평선 $y = k$를 움직여 교점의 개수를 계산하고, 일대일함수 및 일대일대응 여부를 즉시 판정.
- **역함수 거동 및 $y = x$ 대칭선 탐구**:
  - $y = x$ 대칭선 및 원함수와 역함수의 교점, 반사 궤적을 실시간 렌더링.

### 🌐 ③ 해외 수학교육 교수법 비교 연구 (Global Didactics)
1. **하버드 미적분학 컨소시엄 - 다중 표상 교수법 (Rule of Four)**:
   - 함수를 대수적(Algebraic), 수치적(Numerical), 기하적(Graphical), 언어적(Verbal) 4가지 표상으로 동시에 다루는 통합 학습.
2. **에드 더빈스키의 APOS 이론 (Action-Process-Object-Schema)**:
   - 행동(구체적 수치 대입) → 과정(입출력의 일반화) → 대상(함수 자체를 연산의 대상으로 인식) → 스키마(함수계 통합) 발달 단계 지원.
3. **펠릭스 클라인의 기능적 사고 (Funktionales Denken)**:
   - 독일 메란 교육과정의 핵심인 변수 간의 동적 종속성과 변화율 탐구.
4. **안나 스파드의 인지 재물화 이론 (Reification Theory)**:
   - 과정적 관점(Operational)에서 구조적 관점(Structural)으로의 도약 지원.
5. **매릴린 칼슨의 공변 추론 프레임워크 (Covariational Reasoning)**:
   - 두 변수가 동시에 변화하는 관계를 5단계(방향, 변화량, 변화율 등)로 분석.
6. **싱가포르 교육부 CPA 모델 (Concrete - Pictorial - Abstract)**:
   - 자판기 음료수 등 구체물 조작 → 화살표 다이어그램/그래프 시각화 → 기호 대수식 추상화.

### 📜 ④ 저명 수학자 및 학술 논문 아카이브 (Historical Timeline)
- **1673년 고트프리트 빌헬름 라이프니츠 (G. W. Leibniz)**: *Methodus tangentium inversa* - 최초로 기하학적 곡선의 성질을 나타내기 위해 'functio' 라틴어 단어 도입.
- **1748년 레온하르트 오일러 (Leonhard Euler)**: *Introductio in analysin infinitorum* - 해석적 표현식으로서의 함수 정의 및 $f(x)$ 현대적 기호 정립.
- **1837년 페테르 구스타프 르죈 디리클레 (P. G. L. Dirichlet)**: *Über die Darstellung ganz willkürlicher Functionen* - 단일 식에 구애받지 않는 임의의 대응으로서의 현대적 함수 정의 및 디리클레 함수 제시.
- **1888년 리하르트 데데킨트 (Richard Dedekind)**: *Was sind und was sollen die Zahlen?* - 집합 간의 사상(Abbildung)과 단사, 전사, 전단사 개념의 수학적 정립.
- **1939년 니콜라 부르바키 (Nicolas Bourbaki)**: *Éléments de mathématique* - 데카르트 곱 $X \times Y$의 부분집합인 순서쌍의 이항관계로서의 현대 집합론적 함수 공리화.
- *모든 자료에 대해 원서 표지, 원문 발췌록, 국문 번역, 현대 고등학교 교육과정에 미친 영향 및 의의 수록.*

### 🎯 ⑤ 수준별 기출 지능형 평가 센터 (Adaptive Assessment)
- **비회원 학습자 식별 체계**:
  - 복잡한 회원가입 없이 **학년, 반, 번호, 이름**만 입력하여 즉시 응시.
  - 접속 단말기의 **IP 주소 및 브라우저 하드웨어 핑거프린트 토큰(Device Token)**을 자동 생성하여 중복 응시 및 학습 이력을 정밀하게 구분.
- **4단계 수준별 문항 뱅크**:
  - **Level 1 (기초 확인)**: 함수의 정의, 정의역·공역·치역 판별, 수직선 판별법.
  - **Level 2 (기본 정복)**: 일대일함수, 일대일대응, 합성함수 성질, 역함수 기초 연산.
  - **Level 3 (발전 심화)**: 구간별 정의 함수, 절댓값 함수, 역함수와의 교점 방정식.
  - **Level 4 (수능·학평 킬러 문항)**: 합성함수 방정식, 주기·대칭 융합형 고난도 기출.
- **시험 환경 & 지능형 리포트**:
  - KaTeX 고화질 수식 렌더링, 풀이 연습장(Scratchpad), 시험 시간 타이머.
  - 제출 즉시 **4대 핵심 역량(개념 이해도, 대수 추론력, 문제해결력, 다중표상 변환력)** 방사형 차트 생성.
  - 오답 문항에 대한 **오답 함정 분석(Misconception Trap)** 및 **해외 교수법 기반 맞춤 학습 처방전** 제공.

### 📊 ⑥ 교사용 통합 관제 콘솔 (Teacher Console)
- 전체 응시자 현황, 학급별 평균 점수, 문항별 오답률 실시간 통계.
- 학생별 접속 단말기 식별자, IP 주소, 제출 시간, 답안 감사 로그(Audit Log) 제공.
- **신규 문항 추가 모달**: 교사가 현장에서 새로운 단원 및 문항을 직접 등록하여 학생 평가 센터에 즉시 반영.

---

## 🛠 3. 기술 스택 (Tech Stack)

| 구분 | 사용 기술 |
|---|---|
| **Frontend Core** | React 19, TypeScript 7, Vite 8 |
| **Styling & UI** | Tailwind CSS 4, Lucide React (아이콘) |
| **Motion & Audio** | Motion (Framer Motion 12), Web Audio API |
| **Mathematics** | KaTeX (고해상도 LaTeX 수식 렌더링) |
| **Effects** | Canvas Confetti (만점/고득점 축하 효과) |
| **Backend (선택적)** | Express, Node.js (`server.ts`) - REST API 지원 |
| **CI/CD Deployment** | GitHub Actions (`.github/workflows/deploy.yml`), GitHub Pages (`/docs` 폴더) |

---

## 💻 4. 로컬 실행 및 빌드 방법 (How to Run)

### 1) 의존성 패키지 설치
```bash
npm install
```

### 2) 개발 서버 실행 (Full-stack Express + Vite)
```bash
npm run dev
```
브라우저에서 `http://localhost:3000` 접속

### 3) 단위 테스트 실행
```bash
node --test src/utils/mathLogic.test.ts
```

### 4) GitHub Pages용 프로덕션 빌드 생성
```bash
npm run build:pages
```
`dist/` 및 `docs/` 디렉터리에 배포용 정적 에셋이 생성되며, `.nojekyll` 설정이 자동으로 적용됩니다.

---

## 🌐 5. GitHub Pages 배포 가이드 (GitHub Pages Setup)

GitHub 저장소(`4ai4me/math`)의 설정 메뉴에서 아래 두 가지 방식 중 하나를 선택하시면 사이트가 완벽하게 작동합니다:

### 방법 A. GitHub Actions 자동 배포 (가장 권장)
1. 저장소 상단 **Settings** → 좌측 메뉴 **Pages** 클릭
2. **Build and deployment** > **Source** 항목에서 **GitHub Actions** 선택
3. 코드가 `main` 브랜치에 푸시될 때마다 `.github/workflows/deploy.yml`이 자동으로 실행되어 배포가 완료됩니다.

### 방법 B. `/docs` 폴더 직접 배포
1. 저장소 상단 **Settings** → 좌측 메뉴 **Pages** 클릭
2. **Build and deployment** > **Source** 항목에서 **Deploy from a branch** 선택
3. Branch를 **main**, Folder를 **/docs**로 선택 후 **Save** 클릭
4. 빌드 완료된 에셋이 즉시 반영되어 `https://4ai4me.github.io/math/`에서 정상 작동합니다.

---

## 📄 라이선스 (License)

본 프로젝트는 Apache License 2.0에 따라 자유롭게 학습, 연구 및 교육 목적으로 활용할 수 있습니다.
2026 K-STEM 수학교육 혁신 프로젝트의 일환으로 제작되었습니다.
