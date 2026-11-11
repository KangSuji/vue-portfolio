<template>
  <q-page>
    <div class="page_container detail-container">
      <div class="detail-wrap">
        <div class="flex items-center cursor-pointer back-btn-area" @click="router.go(-1)">
          <span class="material-symbols-rounded back-btn"> arrow_back </span>
          <span>뒤로 가기</span>
        </div>
        <div v-if="detail" class="detail_card">
          <div class="detail_card--bg" :style="bgImageStyle"></div>
          <div class="detail_card--content_area">
            <img :src="detail.posterUrl" :alt="detail.title" />
            <div class="detail_card--content">
              <div class="detail-card-title-area">
                <p class="detail-card--title">{{ detail.title }}</p>
                <p class="detail-card--title">{{ detail.originalTitle }}</p>
                <p class="detail-card-sub-title">{{ detail.tagline }}</p>
              </div>
              <div class="flex items-center">
                <span v-for="genre in detail.genres" :key="genre.id" class="detail-card--genres">
                  {{ genre.name }}
                </span>
              </div>
              <div class="detail-card--info-area">
                <span class="material-symbols-rounded star"> star </span>
                <p class="detail-card--title">{{ detail.rating }}</p>
                <span class="material-symbols-rounded calendar"> calendar_month </span>
                <p class="detail-card--title">{{ detail.releaseDate || '-' }}</p>
                <template v-if="detail.mediaType === 'movie'">
                  <span class="material-symbols-rounded schedule"> schedule </span>
                  <p class="detail-card--title">{{ detail.runtime ?? '-' }} 분</p>
                </template>
                <template v-else>
                  <span class="material-symbols-rounded episode"> tv_guide </span>
                  <p class="detail-card--title">시즌 {{ detail.numberOfSeasons }}</p>
                  <p class="detail-card--title">에피소드 {{ detail.numberOfEpisodes }} 개</p>
                </template>
              </div>

              <a
                v-if="detail.homepage"
                class="homepage-btn"
                :href="detail.homepage"
                target="_blank"
                rel="noopener noreferrer"
              >
                보러가기
              </a>

              <div class="detail-card--description-area">
                <p class="detail_card--sub-title">개요</p>
                <p class="detail-card--description">{{ detail.overview || '-' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  movieDetailToContent,
  tmdbApi,
  tvDetailToContent,
  type ContentDetail,
  type MediaType,
} from '@/api';
import progressConfig from '@/config/progressConfig';

const router = useRouter();
const route = useRoute();

// 상세 데이터는 이 페이지에서만 쓰므로 store가 아닌 로컬 상태로 관리한다
// (전역 store에 두면 다른 작품 진입 시 이전 작품이 잠깐 보이는 문제가 있음)
const detail = ref<ContentDetail | null>(null);

const bgImageStyle = computed(() =>
  detail.value?.backdropUrl ? { backgroundImage: `url(${detail.value.backdropUrl})` } : {},
);

const fetchDetail = async (category: MediaType, id: number) => {
  detail.value = null;
  progressConfig.show();
  try {
    detail.value =
      category === 'movie'
        ? movieDetailToContent(await tmdbApi.getMovieDetail(id))
        : tvDetailToContent(await tmdbApi.getTvDetail(id));
  } catch (error) {
    console.error('Error fetching content detail:', error);
  } finally {
    progressConfig.hide();
  }
};

// 같은 컴포넌트에서 params만 바뀌는 경우(/detail/movie/1 → /detail/tv/2)에도 다시 조회
watch(
  () => [route.params.category, route.params.id] as const,
  ([category, id]) => {
    // 다른 페이지로 떠나는 순간에도 params가 바뀌며 watch가 실행되므로 무시
    if (route.name !== 'detail') return;
    const mediaType: MediaType = category === 'tv' ? 'tv' : 'movie';
    fetchDetail(mediaType, Number(id));
  },
  { immediate: true },
);
</script>
