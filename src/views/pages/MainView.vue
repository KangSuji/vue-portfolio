<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<template>
  <q-page>
    <main class="page_container main-container">
      <div class="main-card-wrapper">
        <template v-for="(content, index) in contents" :key="index">
          <mainCardComp icon="movie" :content="content" />
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
import { computed, onBeforeMount, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useMovieStore } from '@/stores/useMainStore';
import progressConfig from '@/config/progressConfig';
import mainCardComp, { type Contents } from './components/mainCardComp.vue';
import BarChartComp from './components/BarChartComp.vue';
import LineChartComp from './components/LineChartComp.vue';

const movieStore = useMovieStore();
const { trendMvList, monthlyMovieCount, totalMovies } = storeToRefs(movieStore);

const currentYear = new Date().getFullYear();

const chartSize = {
  width: '100%',
  height: '500px',
};

// 오늘의 트렌드 TOP 10 (x축·데이터 모두 같은 목록을 사용해야 개수가 맞음)
const top10Movies = computed(() => (trendMvList.value ?? []).slice(0, 10));

const monthlyXaxis = computed(() => {
  return [
    {
      type: 'category',
      data: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    },
  ];
});

const monthlySeries = computed(() => {
  const movieList = monthlyMovieCount.value ?? [];
  return [
    {
      name: 'Movies',
      data: movieList,
      type: 'line',
    },
  ];
});

const monthlyLegend = computed(() => {
  return {
    show: true,
    data: ['Movies'],
    textStyle: {
      color: '#fff', // Ensure text is visible
      fontSize: 12,
    },
  };
});

const movieSeries = computed(() => {
  const movieList = top10Movies.value;
  const top3Indices = movieList
    .map((value, index) => ({ value, index }))
    .sort((a, b) => b.value.popularity - a.value.popularity)
    .slice(0, 3)
    .map((item) => item.index);

  return [
    {
      data: movieList.map((value, index) => {
        const isTop3 = top3Indices.includes(index);
        return {
          value: value.popularity,
          itemStyle: {
            color: isTop3 ? '#8884D8' : '#c8c8c8',
          },
          emphasis: {
            itemStyle: {
              color: '#8884D8',
            },
          },
        };
      }),
      type: 'bar',
      barStyle: {
        max: 120,
      },
      itemStyle: {
        borderRadius: [8, 8, 0, 0],
        color: '#8884D8',
      },
    },
  ];
});

const movieXaxis = computed(() => {
  return [{ type: 'category', data: top10Movies.value.map((item) => item.title) }];
});

const barTooltip = computed(() => {
  {
    return {
      trigger: 'item',
      borderWidth: 0,
      padding: 0,
      backgroundColor: 'transparent',
      formatter: (params) => {
        return `
              <div class="tooltip_style">
                <p class="name">${params.name}</p>
                <p class="data">${params.value}</p>
              </div>
            `;
      },
      position: function (point, params, dom, rect, size) {
        return [point[0] + 20, point[1] - 30];
      },
    };
  }
});

const getIncreaseCnt = (prev, current): number => {
  const increasePercentage: number = prev
    ? parseFloat((((current - prev) / prev) * 100).toFixed(2))
    : 0;
  return increasePercentage;
};

const fetchMovieCnt = async () => {
  const [current, prev] = await Promise.all([
    movieStore.fetchMonthlyMovieReleases(currentYear),
    movieStore.fetchMonthlyMovieReleases(currentYear - 1),
  ]);

  return { current, prev };
};
const movieCnt = ref({
  current: 0,
  prev: 0,
});

// card
const contents = computed((): Contents[] => {
  const currentMonthReleases = monthlyMovieCount.value[new Date().getMonth()] ?? 0; // 이번 달 개봉작 수
  const previousMonthReleases = monthlyMovieCount.value[new Date().getMonth() - 1] ?? 0; // 전월 개봉작 수
  const nextMonthRelesase = monthlyMovieCount.value[new Date().getMonth() + 1] ?? 0;

  const increase = getIncreaseCnt(previousMonthReleases, currentMonthReleases); // 전월 대비 증감량
  const nextIncrease = getIncreaseCnt(currentMonthReleases, nextMonthRelesase); // 다음달 대비 증감량
  const yearIncrease = getIncreaseCnt(movieCnt.value.prev, movieCnt.value.current);

  return [
    {
      title: '이번 년도 영화 개봉작',
      conent: movieCnt.value.current,
      discription: '이번 년도 개봉한 영화 수',
      icon: 'movie',
      increase: yearIncrease,
    },
    {
      title: '이번달 개봉작',
      conent: currentMonthReleases,
      discription: '전월 대비 개봉작 증감량',
      icon: 'moving',
      increase: increase,
    },
    {
      title: '다음달 개봉 예정작',
      conent: nextMonthRelesase,
      increase: nextIncrease,
      icon: 'event',
      discription: '',
    },
  ];
});

const getMovieList = async () => {
  progressConfig.show();

  // 세 요청 그룹은 서로 의존하지 않으므로 한 번에 병렬로 보낸다.
  // (기존: fetchMovieCnt가 then 안에서 체이닝되지 않아 로딩이 먼저 닫히고 에러도 잡히지 않았음)
  try {
    const [, , cnt] = await Promise.all([
      movieStore.fetchMonthlyMovieCounts(currentYear),
      movieStore.searchTrendMovieByDay(),
      fetchMovieCnt(),
    ]);
    movieCnt.value = cnt;
  } catch (error) {
    console.error(error);
  } finally {
    progressConfig.hide();
  }
};

onMounted(() => {
  getMovieList();
});

onBeforeMount(() => movieStore.$reset());
</script>
