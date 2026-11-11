import { describe, it, expect } from 'vitest';
import { getChangeRate, getMonthlySnapshot, getTopIndicesBy } from '../stats';

describe('getChangeRate', () => {
  it('증감률을 소수 둘째 자리까지 계산한다', () => {
    expect(getChangeRate(100, 150)).toBe(50);
    expect(getChangeRate(3, 2)).toBe(-33.33);
  });

  it('비교 기준이 0이거나 없으면 null', () => {
    expect(getChangeRate(0, 10)).toBeNull();
    expect(getChangeRate(null, 10)).toBeNull();
  });
});

describe('getMonthlySnapshot', () => {
  const counts = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];

  it('기준 월과 앞뒤 달 값을 반환한다', () => {
    expect(getMonthlySnapshot(counts, 5)).toEqual({ prev: 50, current: 60, next: 70 });
  });

  it('1월의 전월, 12월의 다음달은 null', () => {
    expect(getMonthlySnapshot(counts, 0).prev).toBeNull();
    expect(getMonthlySnapshot(counts, 11).next).toBeNull();
  });

  it('데이터가 아직 없으면 current는 0, 나머지는 null', () => {
    expect(getMonthlySnapshot([], 5)).toEqual({ prev: null, current: 0, next: null });
  });
});

describe('getTopIndicesBy', () => {
  it('점수 상위 n개의 원래 인덱스를 반환한다', () => {
    const list = [{ p: 5 }, { p: 9 }, { p: 1 }, { p: 7 }];
    expect(getTopIndicesBy(list, 2, (item) => item.p)).toEqual([1, 3]);
  });
});
