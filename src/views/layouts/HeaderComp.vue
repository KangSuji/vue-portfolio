<template>
  <q-header class="header">
    <div class="flex items-center">
      <q-btn class="header_logo" aria-label="메인으로 이동" @click="router.push('/')">
        <AppLogo :size="36" />
      </q-btn>
      <ul class="header_list">
        <template v-for="menu in menus" :key="menu.code">
          <li
            clickable
            @click="router.push({ name: menu.name })"
            :class="{ active: useRoute().name === menu.name }"
          >
            <span>{{ menu.label }}</span>
          </li>
        </template>
      </ul>
    </div>
    <div class="header_right">
      <q-btn @click="themeChange">
        <span v-if="currentTheme === ThemeType.DARK" class="material-symbols-rounded"> sunny </span>
        <span v-else class="material-symbols-rounded"> dark_mode </span>
      </q-btn>
      <q-btn href="https://github.com/KangSuji" target="_blank">
        <span class="material-symbols-rounded"> person </span>
      </q-btn>
    </div>
  </q-header>
</template>
<script lang="ts" setup>
import { ref } from 'vue';
import router from '@/router';
import { useRoute } from 'vue-router';
import { applyTheme, getTheme, ThemeType } from '@/utils/themeUtils';
import AppLogo from '@/components/AppLogo.vue';

interface MeunList {
  label: string;
  code: string;
  name?: string;
  path: string;
}

const menus = ref<MeunList[]>([
  {
    label: 'Main',
    code: 'main',
    name: 'main',
    path: '/main',
  },
  {
    label: 'Trending',
    code: 'trend',
    name: 'trend',
    path: '/trend',
  },
]);

// 현재 테마
const currentTheme = ref<ThemeType>(getTheme());

// 테마 변경
const themeChange = () => {
  currentTheme.value = currentTheme.value === ThemeType.DARK ? ThemeType.LIGHT : ThemeType.DARK;
  applyTheme(currentTheme.value);
};
</script>
