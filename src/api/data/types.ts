/**
 * 수집 스크립트(scripts/collect.ts)가 생성하고 프론트가 읽는 정적 JSON 스키마
 * - 스크립트와 앱이 같은 타입을 공유한다. (상대경로 import만 사용)
 * - 스키마를 바꾸면 SCHEMA_VERSION을 올리고 수집을 다시 실행한다.
 */
import type { TimeWindow } from '../tmdb/types';
import type { ContentDetail, MediaCard } from '../tmdb/mappers';

export const SCHEMA_VERSION = 2;

export interface GenreCount {
  id: number;
  name: string;
  count: number;
}

/** public/data/dashboard.json */
export interface DashboardData {
  schemaVersion: typeof SCHEMA_VERSION;
  /** 수집 시각 (ISO 8601, UTC) */
  generatedAt: string;
  /** 집계 기준일 'YYYY-MM-DD' (KST). 화면의 "이번 달/올해"는 이 날짜 기준 */
  baseDate: string;
  movies: {
    /**
     * 월별 한국 극장 개봉 영화 수 (index 0 = 1월)
     * - current: baseDate 연도. baseDate 이후 달은 등록된 개봉 예정작만 포함되어 확정치가 아님
     * - prev: 전년도
     */
    monthlyCounts: { current: number[]; prev: number[] };
    /**
     * 연초 ~ baseDate 개봉작의 장르별 편수 (많은 순)
     * - 한 영화가 여러 장르에 속하면 각 장르에 모두 집계된다 (합계 ≠ 전체 편수)
     */
    genreCounts: GenreCount[];
    /**
     * 연초 ~ baseDate 누적 개봉 영화 수(current)와 전년 같은 기간(prev)
     * (올해 전체와 작년 전체를 비교하면 연말 전에는 항상 감소로 보이므로 동기 비교)
     */
    yearToDateCounts: { current: number; prev: number };
  };
  trending: {
    timeWindow: TimeWindow;
    movies: MediaCard[];
    tvShows: MediaCard[];
  };
}

/** public/data/detail/{movie|tv}/{id}.json */
export type DetailData = ContentDetail;
