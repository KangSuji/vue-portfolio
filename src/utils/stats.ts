/**
 * 증감률(%) — 소수 둘째 자리까지
 * @returns 비교 기준(prev)이 없거나 0이면 계산할 수 없으므로 null
 */
export function getChangeRate(prev: number | null | undefined, current: number): number | null {
  if (!prev) return null;
  return Number((((current - prev) / prev) * 100).toFixed(2));
}

/**
 * 월별 개수 배열에서 기준 월과 앞뒤 달의 값을 꺼낸다.
 * - 1월의 전월(작년 12월), 12월의 다음달(내년 1월)은 같은 연도 배열에 없으므로 null
 *   (0으로 두면 "0편"처럼 실제 값으로 오해할 수 있음)
 */
export function getMonthlySnapshot(monthlyCounts: number[], monthIndex: number) {
  const valueAt = (index: number) =>
    index >= 0 && index < 12 ? (monthlyCounts[index] ?? null) : null;

  return {
    prev: valueAt(monthIndex - 1),
    current: valueAt(monthIndex) ?? 0,
    next: valueAt(monthIndex + 1),
  };
}

/** score 기준 상위 n개 항목의 (원래 배열) 인덱스 */
export function getTopIndicesBy<T>(list: T[], n: number, score: (item: T) => number): number[] {
  return list
    .map((item, index) => ({ index, score: score(item) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map(({ index }) => index);
}
