import { describe, it, expect } from 'vitest';
import { mapWithConcurrency } from '../async';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('mapWithConcurrency', () => {
  it('입력 순서대로 결과를 반환한다 (완료 순서와 무관)', async () => {
    const result = await mapWithConcurrency([30, 10, 20], 3, async (ms) => {
      await sleep(ms);
      return ms * 2;
    });
    expect(result).toEqual([60, 20, 40]);
  });

  it('동시 실행 수가 limit을 넘지 않는다', async () => {
    let running = 0;
    let maxRunning = 0;

    await mapWithConcurrency(Array.from({ length: 10 }), 3, async () => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await sleep(5);
      running--;
    });

    expect(maxRunning).toBe(3);
  });

  it('빈 배열이면 빈 결과', async () => {
    expect(await mapWithConcurrency([], 5, async () => 1)).toEqual([]);
  });
});
