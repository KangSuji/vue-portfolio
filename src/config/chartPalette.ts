import { computed } from 'vue';
import { useThemeStore } from '@/stores/useThemeStore';

/**
 * 차트 색상 (다크/라이트 모드별)
 * - ECharts는 canvas에 그리므로 CSS 변수를 읽지 못한다.
 *   → src/assets/styles/theme.scss의 토큰과 값을 맞춰 둔다.
 * - 강조(accent) + 회색(muted) "emphasis" 방식: 보여주고 싶은 값만 색을 쓰고 나머지는 회색
 * - accent는 카드 표면 대비 3:1 이상, 색각 이상 시뮬레이션 검증 통과한 값
 * - 텍스트는 데이터 색을 쓰지 않고 text/textMuted만 사용
 */
export interface ChartPalette {
  /** 차트가 놓이는 카드 배경 (theme.scss --surface) */
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
    surface: '#1e1e1e',
    text: '#e6e6e6',
    textMuted: '#a3a3a3',
    grid: '#2e2e2e',
    axis: '#3a3a3a',
    accent: '#3987e5',
    muted: '#6b6b6b',
    tooltipBg: '#2a2a2a',
    tooltipBorder: '#3a3a3a',
  },
  light: {
    surface: '#ffffff',
    text: '#1f1f1f',
    textMuted: '#5c5c5c',
    grid: '#ededed',
    axis: '#d6d6d6',
    accent: '#2a78d6',
    muted: '#999999',
    tooltipBg: '#ffffff',
    tooltipBorder: '#e0e0e0',
  },
};

/** 현재 테마의 차트 색상 (테마 전환 시 차트 옵션이 다시 계산됨) */
export function useChartPalette() {
  const themeStore = useThemeStore();
  return computed(() => PALETTES[themeStore.theme === 'light' ? 'light' : 'dark']);
}
