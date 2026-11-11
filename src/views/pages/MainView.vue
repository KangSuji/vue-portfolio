<template>
  <q-page>
    <main class="page_container main-container">
      <div class="main-card-wrapper">
        <template v-for="content in contents" :key="content.title">
          <mainCardComp :content="content" />
        </template>
      </div>

      <div class="main-chart-wrapper">
        <div class="main__chart">
          <p class="main__chart__title">월별 개봉 영화({{ currentYear }})</p>
          <LineChartComp
            :size="chartSize"
            :x-axis="monthlyXaxis"
            :series="monthlySeries"
            :legend="monthlyLegend"
            :tooltip="barTooltip"
          />
        </div>
        <div class="main__chart">
          <p class="main__chart__title">오늘의 영화 순위 TOP 10</p>
          <BarChartComp
            :size="chartSize"
            :x-axis="movieXaxis"
            :series="movieSeries"
            :tooltip="barTooltip"
          />
        </div>
      </div>
    </main>
  </q-page>
</template>
<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useTrendingStore } from '@/stores/useTrendingStore';
import { getChangeRate, getMonthlySnapshot, getTopIndicesBy } from '@/utils/stats';
import progressConfig from '@/config/progressConfig';
import mainCardComp, { type Contents } from './components/mainCardComp.vue';
import BarChartComp from './components/BarChartComp.vue';
import LineChartComp from './components/LineChartComp.vue';

const dashboardStore = useDashboardStore();
const trendingStore = useTrendingStore();
const { monthlyMovieCounts, yearlyMovieCounts } = storeToRefs(dashboardStore);
const { movies: trendingMovies } = storeToRefs(trendingStore);

const currentYear = new Date().getFullYear();
const currentMonthIndex = new Date().getMonth();

const chartSize = {
  width: '100%',
  height: '500px',
};

// ── 월별 개봉 라인 차트 ─────────────────────────────────
const monthlyXaxis = computed(() => [
  {
    type: 'category',
    data: Array.from({ length: 12 }, (_, i) => `${i + 1}월`),
  },
]);

const monthlySeries = computed(() => [
  {
    name: 'Movies',
    data: monthlyMovieCounts.value,
    type: 'line',
  },
]);

const monthlyLegend = computed(() => ({
  show: true,
  data: ['Movies'],
  textStyle: {
    color: '#fff',
    fontSize: 12,
  },
}));

// ── 오늘의 TOP 10 바 차트 ───────────────────────────────
// x축·데이터 모두 같은 목록을 사용해야 개수가 맞음
const top10Movies = computed(() => trendingMovies.value.slice(0, 10));

const movieSeries = computed(() => {
  const movieList = top10Movies.value;
  // popularity 상위 3개만 강조 색상
  const top3Indices = getTopIndicesBy(movieList, 3, (movie) => movie.popularity);

  return [
    {
      data: movieList.map((movie, index) => ({
        value: movie.popularity,
        itemStyle: {
          color: top3Indices.includes(index) ? '#8884D8' : '#c8c8c8',
        },
        emphasis: {
          itemStyle: {
            color: '#8884D8',
          },
        },
      })),
      type: 'bar',
      itemStyle: {
        borderRadius: [8, 8, 0, 0],
        color: '#8884D8',
      },
    },
  ];
});

const movieXaxis = computed(() => [
  { type: 'category', data: top10Movies.value.map((movie) => movie.title) },
]);

const barTooltip = {
  trigger: 'item',
  borderWidth: 0,
  padding: 0,
  backgroundColor: 'transparent',
  formatter: (params: { name: string; value: number }) => `
    <div class="tooltip_style">
      <p class="name">${params.name}</p>
      <p class="data">${params.value}</p>
    </div>
  `,
  position: (point: number[]) => [point[0] + 20, point[1] - 30],
};

// ── 요약 카드 ───────────────────────────────────────────
const contents = computed((): Contents[] => {
  const { prev, current, next } = getMonthlySnapshot(monthlyMovieCounts.value, currentMonthIndex);
  const { current: yearCurrent, prev: yearPrev } = yearlyMovieCounts.value;

  return [
    {
      title: '이번 년도 영화 개봉작',
      value: yearCurrent,
      description: '이번 년도 개봉한 영화 수',
      icon: 'movie',
      increase: getChangeRate(yearPrev, yearCurrent),
    },
    {
      title: '이번달 개봉작',
      value: current,
      description: '전월 대비 개봉작 증감량',
      icon: 'moving',
      increase: getChangeRate(prev, current),
    },
    {
      title: '다음달 개봉 예정작',
      // 12월이면 다음달(내년 1월) 데이터가 없음
      value: next ?? '-',
      description: '이번달 대비 개봉 예정작 증감량',
      icon: 'event',
      increase: next === null ? null : getChangeRate(current, next),
    },
  ];
});

// ── 데이터 조회 ─────────────────────────────────────────
const fetchDashboard = async () => {
  progressConfig.show();
  try {
    // 서로 의존하지 않으므로 병렬로 요청
    await Promise.all([
      dashboardStore.fetchMonthlyMovieCounts(currentYear),
      dashboardStore.fetchYearlyMovieCounts(currentYear),
      trendingStore.fetchMovies('day'),
    ]);
  } catch (error) {
    console.error(error);
  } finally {
    progressConfig.hide();
  }
};

onMounted(() => {
  fetchDashboard();
});
</script>
