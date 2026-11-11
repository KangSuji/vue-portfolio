/**
 * 앱에서 사용하는 데이터 API
 * - 앱은 정적 JSON(public/data)만 읽는다. TMDB 호출은 scripts/collect.ts에서만 한다.
 * - src/api/tmdb의 createTmdbApi를 앱 코드에서 import하지 말 것 (토큰이 번들에 들어감)
 */
export { fetchDashboard, fetchContentDetail, DataNotFoundError } from './data/client';
export type * from './data/types';
export type { MediaType, TimeWindow } from './tmdb/types';
export type { MediaCard, ContentDetail } from './tmdb/mappers';
