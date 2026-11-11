/**
 * 브라우저용 TMDB API 인스턴스
 * - import.meta.env는 이 파일에서만 사용한다. (src/api/tmdb/*는 Node 스크립트에서도 재사용)
 */
import { createTmdbApi } from './tmdb/api';

export const tmdbApi = createTmdbApi(import.meta.env.VITE_TMDB_API_KEY);

export { TmdbError } from './tmdb/client';
export type * from './tmdb/types';
export * from './tmdb/mappers';
