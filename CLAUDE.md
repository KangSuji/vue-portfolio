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
npm run test:unit    # vitest (현재 실질적인 테스트 없음)
```

## 환경 변수

- `.env`에 `VITE_TMDB_API_KEY` (TMDB **v4 Read Access Token**, `Authorization: Bearer`로 사용). `.env`는 gitignore 대상.
- 주의: `VITE_` 접두사 변수는 클라이언트 번들에 그대로 포함되므로 배포 사이트에서 토큰이 노출된 상태임.

## 구조

```
src/
  main.ts                 # Quasar/Pinia/Router 설정, 아이콘 폰트·전역 스타일 import
  App.vue                 # q-layout + HeaderComp + RouterView, 테마 로드
  router/index.ts         # / (main), /trend, /detail/:category/:id, /about
  stores/
    useMainStore.ts       # useMovieStore: TMDB fetch 로직 전부 + 상태 (옵션 객체 스타일, 액션은 모듈 함수)
    useThemeStore.ts      # 테마 상태
    counter.ts            # 템플릿 잔재 (미사용)
  views/
    layouts/HeaderComp.vue
    pages/MainView.vue    # 대시보드: 카드 3개 + 월별 개봉 라인차트 + 오늘의 TOP10 바차트
    pages/TrendView.vue   # 트렌딩 영화/TV 캐러셀
    pages/DetailView.vue  # 영화/TV 상세
    pages/components/     # *ChartComp.vue (Bar/Line/Pie/Heatmap), mainCardComp.vue
  components/DateComp.vue # 연도 선택 (현재 미사용)
  config/                 # chartOptions(ECharts 테마), progressConfig(Quasar Loading 래퍼), quasarConfig
  utils/themeUtils.ts     # localStorage 기반 dark/light 테마, body--dark/body--light 클래스 토글
```

## 데이터 흐름 / API 호출 현황

- 컴포넌트 `onMounted`에서 store 액션 호출 → 액션이 `useMovieStore()`에 직접 결과 대입 → 컴포넌트는 `storeToRefs` + `computed`로 차트 옵션 생성.
- 캐싱 없음. 페이지 진입 때마다 재요청. 로딩은 `progressConfig.show()/hide()` 전체화면 스피너.
- **메인 페이지 1회 진입 시 TMDB 요청 15회** (전부 병렬):
  - `fetchMonthlyMovieCounts` — 월별 `discover/movie` 12회
  - `searchTrendMovieByDay` 1회
  - `fetchMonthlyMovieReleases` × 2 (올해/작년)
- 과거에 장르별 개수(장르 수만큼 순차 호출)·히트맵을 넣었다가 느려서 제거한 이력 있음 (commit `21c946c`).
- 향후 방향: 집계를 GitHub Actions cron 수집 스크립트로 옮기고 프론트는 정적 JSON 1회만 읽는 구조로 전환 예정.

## 주의할 점

- 모든 TMDB 호출은 store의 `request()`를 거친다 (`res.ok` 확인 후 실패 시 throw).
- 날짜 문자열은 `toDateString()` 사용. `toISOString()`은 UTC 변환이라 KST에서 하루 밀린다.
- TV discover는 `first_air_date.gte/lte`, 영화는 `primary_release_date.gte/lte`.
- 차트 컴포넌트는 ECharts 인스턴스를 mount 시 1회 생성 → `onUpdated`에서 `setOption(..., true)`로 교체 → `onBeforeUnmount`에서 dispose. 차트 옵션은 props를 통째로 넘기므로(`{ ...props }`) prop 이름이 ECharts 옵션 키와 같아야 함.
- 타입: store 상태 대부분 `any`. TMDB 응답 타입 정의 없음.

## 컨벤션

- Prettier: 세미콜론, 작은따옴표, printWidth 100
- 주석·UI 문구는 한국어
- 커밋 메시지: `feat:`, `fix:`, `style:`, `refactor:`, `chore:` + 한국어 설명
- 경로 alias `@` → `src/`
