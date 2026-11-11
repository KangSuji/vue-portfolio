import { ref } from 'vue';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { tmdbApi } from '@/api';

/** 메인 대시보드 집계 데이터 */
export const useDashboardStore = defineStore('dashboard', () => {
  /** 월별 개봉 영화 수 (index 0 = 1월) */
  const monthlyMovieCounts = ref<number[]>([]);
  /** 올해/작년 연간 개봉 영화 수 */
  const yearlyMovieCounts = ref({ current: 0, prev: 0 });

  async function fetchMonthlyMovieCounts(year: number) {
    monthlyMovieCounts.value = await tmdbApi.countMoviesByMonth(year);
  }

  async function fetchYearlyMovieCounts(year: number) {
    const [current, prev] = await Promise.all([
      tmdbApi.countMoviesInYear(year),
      tmdbApi.countMoviesInYear(year - 1),
    ]);
    yearlyMovieCounts.value = { current, prev };
  }

  return {
    monthlyMovieCounts,
    yearlyMovieCounts,
    fetchMonthlyMovieCounts,
    fetchYearlyMovieCounts,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDashboardStore, import.meta.hot));
}
