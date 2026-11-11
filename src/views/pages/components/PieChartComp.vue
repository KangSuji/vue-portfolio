<template>
  <div ref="pieChart" :style="chartProps.size" />
</template>

<script setup lang="ts">
import { PieChart } from 'echarts/charts';
import {
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { onBeforeUnmount, onMounted, onUpdated, ref } from 'vue';
import { theme } from '@/config/chartOptions';

echarts.use([
  PieChart,
  CanvasRenderer,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  ToolboxComponent,
]);

const pieChart = ref();
const chartProps = defineProps({
  // 차트 사이즈 - width / height 지정
  size: {
    type: Object,
    default: () => {
      return { width: '100%', height: '650px' };
    },
  },
  // 차트 제목
  title: {
    type: Object,
    required: false,
    default: () => {
      return { show: false };
    },
  },
  // 차트 series 데이터
  series: {
    type: Array,
    required: true,
    default: () => {
      return [];
    },
  },
  // hover 툴팁
  tooltip: {
    type: Object,
    default: () => {
      {
        return {
          trigger: 'item',
          borderWidth: 0,
          padding: 0,
          backgroundColor: 'transparent',
          formatter: (params) => {
            return `
            <div class="tooltip_style">
              <p class="name">${params.name}</p>
              <p class="data">${params.data.value}</p>
            </div>
          `;
          },
          position: function (point, params, dom, rect, size) {
            return [point[0] + 20, point[1] - 30];
          },
        };
      }
    },
  },
  // 범례
  legend: {
    type: Object,
    default: () => {
      return {
        type: 'scroll',
        textStyle: {
          color: 'gray',
        },
        pageTextStyle: {
          color: 'gray',
        },
      };
    },
  },
  // 유틸리티 도구 그룹 (내보내기 , 데이터 보기 , 동적 유형 전환 , 데이터 영역 확대/축소 및 재설정)
  toolbox: {
    type: Object,
    required: false,
    default: () => {
      return {};
    },
  },

  // 그리드(여백)
  grid: {
    type: Object,
    default: () => {
      return { containLabel: true };
    },
  },
  // 그래프 애니메이션
  animation: {
    type: Boolean,
    default: () => {
      return true;
    },
  },
});

let chart: echarts.ECharts | undefined;

// 인스턴스는 한 번만 만들고, 이후에는 옵션만 교체한다
const drawChart = () => {
  if (!chart) {
    // 차트 테마 적용
    echarts.registerTheme('theme', theme.theme);
    chart = echarts.init(pieChart.value, 'theme');
  }
  chart.setOption({ ...chartProps }, true);
};

const chartResize = () => {
  chart?.resize();
};

onMounted(() => {
  drawChart();

  window.addEventListener('resize', chartResize);
});

onUpdated(() => {
  drawChart();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', chartResize);
  chart?.dispose();
  chart = undefined;
});
</script>
<style lang="scss" scoped></style>
