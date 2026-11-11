import { ref } from 'vue';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { tmdbApi, type MovieSummary, type TimeWindow, type TvSummary } from '@/api';

/** 트렌딩 영화/TV (메인 대시보드 TOP10, 트렌딩 페이지에서 공유) */
export const useTrendingStore = defineStore('trending', () => {
  const movies = ref<MovieSummary[]>([]);
  const tvShows = ref<TvSummary[]>([]);

  async function fetchMovies(timeWindow: TimeWindow = 'day') {
    const res = await tmdbApi.getTrendingMovies(timeWindow);
    movies.value = res.results;
  }

  async function fetchTvShows(timeWindow: TimeWindow = 'day') {
    const res = await tmdbApi.getTrendingTv(timeWindow);
    tvShows.value = res.results;
  }

  return { movies, tvShows, fetchMovies, fetchTvShows };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTrendingStore, import.meta.hot));
}
