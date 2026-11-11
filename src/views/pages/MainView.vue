<template>
  <q-page>
    <main class="page_container main-container">
      <!-- 오류: 다시 시도 -->
      <div v-if="status === 'error'" class="main-error" role="alert">
        <p>대시보드 데이터를 불러오지 못했습니다.</p>
        <q-btn
          outline
          no-caps
          class="main-error__retry"
          label="다시 시도"
          @click="fetchDashboard"
        />
      </div>

      <template v-else>
        <!-- 요약 카드 -->
        <div class="main-card-wrapper">
          <template v-if="status === 'ready'">
            <mainCardComp v-for="content in contents" :key="content.title" :content="content" />
          </template>
          <template v-else>
            <div v-for="n in 3" :key="n" class="main__card" aria-hidden="true">
              <!-- 실제 카드와 같은 높이로 맞춰 로딩 후 레이아웃이 흔들리지 않게 -->
              <q-skeleton type="rect" width="40%" height="20px" :dark="isDark" />
              <q-skeleton type="rect" width="30%" height="38px" :dark="isDark" />
              <q-skeleton type="rect" width="55%" height="20px" :dark="isDark" />
            </div>
          </template>
        </div>

        <!-- 차트 -->
        <div class="main-chart-wrapper">
          <section class="main__chart main__chart--full">
            <h2 class="main__chart__title">월별 국내 극장 개봉 영화</h2>
            <p class="main__chart__caption">
              {{ currentYear }}년과 {{ currentYear - 1 }}년 비교 · 점선은 현재 등록된 개봉 예정작
              기준으로 확정치가 아닙니다
            </p>
            <LineChartComp v-if="status === 'ready'" :size="lineChartSize" v-bind="monthlyChart" />
            <q-skeleton v-else type="rect" :height="lineChartSize.height" :dark="isDark" />
          </section>

          <section class="main__chart">
            <h2 class="main__chart__title">이번 주 트렌딩 영화 TOP 10</h2>
            <p class="main__chart__caption">TMDB 인기도 점수 순 · 막대를 누르면 상세 정보로 이동</p>
            <BarChartComp
              v-if="status === 'ready'"
              :size="barChartSize"
              v-bind="top10Chart"
              @item-click="onClickTop10"
            />
            <q-skeleton v-else type="rect" :height="barChartSize.height" :dark="isDark" />
          </section>

          <section class="main__chart">
            <h2 class="main__chart__title">올해 국내 개봉작 장르 TOP 10</h2>
            <p class="main__chart__caption">
              1월 1일 ~ 기준일 · 한 작품이 여러 장르에 속하면 각각 집계
            </p>
            <BarChartComp v-if="status === 'ready'" :size="barChartSize" v-bind="genreChart" />
            <q-skeleton v-else type="rect" :height="barChartSize.height" :dark="isDark" />
          </section>
        </div>

        <div v-if="data" class="main-data-info">
          <p>데이터 기준일 {{ data.baseDate }} · 매주 갱신</p>
          <!-- TMDB API 이용 약관의 출처 표기 -->
          <p>
            This product uses the
            <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">TMDB</a>
            API but is not endorsed or certified by TMDB.
          </p>
        </div>
      </template>
    </main>
  </q-page>
</template>
<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { useChartPalette } from '@/config/chartPalette';
import { monthlyComparisonChart, rankedBarChart } from '@/config/dashboardCharts';
import { getChangeRate, getMonthlySnapshot } from '@/utils/stats';
import mainCardComp, { type Contents } from './components/mainCardComp.vue';
import BarChartComp from './components/BarChartComp.vue';
import LineChartComp from './components/LineChartComp.vue';

const router = useRouter();
const dashboardStore = useDashboardStore();
const themeStore = useThemeStore();
const { data, baseDate, monthlyMovieCounts, yearToDateMovieCounts, genreCounts, trendingMovies } =
  storeToRefs(dashboardStore);

const palette = useChartPalette();
const isDark = computed(() => themeStore.theme !== 'light');

