/**
 * TMDB 데이터 수집 → public/data/*.json
 *
 * 실행: npm run collect
 * - 환경 변수 TMDB_TOKEN (TMDB v4 Read Access Token) 필요. 로컬에서는 .env에서 자동으로 읽는다.
 * - GitHub Actions(.github/workflows/collect-data.yml)가 매주 실행하고 결과를 커밋한다.
 *
 * 출력
 * - public/data/dashboard.json            대시보드 집계 + 이번 주 트렌딩
 * - public/data/detail/{movie|tv}/{id}.json 트렌딩 작품 상세
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTmdbApi, type TmdbApi } from '../src/api/tmdb/api';
import {
  movieDetailToContent,
  movieToCard,
  tvDetailToContent,
  tvToCard,
  type MediaCard,
} from '../src/api/tmdb/mappers';
import { SCHEMA_VERSION, type DashboardData, type DetailData } from '../src/api/data/types';
import { getYearToDateRange, toDateString } from '../src/utils/date';
import { mapWithConcurrency } from '../src/utils/async';

// "이번 달/올해"는 한국 기준. (CI 러너는 UTC라 1월 1일 새벽에 연도가 어긋날 수 있음)
process.env.TZ = 'Asia/Seoul';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public', 'data');
const DETAIL_DIR = path.join(OUT_DIR, 'detail');

const TIME_WINDOW = 'week' as const;
/** 상세 조회 동시 요청 수 (TMDB rate limit 여유 확보) */
const DETAIL_CONCURRENCY = 8;

function loadToken(): string {
  try {
    // 이미 설정된 환경 변수는 덮어쓰지 않는다
    process.loadEnvFile(path.join(ROOT, '.env'));
  } catch {
    // CI에는 .env가 없음
  }
  const token = process.env.TMDB_TOKEN;
  if (!token) {
    throw new Error('환경 변수 TMDB_TOKEN이 없습니다. (.env 또는 GitHub Actions secret 확인)');
  }
  return token;
}

/** 잘못된 데이터가 커밋·배포되지 않도록 최소한의 형태를 검증한다 */
function validate(data: DashboardData) {
  const errors: string[] = [];
  if (data.movies.monthlyCounts.length !== 12) errors.push('월별 개봉 수가 12개월이 아님');
  if (data.trending.movies.length === 0) errors.push('트렌딩 영화가 비어 있음');
  if (data.trending.tvShows.length === 0) errors.push('트렌딩 TV가 비어 있음');
  if (errors.length) throw new Error(`데이터 검증 실패: ${errors.join(', ')}`);
}

async function collectDashboard(api: TmdbApi, now: Date): Promise<DashboardData> {
  const [monthlyCounts, current, prev, trendingMovies, trendingTv] = await Promise.all([
    api.countMoviesByMonth(now.getFullYear()),
    api.countMoviesReleased(getYearToDateRange(now)),
    api.countMoviesReleased(getYearToDateRange(now, -1)),
    api.getTrendingMovies(TIME_WINDOW),
    api.getTrendingTv(TIME_WINDOW),
  ]);

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: now.toISOString(),
    baseDate: toDateString(now),
    movies: {
      monthlyCounts,
      yearToDateCounts: { current, prev },
    },
    trending: {
      timeWindow: TIME_WINDOW,
      movies: trendingMovies.results.map(movieToCard),
      tvShows: trendingTv.results.map(tvToCard),
    },
  };
}

/**
 * 트렌딩 작품 상세 조회
 * - 개별 실패는 건너뛴다 (프론트에서 "상세 정보 없음"으로 처리)
 * - 절반 이상 실패하면 API 이상으로 보고 전체를 실패 처리
 */
async function collectDetails(api: TmdbApi, cards: MediaCard[]): Promise<DetailData[]> {
  const results = await mapWithConcurrency(cards, DETAIL_CONCURRENCY, async (card) => {
    try {
      return card.mediaType === 'movie'
        ? movieDetailToContent(await api.getMovieDetail(card.id))
        : tvDetailToContent(await api.getTvDetail(card.id));
    } catch (error) {
      console.warn(`  ! 상세 조회 실패 (${card.mediaType}/${card.id}):`, (error as Error).message);
      return null;
    }
  });

  const details = results.filter((detail): detail is DetailData => detail !== null);
  if (details.length < cards.length / 2) {
    throw new Error(`상세 조회 실패가 너무 많습니다 (${details.length}/${cards.length} 성공)`);
  }
  return details;
}

async function writeJson(filePath: string, data: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  // 줄바꿈·들여쓰기를 넣어 git diff로 주간 변화를 볼 수 있게 한다
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function main() {
  const startedAt = Date.now();
  const api = createTmdbApi(loadToken());
  const now = new Date();

  console.log(`▶ TMDB 수집 시작 (기준일 ${toDateString(now)}, 트렌딩 ${TIME_WINDOW})`);

  const dashboard = await collectDashboard(api, now);
  validate(dashboard);

  const cards = [...dashboard.trending.movies, ...dashboard.trending.tvShows];
  const details = await collectDetails(api, cards);

  // 트렌딩에서 빠진 작품의 상세 파일은 지운다 (이전 주 데이터는 git 이력에 남음)
  await rm(DETAIL_DIR, { recursive: true, force: true });
  await writeJson(path.join(OUT_DIR, 'dashboard.json'), dashboard);
  await Promise.all(
    details.map((detail) =>
      writeJson(path.join(DETAIL_DIR, detail.mediaType, `${detail.id}.json`), detail),
    ),
  );

  const { monthlyCounts, yearToDateCounts } = dashboard.movies;
  console.log(`  월별 개봉: ${monthlyCounts.join(', ')}`);
  console.log(`  연초~기준일 개봉: ${yearToDateCounts.current} (전년 동기 ${yearToDateCounts.prev})`);
  console.log(
    `  트렌딩: 영화 ${dashboard.trending.movies.length}, TV ${dashboard.trending.tvShows.length}`,
  );
  console.log(`  상세: ${details.length}/${cards.length}`);
  console.log(`✔ 완료 (${((Date.now() - startedAt) / 1000).toFixed(1)}s) → public/data/`);
}

main().catch((error) => {
  console.error('✖ 수집 실패:', error);
  process.exit(1);
});
