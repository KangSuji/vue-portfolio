/** 배열을 size 개씩 나눈다. 예) chunk([1, 2, 3], 2) → [[1, 2], [3]] */
export function chunk<T>(list: T[], size: number): T[][] {
  if (size < 1) return [list];

  const groups: T[][] = [];
  for (let i = 0; i < list.length; i += size) {
    groups.push(list.slice(i, i + size));
  }
  return groups;
}
