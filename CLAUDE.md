# CLAUDE.md

TMDB API로 영화/TV 데이터를 가져와 대시보드(차트·카드)와 트렌딩 목록으로 보여주는 Vue 3 포트폴리오 SPA.
배포: Netlify (https://sjkang-vue3-portfolio.netlify.app/)

## 기술 스택

- Vue 3 (`<script setup>` + TypeScript), Vite 6, Vue Router 4, Pinia 3
- UI: Quasar 2 (컴포넌트는 [src/config/quasarConfig.ts](src/config/quasarConfig.ts)에서 **개별 등록** — 새 Quasar 컴포넌트를 쓰려면 여기에 추가해야 함)
- 차트: ECharts 5 (tree-shaking 방식 `echarts/core` + 필요한 차트/컴포넌트만 `echarts.use`)
- 스타일: SCSS ([src/assets/styles/](src/assets/styles/), 진입점 `index.scss`), 컴포넌트 `<style>`은 거의 비어 있고 전역 SCSS에 페이지별로 작성

## 명령어

```sh
npm run dev          # 개발 서버
npm run build        # type-check(vue-tsc) + vite build 병렬 실행
npm run type-check
npm run lint         # oxlint → eslint 순서로 --fix 실행
npm run format       # prettier (src/)
npm run test:unit    # vitest (watch 모드). 1회 실행은 npx vitest run
```

## 환경 변수

- `.env`에 `VITE_TMDB_API_KEY` (TMDB **v4 Read Access Token**, `Authorization: Bearer`로 사용). `.env`는 gitignore 대상. 타입은 [env.d.ts](env.d.ts).
- 주의: `VITE_` 접두사 변수는 클라이언트 번들에 그대로 포함되므로 배포 사이트에서 토큰이 노출된 상태임.

## 구조

```
src/
  api/
    tmdb/                 # ⚠ Node 스크립트에서도 재사용 — '@/' alias, import.meta.env, 브라우저 API 금지 (상대경로만)
      client.ts           # createTmdbClient(token): GET + res.ok 확인 → TmdbError
      api.ts              # createTmdbApi(token): 엔드포인트·개수 집계 함수
      types.ts            # TMDB 응답 타입 (MovieSummary, TvSummary, MovieDetail, TvDetail, Paginated ...)
      mappers.ts          # 응답 → 화면 모델 (MediaCard, ContentDetail), tmdbImageUrl
    index.ts              # 브라우저용 tmdbApi 인스턴스 (import.meta.env는 여기서만) + 타입/매퍼 re-export
  utils/                  # 순수 함수 (테스트 대상) — date, stats, array / themeUtils
  stores/                 # Pinia setup store
    useDashboardStore.ts  # 월별/연간 개봉 영화 수
    useTrendingStore.ts   # 트렌딩 영화/TV (메인 TOP10 + 트렌딩 페이지 공유)
    useThemeStore.ts
  views/
    layouts/HeaderComp.vue
    pages/MainView.vue    # 대시보드: 카드 3개 + 월별 개봉 라인차트 + 오늘의 TOP10 바차트
    pages/TrendView.vue   # 트렌딩 영화/TV 캐러셀
    pages/DetailView.vue  # 영화/TV 상세 (store 없이 페이지 로컬 상태)
    pages/components/     # *ChartComp.vue (Bar/Line/Pie/Heatmap), mainCardComp.vue
  components/DateComp.vue # 연도 선택 (현재 미사용)
  config/                 # chartOptions(ECharts 테마), progressConfig(Quasar Loading 래퍼), quasarConfig
```

테스트는 각 폴더의 `__tests__/*.spec.ts` (vitest + jsdom).

## 데이터 흐름

- 컴포넌트 `onMounted` → store 액션 → `tmdbApi` → store 상태 → 컴포넌트에서 `storeToRefs` + `computed`로 차트 옵션/카드 생성.
- 상세처럼 한 페이지에서만 쓰는 데이터는 store에 두지 않고 컴포넌트에서 `tmdbApi` 직접 호출.
- 캐싱 없음. 페이지 진입 때마다 재요청. 로딩은 `progressConfig.show()/hide()` 전체화면 스피너.
- **메인 페이지 1회 진입 시 TMDB 요청 15회** (전부 병렬): 월별 개봉 12 + 연간(올해/작년) 2 + 트렌딩 1
- 과거에 장르별 개수·히트맵을 넣었다가 느려서 제거한 이력 있음 (commit `21c946c`).
- 향후 방향: 집계를 GitHub Actions cron 수집 스크립트로 옮기고(이때 `src/api/tmdb` 재사용) 프론트는 정적 JSON 1회만 읽는 구조로 전환 예정.

## TMDB API 주의점

- 날짜 문자열은 `utils/date.ts`의 `toDateString()` 사용. `toISOString()`은 UTC 변환이라 KST에서 하루 밀린다.
- 영화 "한국 개봉" 집계는 `release_date.gte/lte` + `region=KR` + `with_release_type=2|3`(극장).
  `primary_release_date`(전 세계 최초 개봉일)와 함께 쓰면 `region`이 무시되어 전 세계 등록 영화 수가 나온다.
- discover의 `total_results`는 **최대 20,001**로 잘린다. 큰 범위 집계는 기간을 쪼개야 한다.
- TV discover는 `first_air_date.gte/lte` (영화용 키를 쓰면 조용히 무시됨).
- 이미지 URL은 `tmdbImageUrl(path, size)` 사용 (`poster_path`는 `/`로 시작).

## 컴포넌트 주의점

- 차트 컴포넌트는 ECharts 인스턴스를 mount 시 1회 생성 → `onUpdated`에서 `setOption(..., true)`로 교체 → `onBeforeUnmount`에서 dispose. 차트 옵션은 props를 통째로 넘기므로(`{ ...props }`) prop 이름이 ECharts 옵션 키와 같아야 함.
- 차트 컴포넌트 props는 아직 런타임 선언(`type: Array/Object`)이라 타입이 느슨함.

## 컨벤션

- Prettier: 세미콜론, 작은따옴표, printWidth 100
- 주석·UI 문구는 한국어
- 커밋은 사용자가 직접 함. 메시지 형식: `feat:`, `fix:`, `style:`, `refactor:`, `docs:`, `chore:` + 한국어 설명
- 경로 alias `@` → `src/` (단, `src/api/tmdb`에서는 사용 금지)
