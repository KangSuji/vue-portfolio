/**
 * TMDB API v3 응답 타입 (이 프로젝트에서 사용하는 필드 위주)
 * https://developer.themoviedb.org/reference
 */

export type MediaType = 'movie' | 'tv';
export type TimeWindow = 'day' | 'week';

export interface Paginated<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface Genre {
  id: number;
  name: string;
}

interface MediaBase {
  id: number;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  popularity: number;
  vote_average: number;
  vote_count: number;
  original_language: string;
  adult?: boolean;
}

/** 목록(trending, discover 등)에 나오는 영화 */
export interface MovieSummary extends MediaBase {
  media_type?: 'movie';
  title: string;
  original_title: string;
  release_date: string;
  genre_ids: number[];
}

/** 목록(trending, discover 등)에 나오는 TV 시리즈 */
export interface TvSummary extends MediaBase {
  media_type?: 'tv';
  name: string;
  original_name: string;
  first_air_date: string;
  origin_country: string[];
  genre_ids: number[];
}

export interface PersonSummary {
  media_type: 'person';
  id: number;
  name: string;
  popularity: number;
  profile_path: string | null;
}

/** trending/all 응답 항목 — media_type으로 구분 */
export type TrendingAllItem =
  | (MovieSummary & { media_type: 'movie' })
  | (TvSummary & { media_type: 'tv' })
  | PersonSummary;

interface DetailBase {
  genres: Genre[];
  homepage: string;
  tagline: string;
  status: string;
}

export interface MovieDetail extends Omit<MovieSummary, 'genre_ids' | 'media_type'>, DetailBase {
  runtime: number | null;
  budget: number;
  revenue: number;
}

export interface TvDetail extends Omit<TvSummary, 'genre_ids' | 'media_type'>, DetailBase {
  number_of_seasons: number;
  number_of_episodes: number;
  last_air_date: string | null;
}
