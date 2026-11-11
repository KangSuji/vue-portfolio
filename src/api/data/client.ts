/**
 * 정적 JSON 조회 (public/data — scripts/collect.ts가 생성)
 * - 앱은 TMDB를 직접 호출하지 않으므로 클라이언트 번들에 토큰이 없다.
 */
import type { MediaType } from '../tmdb/types';
import type { DashboardData, DetailData } from './types';

const DATA_BASE_URL = `${import.meta.env.BASE_URL}data`;

export class DataNotFoundError extends Error {
  constructor(path: string) {
    super(`데이터를 찾을 수 없습니다: ${path}`);
    this.name = 'DataNotFoundError';
  }
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${DATA_BASE_URL}${path}`);
  // SPA fallback 설정에 따라 없는 파일 요청에 index.html이 200으로 올 수 있으므로 content-type도 확인
  const isJson = res.headers.get('content-type')?.includes('application/json');
  if (res.status === 404 || (res.ok && !isJson)) throw new DataNotFoundError(path);
  if (!res.ok) throw new Error(`데이터 요청 실패 (${res.status}): ${path}`);
  return (await res.json()) as T;
}

export const fetchDashboard = () => getJson<DashboardData>('/dashboard.json');

export const fetchContentDetail = (mediaType: MediaType, id: number) =>
  getJson<DetailData>(`/detail/${mediaType}/${id}.json`);
