<template>
  <div class="main__card">
    <div class="main__card__title-area">
      <p class="main__card__title-area--title">{{ content.title }}</p>
      <span class="material-symbols-rounded" aria-hidden="true"> {{ content.icon }} </span>
    </div>

    <div class="main__card__content">
      <p class="number">
        {{ displayValue }}<span v-if="content.unit" class="unit">{{ content.unit }}</span>
      </p>
    </div>

    <div class="main__card__increase" :class="trendClass">
      <!-- 색만으로 증감을 표현하지 않도록 화살표 + 부호를 함께 표시 -->
      <template v-if="hasChange">
        <span class="material-symbols-rounded" aria-hidden="true">
          {{ isIncrease ? 'arrow_upward' : 'arrow_downward' }}
        </span>
        <span class="rate">{{ signedRate }}</span>
        <span class="label">{{ content.comparisonLabel }}</span>
      </template>
      <span v-else class="label">{{ content.caption }}</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';

export interface Contents {
  icon: string;
  title: string;
  value: number | null;
  /** 값 뒤 단위 (예: '편') */
  unit?: string;
  /** 증감률(%). null이면 비교하지 않음 */
  increase?: number | null;
  /** 증감률 비교 기준 (예: '전월 대비') */
  comparisonLabel?: string;
  /** 증감률이 없을 때 대신 보여줄 설명 */
  caption?: string;
}

const props = defineProps<{ content: Contents }>();

const displayValue = computed(() =>
  props.content.value === null ? '-' : props.content.value.toLocaleString('ko-KR'),
);

const hasChange = computed(
  () => props.content.increase !== null && props.content.increase !== undefined,
);
const isIncrease = computed(() => (props.content.increase ?? 0) >= 0);
const signedRate = computed(() => {
  const rate = props.content.increase ?? 0;
  return `${rate > 0 ? '+' : ''}${rate}%`;
});

const trendClass = computed(() => {
  if (!hasChange.value || props.content.increase === 0) return '';
  return isIncrease.value ? 'increase' : 'decrease';
});
</script>
