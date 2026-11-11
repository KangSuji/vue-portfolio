/**
 * TMDB 응답 → 화면용 모델 변환
 * - 영화(title, release_date)와 TV(name, first_air_date)의 필드명 차이를 여기서 흡수한다.
 */
import type { Genre, MediaType, MovieDetail, MovieSummary, TvDetail, TvSummary } from './types';

const IMAGE_BASE_URL = 'https://media.themoviedb.org/t/p';

export type ImageSize = 'w220_and_h330_face' | 'w300' | 'w500' | 'w780' | 'original';

/** 이미지 경로 → 전체 URL. TMDB 경로는 '/'로 시작하므로 그대로 이어 붙인다. */
export function tmdbImageUrl(
  path: string | null | undefined,
  size: ImageSize = 'w220_and_h330_face',
): string {
  return path ? `${IMAGE_BASE_URL}/${size}${path}` : '';
}

/** 평점 소수 첫째 자리 (0~10) */
function formatRating(voteAverage: number | undefined): number {
  return Number((voteAverage ?? 0).toFixed(1));
}

// ── 목록 카드 ─────────────────────────────────────────

export interface MediaCard {
  id: number;
  mediaType: MediaType;
  title: string;
  image: string;
  description: string;
  releaseDate: string;
  rating: number;
  /** TMDB 인기도 점수 (대시보드 TOP10 차트 값) */
  popularity: number;
}

export function movieToCard(movie: MovieSummary): MediaCard {
  return {
    id: movie.id,
    mediaType: 'movie',
    title: movie.title,
    image: tmdbImageUrl(movie.poster_path),
    description: movie.overview,
    releaseDate: movie.release_date,
    rating: formatRating(movie.vote_average),
    popularity: movie.popularity,
  };
}

export function tvToCard(tv: TvSummary): MediaCard {
  return {
    id: tv.id,
    mediaType: 'tv',
    title: tv.name,
    image: tmdbImageUrl(tv.poster_path),
    description: tv.overview,
    releaseDate: tv.first_air_date,
    rating: formatRating(tv.vote_average),
    popularity: tv.popularity,
  };
}

// ── 상세 ─────────────────────────────────────────────

export interface ContentDetail {
  id: number;
  mediaType: MediaType;
  title: string;
  originalTitle: string;
  tagline: string;
  genres: Genre[];
  rating: number;
  releaseDate: string;
  overview: string;
  posterUrl: string;
  backdropUrl: string;
  homepage: string;
  /** 영화 전용 (분) */
  runtime?: number | null;
  /** TV 전용 */
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
}

export function movieDetailToContent(movie: MovieDetail): ContentDetail {
  return {
    id: movie.id,
    mediaType: 'movie',
    title: movie.title,
    originalTitle: movie.original_title,
    tagline: movie.tagline,
    genres: movie.genres ?? [],
    rating: formatRating(movie.vote_average),
    releaseDate: movie.release_date,
    overview: movie.overview,
    posterUrl: tmdbImageUrl(movie.poster_path),
    backdropUrl: tmdbImageUrl(movie.backdrop_path, 'w780'),
    homepage: movie.homepage,
    runtime: movie.runtime,
  };
}

export function tvDetailToContent(tv: TvDetail): ContentDetail {
  return {
    id: tv.id,
    mediaType: 'tv',
    title: tv.name,
    originalTitle: tv.original_name,
    tagline: tv.tagline,
    genres: tv.genres ?? [],
    rating: formatRating(tv.vote_average),
    releaseDate: tv.first_air_date,
    overview: tv.overview,
    posterUrl: tmdbImageUrl(tv.poster_path),
    backdropUrl: tmdbImageUrl(tv.backdrop_path, 'w780'),
    homepage: tv.homepage,
    numberOfSeasons: tv.number_of_seasons,
    numberOfEpisodes: tv.number_of_episodes,
  };
}
