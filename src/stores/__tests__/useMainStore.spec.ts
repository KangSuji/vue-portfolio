// 날짜 문자열은 로컬 시간대 기준으로 만들어야 하므로 KST에서 검증한다
process.env.TZ = 'Asia/Seoul';

import { describe, it, expect } from 'vitest';
import { getMonthRanges, toDateString } from '../useMainStore';

describe('toDateString', () => {
  it('KST 자정 기준 날짜를 하루 밀리지 않고 반환한다', () => {
    expect(toDateString(new Date(2025, 0, 1))).toBe('2025-01-01');
    expect(toDateString(new Date(2025, 11, 31))).toBe('2025-12-31');
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
