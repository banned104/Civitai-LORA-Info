<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from '../i18n';

const { t } = useI18n();

const emit = defineEmits<{
  fetchModel: [url: string];
}>();

const modelUrl = ref("https://civitai.com/models/1843641/acenix-katthe-mayictor-style");
const isLoading = ref(false);

function handleFetchModel() {
  if (!modelUrl.value.trim()) {
    alert(t('urlRequired'));
    return;
  }
  emit('fetchModel', modelUrl.value.trim());
}

// 暴露方法给父组件调用
defineExpose({
  setLoading: (loading: boolean) => {
    isLoading.value = loading;
  }
});
</script>

<template>
  <div class="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg shadow-xl p-6 mb-6">
    <h2 class="text-2xl font-bold mb-4 text-center">{{ t('loraInfoGetter') }}</h2>
    
    <!-- 输入区域 -->
    <div class="flex flex-col lg:flex-row gap-4">
      <input
        v-model="modelUrl"
        @keyup.enter="handleFetchModel"
        type="text"
        :placeholder="t('urlPlaceholder')"
        class="flex-grow p-3 border rounded-md bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
      />
      <button
        @click="handleFetchModel"
        :disabled="isLoading"
        class="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-base font-medium"
      >
        {{ isLoading ? t('fetching') : t('getModelInfo') }}
      </button>
    </div>
  </div>
</template>
