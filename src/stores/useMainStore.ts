import { defineStore } from 'pinia';

enum APIUrl {
  trend = 'https://api.themoviedb.org/3/trending',
  discover = 'https://api.themoviedb.org/3/discover',
  movie = 'https://api.themoviedb.org/3/movie',
  tv = 'https://api.themoviedb.org/3/tv',
}

const apiKey = import.meta.env.VITE_TMDB_API_KEY;

const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${apiKey}`,
  },
};

const state = () => ({
  trendMvList: [] as any,
  trendTvList: [] as any,
  monthlyMovieCount: [] as number[],
  monthlyTVCount: [] as number[],
  totalMovies: 0 as number,
  monthlyMovieReleases: [] as any[], // 새로운 상태 추가
  trendList: [] as any,
  movieDetil: {} as any,
  tvDetail: {} as any,
});

const store = {
  id: 'useMovieStore',
  state,
  actions: {
    searchTrendMovieByDay,
    searchTrendTvByDay,
    fetchMonthlyMovieCounts,
    fetchMonthlyTvCounts,
    fetchMonthlyMovieReleases,
    getTrendingAllList,
    getContentDetail,
  },
};
export const useMovieStore = defineStore('useMovieStore', store);

/**
 * TMDB 요청 공통 함수
 * - fetch는 4xx/5xx에서도 reject 되지 않으므로 res.ok를 직접 확인해 에러로 던진다.
 *   (확인하지 않으면 401 응답 JSON이 정상 데이터처럼 store에 들어감)
 */
async function request<T = any>(url: string): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`TMDB 요청 실패 (${res.status}): ${url}`);
  }
  return res.json();
}

/**
 * Date → 'YYYY-MM-DD' (로컬 시간 기준)
 * - toISOString()은 UTC로 변환하므로 KST(+9)에서는 하루 전 날짜가 나온다.
 *   예) new Date(2025, 0, 1).toISOString() → '2024-12-31T15:00:00.000Z'
 */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 오늘 트랜드 영화
async function searchTrendMovieByDay() {
  const res = await request(`${APIUrl.trend}/movie/day?language=ko-KR`);
  useMovieStore().trendMvList = res.results ?? [];
}

// 오늘 트랜드 TV 시리즈
async function searchTrendTvByDay() {
  const res = await request(`${APIUrl.trend}/tv/day?language=ko-KR`);
  useMovieStore().trendTvList = res.results ?? [];
}

export function getMonthRanges(year: number) {
  const ranges: { gte: string; lte: string }[] = [];
  for (let month = 0; month < 12; month++) {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0); // 해당 월의 마지막 날
    ranges.push({ gte: toDateString(start), lte: toDateString(end) });
  }
  return ranges;
}

// 이번년도 월별 개봉작(예정작)
async function fetchMonthlyMovieCounts(year: number): Promise<void> {
  // 월별 요청은 서로 독립적이므로 병렬로 보낸다 (순차 12회 → 동시 12회)
  const counts = await Promise.all(
    getMonthRanges(year).map(({ gte, lte }) =>
      request(
        `${APIUrl.discover}/movie?primary_release_date.gte=${gte}&primary_release_date.lte=${lte}&language=ko-KR&region=KR`,
      ).then((res) => res.total_results ?? 0),
    ),
  );
  useMovieStore().monthlyMovieCount = counts;
}

// 입력 년도 총 개봉작
async function fetchMonthlyMovieReleases(year: number): Promise<number> {
  const gte = toDateString(new Date(year, 0, 1)); // 1월 1일
  const lte = toDateString(new Date(year, 12, 0)); // 12월 31일

  const res = await request(
    `${APIUrl.discover}/movie?primary_release_date.gte=${gte}&primary_release_date.lte=${lte}&language=ko-KR&region=KR`,
  );

  return res.total_results ?? 0;
}

// 이번년도 월별 TV개봉작(예정작)
async function fetchMonthlyTvCounts(year: number): Promise<void> {
  // TV는 primary_release_date가 아닌 first_air_date로 필터링해야 한다
  // (잘못된 파라미터는 무시되어 매달 전체 개수가 반환됨)
  const counts = await Promise.all(
    getMonthRanges(year).map(({ gte, lte }) =>
      request(
        `${APIUrl.discover}/tv?first_air_date.gte=${gte}&first_air_date.lte=${lte}&language=ko-KR`,
      ).then((res) => res.total_results ?? 0),
    ),
  );

  useMovieStore().monthlyTVCount = counts;
}

async function getTrendingAllList() {
  const res = await request(`${APIUrl.trend}/all/day?language=ko-KR`);

  useMovieStore().trendList = res;
}

// 영화/TV 상세 정보 가져오기
async function getContentDetail(id: number, category: string) {
  if (category === 'movie') {
    useMovieStore().movieDetil = await request(`${APIUrl.movie}/${id}?language=ko-KR`);
  } else {
    useMovieStore().tvDetail = await request(`${APIUrl.tv}/${id}?language=ko-KR`);
  }
}
