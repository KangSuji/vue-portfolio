import { computed } from 'vue';
import { useThemeStore } from '@/stores/useThemeStore';

/**
 * 차트 색상 (다크/라이트 모드별)
 * - 강조(accent) + 회색(muted) "emphasis" 방식: 보여주고 싶은 값만 색을 쓰고 나머지는 회색
 * - accent는 배경(#09090b / #ffffff) 대비 3:1 이상, 색각 이상 시뮬레이션 검증 통과한 값
 * - 텍스트는 데이터 색을 쓰지 않고 text/textMuted만 사용
 */
export interface ChartPalette {
  /** 차트 배경 (페이지 배경과 동일) */
  surface: string;
  text: string;
  textMuted: string;
  /** 그리드선 (1px 실선) */
  grid: string;
  /** 축선·크로스헤어 */
  axis: string;
  accent: string;
  /** 비교 대상·비강조 값 */
  muted: string;
  tooltipBg: string;
  tooltipBorder: string;
}

const PALETTES: Record<'dark' | 'light', ChartPalette> = {
  dark: {
    surface: '#09090b',
    text: '#e4e4e7',
    textMuted: '#a1a1aa',
    grid: '#27272a',
    axis: '#3f3f46',
    accent: '#3987e5',
    muted: '#5c5b57',
    tooltipBg: '#18181b',
    tooltipBorder: '#3f3f46',
  },
  light: {
    surface: '#ffffff',
    text: '#18181b',
    textMuted: '#52525b',
    grid: '#e4e4e7',
    axis: '#d4d4d8',
    accent: '#2a78d6',
    muted: '#a3a29b',
    tooltipBg: '#ffffff',
    tooltipBorder: '#e4e4e7',
  },
};

/** 현재 테마의 차트 색상 (테마 전환 시 차트 옵션이 다시 계산됨) */
export function useChartPalette() {
  const themeStore = useThemeStore();
  return computed(() => PALETTES[themeStore.theme === 'light' ? 'light' : 'dark']);
}
