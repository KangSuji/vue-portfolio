import { computed, ref } from 'vue';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { fetchDashboard, type DashboardData } from '@/api';

/**
 * 대시보드 데이터 (public/data/dashboard.json)
 * - 메인 대시보드와 트렌딩 페이지가 같은 파일을 공유한다.
 * - 주 1회 갱신되는 정적 데이터이므로 앱 실행 중 한 번만 불러온다.
 */
export const useDashboardStore = defineStore('dashboard', () => {
  const data = ref<DashboardData | null>(null);
  let pending: Promise<void> | null = null;

  /** 이미 불러왔으면 재요청하지 않음. 동시에 여러 번 호출돼도 요청은 1회 */
  function load(): Promise<void> {
    if (data.value) return Promise.resolve();
    pending ??= fetchDashboard()
      .then((res) => {
        data.value = res;
      })
      .finally(() => {
        pending = null;
      });
    return pending;
  }

  const baseDate = computed(() =>
    data.value ? new Date(`${data.value.baseDate}T00:00:00`) : null,
  );
  const monthlyMovieCounts = computed(
    () => data.value?.movies.monthlyCounts ?? { current: [], prev: [] },
  );
  const genreCounts = computed(() => data.value?.movies.genreCounts ?? []);
  const yearToDateMovieCounts = computed(
    () => data.value?.movies.yearToDateCounts ?? { current: 0, prev: 0 },
  );
  const trendingMovies = computed(() => data.value?.trending.movies ?? []);
  const trendingTvShows = computed(() => data.value?.trending.tvShows ?? []);

  return {
    data,
    load,
    baseDate,
    monthlyMovieCounts,
    yearToDateMovieCounts,
    genreCounts,
    trendingMovies,
    trendingTvShows,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDashboardStore, import.meta.hot));
}
