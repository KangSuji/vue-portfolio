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
          <p class="main__chart__title">월별 국내 극장 개봉 영화({{ currentYear }})</p>
          <LineChartComp
            :size="chartSize"
            :x-axis="monthlyXaxis"
            :series="monthlySeries"
            :legend="monthlyLegend"
            :tooltip="barTooltip"
          />
        </div>
        <div class="main__chart">
          <p class="main__chart__title">이번 주 트렌딩 영화 TOP 10</p>
          <BarChartComp
            :size="chartSize"
            :x-axis="movieXaxis"
            :series="movieSeries"
            :tooltip="barTooltip"
          />
        </div>
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
    </main>
  </q-page>
</template>
<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { getChangeRate, getMonthlySnapshot, getTopIndicesBy } from '@/utils/stats';
import progressConfig from '@/config/progressConfig';
import mainCardComp, { type Contents } from './components/mainCardComp.vue';
import BarChartComp from './components/BarChartComp.vue';
import LineChartComp from './components/LineChartComp.vue';

const dashboardStore = useDashboardStore();
const { data, baseDate, monthlyMovieCounts, yearToDateMovieCounts, trendingMovies } =
  storeToRefs(dashboardStore);

// "올해/이번 달"은 보는 사람의 현재 날짜가 아니라 데이터 수집 기준일로 판단한다
const currentYear = computed(() => (baseDate.value ?? new Date()).getFullYear());
const currentMonthIndex = computed(() => (baseDate.value ?? new Date()).getMonth());

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
  const { prev, current, next } = getMonthlySnapshot(
    monthlyMovieCounts.value,
    currentMonthIndex.value,
  );
  const { current: yearCurrent, prev: yearPrev } = yearToDateMovieCounts.value;

  return [
    {
      title: '올해 국내 개봉작',
      value: yearCurrent,
      description: '전년 같은 기간 대비 증감량',
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
  // 이미 불러온 상태면(다른 페이지에서 돌아온 경우) 로딩 표시 없이 바로 그린다
  if (data.value) return;

  progressConfig.show();
  try {
    await dashboardStore.load();
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
