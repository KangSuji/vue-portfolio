/**
 * TMDB HTTP 클라이언트
 * - 토큰을 인자로 받으므로 브라우저(import.meta.env)와 Node 스크립트(process.env) 양쪽에서 사용할 수 있다.
 *   이 폴더(src/api/tmdb)에서는 '@/' alias와 브라우저 전용 API를 쓰지 않는다.
 */

const DEFAULT_BASE_URL = 'https://api.themoviedb.org/3';

export type QueryParams = Record<string, string | number | boolean | undefined>;

export class TmdbError extends Error {
  readonly status: number;
  readonly path: string;

  constructor(status: number, path: string) {
    super(`TMDB 요청 실패 (${status}): ${path}`);
    this.name = 'TmdbError';
    this.status = status;
    this.path = path;
  }
}

export function createTmdbClient(token: string, baseUrl = DEFAULT_BASE_URL) {
  /**
   * GET 요청
   * - fetch는 4xx/5xx에서도 reject 되지 않으므로 res.ok를 확인해 TmdbError로 던진다.
   * - undefined 파라미터는 쿼리스트링에서 제외한다.
   */
  return async function get<T>(path: string, params: QueryParams = {}): Promise<T> {
    const url = new URL(`${baseUrl}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }

    const res = await fetch(url, {
      headers: { accept: 'application/json', Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new TmdbError(res.status, path);

    return (await res.json()) as T;
  };
}

export type TmdbGet = ReturnType<typeof createTmdbClient>;
