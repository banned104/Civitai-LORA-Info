<script setup lang="ts">
import { ref, computed } from 'vue';
import type { LoraImage, LoraModelVersion } from './lora_api_types';
import ImageMetaDisplay from './ImageMetaDisplay.vue';

const props = defineProps<{
  images: LoraImage[];
  modelVersion?: LoraModelVersion;
}>();

const currentIndex = ref(0);

const hasImages = computed(() => props.images && props.images.length > 0);
const currentImage = computed(() => hasImages.value ? props.images[currentIndex.value] : null);

function showNextImage() {
  if (hasImages.value) {
    currentIndex.value = (currentIndex.value + 1) % props.images.length;
  }
}

function showPrevImage() {
  if (hasImages.value) {
    currentIndex.value = (currentIndex.value - 1 + props.images.length) % props.images.length;
  }
}
</script>

<template>
  <div v-if="hasImages" class="space-y-4">
    <!-- 图片轮播区域 -->
    <div class="relative w-full max-w-lg mx-auto">
      <!-- Image Stack -->
      <div class="relative h-96 flex items-center justify-center overflow-hidden rounded-lg shadow-lg bg-gray-200 dark:bg-gray-800">
        <TransitionGroup name="fade">
          <img
            v-for="(image, index) in images"
            :key="image.url"
            :src="image.url"
            :alt="`Lora model image ${index + 1}`"
            class="absolute top-0 left-0 w-full h-full object-contain transition-opacity duration-500 ease-in-out"
            :class="{ 'opacity-100': index === currentIndex, 'opacity-0': index !== currentIndex }"
          />
        </TransitionGroup>
      </div>

      <!-- Controls -->
      <div class="absolute inset-0 flex items-center justify-between p-4">
        <button
          @click="showPrevImage"
          class="bg-gray-800 bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition"
          aria-label="Previous Image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          @click="showNextImage"
          class="bg-gray-800 bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition"
          aria-label="Next Image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- Image Counter -->
      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-800 bg-opacity-75 text-white text-xs rounded-full px-2 py-1">
        {{ currentIndex + 1 }} / {{ images.length }}
      </div>
    </div>

    <!-- 当前图片的元数据显示 -->
    <ImageMetaDisplay 
      :image="currentImage" 
      :model-version="modelVersion || null" 
    />
  </div>
  <div v-else class="text-center text-gray-500">
    No images to display.
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
