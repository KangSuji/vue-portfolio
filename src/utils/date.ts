/** TMDB discover API의 날짜 범위 필터 (양 끝 포함, 'YYYY-MM-DD') */
export interface DateRange {
  gte: string;
  lte: string;
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

/** 해당 연도 1월 1일 ~ 12월 31일 */
export function getYearRange(year: number): DateRange {
  return {
    gte: toDateString(new Date(year, 0, 1)),
    lte: toDateString(new Date(year, 11, 31)),
  };
}

/** 해당 연도 12개월 각각의 1일 ~ 말일 */
export function getMonthRanges(year: number): DateRange[] {
  return Array.from({ length: 12 }, (_, month) => ({
    gte: toDateString(new Date(year, month, 1)),
    lte: toDateString(new Date(year, month + 1, 0)), // day 0 = 이전 달의 마지막 날
  }));
}
