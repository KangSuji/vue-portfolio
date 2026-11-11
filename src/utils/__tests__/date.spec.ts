// 날짜 문자열은 로컬 시간대 기준으로 만들어야 하므로 KST에서 검증한다
process.env.TZ = 'Asia/Seoul';

import { describe, it, expect } from 'vitest';
import { getMonthRanges, getYearRange, getYearToDateRange, toDateString } from '../date';

describe('toDateString', () => {
  it('KST 자정 기준 날짜를 하루 밀리지 않고 반환한다', () => {
    expect(toDateString(new Date(2025, 0, 1))).toBe('2025-01-01');
    expect(toDateString(new Date(2025, 11, 31))).toBe('2025-12-31');
  });
});

describe('getYearRange', () => {
  it('1월 1일 ~ 12월 31일을 반환한다', () => {
    expect(getYearRange(2025)).toEqual({ gte: '2025-01-01', lte: '2025-12-31' });
  });
});

describe('getYearToDateRange', () => {
  it('1월 1일부터 기준일까지', () => {
    expect(getYearToDateRange(new Date(2026, 10, 11))).toEqual({
      gte: '2026-01-01',
      lte: '2026-11-11',
    });
  });

  it('전년 같은 기간', () => {
    expect(getYearToDateRange(new Date(2026, 10, 11), -1)).toEqual({
      gte: '2025-01-01',
      lte: '2025-11-11',
    });
  });

  it('윤년 2월 29일의 전년 동기는 2월 28일', () => {
    expect(getYearToDateRange(new Date(2028, 1, 29), -1).lte).toBe('2027-02-28');
  });
});

describe('getMonthRanges', () => {
  it('12개월의 1일 ~ 말일 범위를 반환한다', () => {
    const ranges = getMonthRanges(2024);

    expect(ranges).toHaveLength(12);
    expect(ranges[0]).toEqual({ gte: '2024-01-01', lte: '2024-01-31' });
    expect(ranges[1]).toEqual({ gte: '2024-02-01', lte: '2024-02-29' }); // 윤년
    expect(ranges[11]).toEqual({ gte: '2024-12-01', lte: '2024-12-31' });
  });
});