// ── 상태 ───────────────────────────────────────────────
const hasError = ref(false);
const status = computed<'loading' | 'error' | 'ready'>(() => {
  if (data.value) return 'ready';
  return hasError.value ? 'error' : 'loading';
});

const fetchDashboard = async () => {
  hasError.value = false;
  try {
    // 이미 불러왔으면 store에서 바로 반환 (페이지 재진입 시 재요청 없음)
    await dashboardStore.load();
  } catch (error) {
    console.error(error);
    hasError.value = true;
  }
};

onMounted(fetchDashboard);

// "올해/이번 달"은 보는 사람의 현재 날짜가 아니라 데이터 수집 기준일로 판단한다
const currentYear = computed(() => (baseDate.value ?? new Date()).getFullYear());
const currentMonthIndex = computed(() => (baseDate.value ?? new Date()).getMonth());

const lineChartSize = { width: '100%', height: '360px' };
const barChartSize = { width: '100%', height: '440px' };

// ── 요약 카드 ───────────────────────────────────────────
const contents = computed((): Contents[] => {
  const monthly = monthlyMovieCounts.value;
  const snapshot = getMonthlySnapshot(monthly.current, currentMonthIndex.value);
  const { current, next } = snapshot;
  // 1월의 전월은 작년 12월
  const prev = snapshot.prev ?? (currentMonthIndex.value === 0 ? (monthly.prev[11] ?? null) : null);
  const ytd = yearToDateMovieCounts.value;

  return [
    {
      title: '올해 국내 개봉작',
      icon: 'movie',
      value: ytd.current,
      unit: '편',
      increase: getChangeRate(ytd.prev, ytd.current),
      comparisonLabel: '전년 같은 기간 대비',
      caption: '1월 1일 ~ 기준일',
    },
    {
      title: '이번 달 개봉작',
      icon: 'moving',
      value: current,
      unit: '편',
      increase: getChangeRate(prev, current),
      comparisonLabel: '전월 대비',
      caption: '전월 데이터 없음',
    },
    {
      // 다음 달은 아직 등록되지 않은 개봉작이 많아 이번 달과 비교하면 항상 감소로 보이므로 증감률을 표시하지 않는다
      title: '다음 달 개봉 예정작',
      icon: 'event',
      value: next,
      unit: next === null ? undefined : '편',
      caption: next === null ? '내년 데이터는 1월에 집계' : '현재 등록된 예정작 기준',
    },
  ];
});

// ── 차트 ───────────────────────────────────────────────
const monthlyChart = computed(() =>
  monthlyComparisonChart(palette.value, {
    year: currentYear.value,
    current: monthlyMovieCounts.value.current,
    prev: monthlyMovieCounts.value.prev,
    baseMonthIndex: currentMonthIndex.value,
  }),
);

// 트렌딩 상위 10편을 인기도 순으로 정렬 (트렌딩 순위와 인기도 점수는 다른 지표라
// 순위 순서 그대로 두면 강조색과 막대 길이가 어긋남)
const top10Movies = computed(() =>
  trendingMovies.value.slice(0, 10).sort((a, b) => b.popularity - a.popularity),
);

const top10Chart = computed(() =>
  rankedBarChart(palette.value, {
    labels: top10Movies.value.map((movie) => movie.title),
    values: top10Movies.value.map((movie) => movie.popularity),
    highlightTop: 3,
    valueLabel: '인기도 점수',
    clickable: true,
  }),
);

const genreChart = computed(() => {
  const top10Genres = genreCounts.value.slice(0, 10);
  return rankedBarChart(palette.value, {
    labels: top10Genres.map((genre) => genre.name),
    values: top10Genres.map((genre) => genre.count),
    valueSuffix: '편',
    valueLabel: '개봉',
  });
});

const onClickTop10 = (index: number) => {
  const movie = top10Movies.value[index];
  if (!movie) return;
  router.push({ name: 'detail', params: { category: movie.mediaType, id: movie.id } });
};
</script>
