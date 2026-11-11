import { describe, it, expect } from 'vitest';
import { chunk } from '../array';

describe('chunk', () => {
  it('size 개씩 나누고 마지막 그룹은 남은 개수만큼', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('빈 배열은 빈 그룹 목록', () => {
    expect(chunk([], 3)).toEqual([]);
  });
});
