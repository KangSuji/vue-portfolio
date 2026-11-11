# CLAUDE.md

TMDB 데이터를 주 1회 수집해 대시보드(차트·카드)와 트렌딩 목록으로 보여주는 Vue 3 포트폴리오 SPA.
배포: Netlify (https://sjkang-vue3-portfolio.netlify.app/)

## 아키텍처

```
[GitHub Actions, 매주 월 03:00 KST]  .github/workflows/collect-data.yml
  npm run collect (scripts/collect.ts, 토큰은 secret TMDB_TOKEN)
   ├─ public/data/dashboard.json             대시보드 집계 + 이번 주 트렌딩
   └─ public/data/detail/{movie|tv}/{id}.json 트렌딩 작품 상세 (약 40개)
  → 변경 있으면 github-actions[bot]이 main에 커밋 → Netlify 자동 배포

[Vue 앱] TMDB를 직접 호출하지 않음 (번들에 토큰 없음) → public/data의 JSON만 fetch
```

- 앱 런타임 요청: 대시보드/트렌딩은 `dashboard.json` 1회(앱 실행 중 캐시), 상세는 작품당 1회.
- 상세 JSON은 이번 주 트렌딩 작품만 있다. 없는 작품은 "상세 정보 없음" 표시.
- 봇이 main에 주간 커밋하므로 로컬에서 push 전에 `git pull` 필요할 수 있음.

## 기술 스택

- Vue 3 (`<script setup>` + TypeScript), Vite 6, Vue Router 4, Pinia 3
- UI: Quasar 2 (컴포넌트는 [src/config/quasarConfig.ts](src/config/quasarConfig.ts)에서 **개별 등록** — 새 Quasar 컴포넌트를 쓰려면 여기에 추가해야 함)
- 차트: ECharts 5 (tree-shaking 방식 `echarts/core` + 필요한 차트/컴포넌트만 `echarts.use`)
- 스타일: SCSS ([src/assets/styles/](src/assets/styles/), 진입점 `index.scss`), 컴포넌트 `<style>`은 거의 비어 있고 전역 SCSS에 페이지별로 작성
- 폰트: Pretendard Variable (index.html에서 `<link>`로 로드). ECharts canvas용 폰트는 `config/chartOptions.ts` 테마에 별도 지정

## 스타일 규칙

- 색은 [theme.scss](src/assets/styles/theme.scss)의 **의미 기반 토큰**만 사용 (`--bg`, `--surface`, `--surface-2`, `--border`, `--text-primary/secondary/tertiary`, `--positive`, `--negative`, `--star` …). hex 직접 사용 금지.
- 다크(기본)는 `:root`, 라이트는 `body.body--light`에서 같은 토큰을 덮어쓴다 → **페이지 SCSS에 `body--light` 블록을 만들지 말 것.** 새 색이 필요하면 토큰을 양쪽에 추가.
- 다크는 Material Design 기준(배경 #121212, 표면 #1e1e1e). 텍스트 토큰은 배경·표면 대비 4.5:1 이상 유지.
- 차트 색(`config/chartPalette.ts`)은 canvas라 CSS 변수를 못 읽으므로 theme.scss 값과 수동으로 맞춘다.
- 자간: 제목·큰 숫자 `--tracking-tight`(-0.02em), 본문 `--tracking-normal`(-0.01em), 12~13px 작은 글씨 `--tracking-wide`(0). 행간: 본문 1.5, 제목 1.3~1.4, 긴 문단 1.7.
- 페이지 루트 요소는 `.page_container`와 함께 쓰이고 그 padding이 우선 적용되므로, 상단 여백은 첫 자식의 margin으로 준다.
- `:deep()`은 scoped 스타일 전용이라 전역 SCSS에서는 동작하지 않는다.
- 트렌딩 캐러셀은 `height: auto`라 전환 시 "들어오는 슬라이드" 높이를 쓴다. 포스터 `aspect-ratio: 2/3`과 제목 2줄 고정 높이를 없애면 이미지 로딩 전 높이가 0이 되어 깜빡인다.
- 수집 스크립트 실행: tsx

## 명령어

```sh
npm run dev          # 개발 서버 (public/data가 커밋돼 있어 토큰 없이 동작)
npm run collect      # TMDB 수집 → public/data 갱신 (TMDB_TOKEN 필요, .env 자동 로드)
npm run build        # type-check(vue-tsc) + vite build 병렬 실행
npm run type-check   # 앱 + scripts/ (tsconfig.node.json) 모두 검사
npm run lint         # oxlint → eslint 순서로 --fix 실행
npm run format       # prettier (src/)
npm run test:unit    # vitest (watch 모드). 1회 실행은 npx vitest run
```

## 환경 변수

- `TMDB_TOKEN`: TMDB **v4 Read Access Token**. 로컬은 `.env`(gitignore), CI는 GitHub Actions secret.
- `VITE_` 접두사를 붙이지 말 것 — 클라이언트 번들에 포함된다.

## 구조

```
scripts/collect.ts        # 수집 스크립트 (상대경로로 src/api/tmdb, src/api/data/types, src/utils 재사용)
src/
  api/
    tmdb/                 # ⚠ 수집 스크립트 전용. 앱 코드에서 import 금지 (토큰이 번들에 들어감)
                          #   Node에서도 실행되므로 '@/' alias, import.meta.env, 브라우저 API 금지
      client.ts           # createTmdbClient(token): GET + res.ok 확인 → TmdbError
      api.ts              # createTmdbApi(token): 엔드포인트·개수 집계 함수
      types.ts            # TMDB 응답 타입
      mappers.ts          # 응답 → 화면 모델 (MediaCard, ContentDetail), tmdbImageUrl
    data/
      types.ts            # 정적 JSON 스키마 (DashboardData, DetailData) — 스크립트·앱 공유
      client.ts           # 앱용 fetchDashboard / fetchContentDetail
    index.ts              # 앱에서 쓰는 API의 진입점 (data/client + 타입만 export)
  utils/                  # 순수 함수 (테스트 대상) — date, stats, array, async / themeUtils
  stores/
    useDashboardStore.ts  # dashboard.json 로드(1회 캐시) + 파생 값 (메인·트렌딩 공유)
    useThemeStore.ts
  views/
    pages/MainView.vue    # 요약 카드 3개 + 월별 개봉(올해 vs 작년) + 트렌딩 TOP10 + 장르 TOP10
                          # 로딩은 스켈레톤, 실패 시 다시 시도. 기준일/TMDB 출처 표기
    pages/TrendView.vue   # 트렌딩 영화/TV 캐러셀
    pages/DetailView.vue  # 상세 (store 없이 페이지 로컬 상태)
    pages/components/     # *ChartComp.vue (Bar/Line/Pie/Heatmap), mainCardComp.vue
  components/DateComp.vue # 연도 선택 (현재 미사용)
  config/
    chartPalette.ts       # 다크/라이트 차트 색상 (useChartPalette) — 강조색 + 회색 emphasis 방식
    dashboardCharts.ts    # 대시보드 차트 옵션 생성 (monthlyComparisonChart, rankedBarChart)
    chartOptions.ts       # ECharts 기본 테마 (registerTheme)
    progressConfig.ts     # Quasar Loading 래퍼 (트렌딩/상세 페이지)
    quasarConfig.ts
public/data/              # 수집 결과 (봇이 커밋, 직접 수정하지 말 것)
```

테스트는 각 폴더의 `__tests__/*.spec.ts` (vitest + jsdom).

## 데이터 정의 / TMDB API 주의점

- "이번 달/올해"는 보는 사람의 날짜가 아니라 `dashboard.json`의 `baseDate`(수집 기준일, KST) 기준.
- 연간 카드는 **연초~기준일 누적 vs 전년 같은 기간** 비교 (올해 전체 vs 작년 전체는 연말 전엔 항상 감소로 보임).
- 기준 월 이후 달은 등록된 개봉 예정작만 있어 확정치가 아님 → 차트에서 점선, "다음 달" 카드는 증감률 없음.
- 장르별 편수는 한 영화가 여러 장르에 속하면 각각 집계 (합계 ≠ 전체 편수).
- 트렌딩 TOP10 차트는 트렌딩 상위 10편을 인기도 순으로 재정렬 (트렌딩 순위 ≠ 인기도).
- 영화 "국내 개봉" 집계는 `release_date.gte/lte` + `region=KR` + `with_release_type=2|3`(극장).
  `primary_release_date`(전 세계 최초 개봉일)와 함께 쓰면 `region`이 무시되어 전 세계 등록 영화 수가 나온다.
- discover의 `total_results`는 **최대 20,001**로 잘린다. 큰 범위 집계는 기간을 쪼개야 한다.
- TV discover는 `first_air_date.gte/lte` (영화용 키를 쓰면 조용히 무시됨).
- 날짜 문자열은 `utils/date.ts`의 `toDateString()` 사용. `toISOString()`은 UTC 변환이라 KST에서 하루 밀린다.
  수집 스크립트는 `process.env.TZ = 'Asia/Seoul'`로 고정.
- JSON 스키마(`src/api/data/types.ts`)를 바꾸면 `SCHEMA_VERSION`을 올리고 `npm run collect`로 재생성.
- 없는 정적 파일 요청 시 Vite/Netlify SPA fallback이 index.html을 200으로 줄 수 있어 `data/client.ts`에서 content-type까지 확인한다.

## 컴포넌트 주의점

- 차트 컴포넌트는 ECharts 인스턴스를 mount 시 1회 생성 → `onUpdated`에서 `setOption(..., true)`로 교체 → `onBeforeUnmount`에서 dispose. 차트 옵션은 props를 통째로 넘기므로(`{ ...props }`) prop 이름이 ECharts 옵션 키와 같아야 함.
- 차트 컴포넌트 props는 아직 런타임 선언(`type: Array/Object`)이라 타입이 느슨함.
- 대시보드 차트 옵션은 `config/dashboardCharts.ts`에서 만들어 `v-bind`로 넘긴다. 색은 하드코딩하지 말고 `useChartPalette()` 사용 (테마 전환 시 자동 갱신).
- ECharts tooltip formatter는 HTML을 그대로 렌더링하므로 외부 텍스트(작품 제목 등)는 `escapeHtml()` 필수.
- `BarChartComp`는 막대 클릭 시 `itemClick(dataIndex)` 이벤트를 낸다.

## 컨벤션

- Prettier: 세미콜론, 작은따옴표, printWidth 100
- 주석·UI 문구는 한국어
- 커밋은 사용자가 직접 함. 메시지 형식: `feat:`, `fix:`, `style:`, `refactor:`, `docs:`, `chore:` + 한국어 설명
- 경로 alias `@` → `src/` (단, `src/api/tmdb`, `src/api/data/types.ts`, `src/utils`의 스크립트 공유 파일에서는 상대경로)
