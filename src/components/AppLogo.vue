<template>
  <!--
    필름 프레임(양옆 구멍) + 상승 막대그래프 = "영화 데이터 대시보드"
    - 테두리·구멍·막대는 currentColor → 헤더 글자색(테마 토큰)을 따라감
    - 가장 높은 막대만 브랜드 색(--primary)으로 강조
  -->
  <svg
    class="app-logo"
    :width="size"
    :height="size"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="TMDB 영화 대시보드 로고"
  >
    <!-- 필름 프레임 -->
    <rect x="2" y="5" width="28" height="22" rx="5" stroke="currentColor" stroke-width="2" />
    <!-- 필름 구멍 -->
    <g fill="currentColor">
      <rect x="5.5" y="9" width="2" height="2" rx="0.6" />
      <rect x="5.5" y="15" width="2" height="2" rx="0.6" />
      <rect x="5.5" y="21" width="2" height="2" rx="0.6" />
      <rect x="24.5" y="9" width="2" height="2" rx="0.6" />
      <rect x="24.5" y="15" width="2" height="2" rx="0.6" />
      <rect x="24.5" y="21" width="2" height="2" rx="0.6" />
    </g>
    <!-- 막대그래프 -->
    <rect x="10" y="17" width="3" height="6" rx="1" fill="currentColor" opacity="0.55" />
    <rect x="14.5" y="13" width="3" height="10" rx="1" fill="currentColor" opacity="0.8" />
    <rect x="19" y="9" width="3" height="14" rx="1" class="app-logo__accent" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number | string }>(), { size: 36 });
</script>

<style scoped lang="scss">
.app-logo {
  display: block;
  &__accent {
    fill: var(--primary);
  }
}
</style>
