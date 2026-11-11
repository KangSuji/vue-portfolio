import { createTmdbClient } from './client';
import { getMonthRanges, getYearRange, type DateRange } from '../../utils/date';
import type {
  MovieDetail,
  MovieSummary,
  Paginated,
  TimeWindow,
  TrendingAllItem,
  TvDetail,
  TvSummary,
} from './types';

const LANGUAGE = 'ko-KR';
const REGION = 'KR';

/**
 * TMDB 엔드포인트 모음
 * @param token TMDB v4 Read Access Token
 */
export function createTmdbApi(token: string) {
  const get = createTmdbClient(token);

  // ── 트렌딩 ───────────────────────────────────────────
  const getTrendingMovies = (timeWindow: TimeWindow = 'day') =>
    get<Paginated<MovieSummary>>(`/trending/movie/${timeWindow}`, { language: LANGUAGE });

  const getTrendingTv = (timeWindow: TimeWindow = 'day') =>
    get<Paginated<TvSummary>>(`/trending/tv/${timeWindow}`, { language: LANGUAGE });

  const getTrendingAll = (timeWindow: TimeWindow = 'day') =>
    get<Paginated<TrendingAllItem>>(`/trending/all/${timeWindow}`, { language: LANGUAGE });

  // ── 상세 ─────────────────────────────────────────────
  const getMovieDetail = (id: number) => get<MovieDetail>(`/movie/${id}`, { language: LANGUAGE });

  const getTvDetail = (id: number) => get<TvDetail>(`/tv/${id}`, { language: LANGUAGE });

  // ── 개수 집계 (discover의 total_results 사용) ─────────
  /**
   * 기간 내 한국 극장 개봉 영화 수
   * - region은 primary_release_date(전 세계 최초 개봉일)와 함께 쓰면 무시된다.
   *   지역별 개봉일로 거르려면 release_date + region 조합을 써야 한다.
   * - with_release_type 2|3 = 극장 개봉(제한/일반). 없으면 VOD·TV 공개 등도 포함된다.
   * - total_results는 최대 20,001까지만 반환되므로, 전 세계 기준 연간 집계는 쓸 수 없다.
   */
  const countMoviesReleased = async ({ gte, lte }: DateRange): Promise<number> => {
    const res = await get<Paginated<MovieSummary>>('/discover/movie', {
      'release_date.gte': gte,
      'release_date.lte': lte,
      region: REGION,
      with_release_type: '2|3',
      language: LANGUAGE,
    });
    return res.total_results;
  };

  /**
   * 기간 내 첫 방영 TV 시리즈 수
   * - TV는 primary_release_date가 아닌 first_air_date로 필터링해야 한다 (잘못된 키는 무시됨)
   */
  const countTvFirstAired = async ({ gte, lte }: DateRange): Promise<number> => {
    const res = await get<Paginated<TvSummary>>('/discover/tv', {
      'first_air_date.gte': gte,
      'first_air_date.lte': lte,
      language: LANGUAGE,
    });
    return res.total_results;
  };

  /** 연도별 월간 개봉 영화 수 (요청 12회, 병렬) */
  const countMoviesByMonth = (year: number) =>
    Promise.all(getMonthRanges(year).map(countMoviesReleased));

  /** 연도별 월간 첫 방영 TV 수 (요청 12회, 병렬) */
  const countTvByMonth = (year: number) => Promise.all(getMonthRanges(year).map(countTvFirstAired));

  /** 연도 전체 개봉 영화 수 */
  const countMoviesInYear = (year: number) => countMoviesReleased(getYearRange(year));

  return {
    getTrendingMovies,
    getTrendingTv,
    getTrendingAll,
    getMovieDetail,
    getTvDetail,
    countMoviesReleased,
    countTvFirstAired,
    countMoviesByMonth,
    countTvByMonth,
    countMoviesInYear,
  };
}

export type TmdbApi = ReturnType<typeof createTmdbApi>;
