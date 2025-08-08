<script setup lang="ts">
import { computed } from 'vue';
import type { LoraImage, LoraModelVersion } from './lora_api_types';

const props = defineProps<{
  image: LoraImage | null;
  modelVersion: LoraModelVersion | null;
}>();

// 从图片元数据中提取训练词
const imageTrainedWords = computed(() => {
  if (!props.image?.meta?.resources) return [];
  
  return props.image.meta.resources
    .filter(resource => resource.type === 'lora' || resource.type === 'model')
    .map(resource => resource.name)
    .filter(Boolean);
});

// 合并模型版本的训练词和图片的训练词
const allTrainedWords = computed(() => {
  const modelWords = props.modelVersion?.trainedWords || [];
  const imageWords = imageTrainedWords.value;
  
  // 去重合并
  const combined = [...new Set([...modelWords, ...imageWords])];
  return combined;
});

// 提取正面提示词
const positivePrompt = computed(() => {
  return props.image?.meta?.prompt || '';
});

// 提取负面提示词
const negativePrompt = computed(() => {
  return props.image?.meta?.negativePrompt || '';
});

// 提取采样器参数
const samplerParams = computed(() => {
  if (!props.image?.meta) return null;
  
  const meta = props.image.meta;
  return {
    sampler: meta.sampler || 'Unknown',
    steps: meta.steps || 'Unknown',
    cfgScale: meta.cfgScale || 'Unknown',
    seed: meta.seed || 'Unknown',
    clipSkip: meta.clipSkip || 'Unknown'
  };
});

// 复制到剪贴板的函数
async function copyToClipboard(text: string, type: string) {
  try {
    await navigator.clipboard.writeText(text);
    alert(`${type} 已复制到剪贴板！`);
  } catch (error) {
    console.error('复制失败:', error);
    alert('复制失败，请手动复制');
  }
}

function copyTrainedWords() {
  const words = allTrainedWords.value.join(', ');
  copyToClipboard(words, '训练词');
}

function copyPositivePrompt() {
  copyToClipboard(positivePrompt.value, '正面提示词');
}

function copyNegativePrompt() {
  copyToClipboard(negativePrompt.value, '负面提示词');
}

function copySamplerParams() {
  const params = samplerParams.value;
  if (!params) return;
  
  const text = `Sampler: ${params.sampler}, Steps: ${params.steps}, CFG Scale: ${params.cfgScale}, Seed: ${params.seed}, Clip Skip: ${params.clipSkip}`;
  copyToClipboard(text, '采样器参数');
}
</script>

<template>
  <div v-if="image" class="space-y-4">
    <!-- 训练词显示 -->
    <div v-if="allTrainedWords.length > 0" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <div class="flex items-center justify-between mb-2">
        <h4 class="font-semibold text-sm text-gray-700 dark:text-gray-300">🏷️ 训练词 (Trigger Words)</h4>
        <button
          @click="copyTrainedWords"
          class="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition"
          title="复制训练词"
        >
          📋 复制
        </button>
      </div>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="word in allTrainedWords"
          :key="word"
          class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
        >
          {{ word }}
        </span>
      </div>
    </div>

    <!-- 正面提示词 -->
    <div v-if="positivePrompt" class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
      <div class="flex items-center justify-between mb-2">
        <h4 class="font-semibold text-sm text-green-700 dark:text-green-300">✅ 正面提示词 (Positive Prompt)</h4>
        <button
          @click="copyPositivePrompt"
          class="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition"
          title="复制正面提示词"
        >
          📋 复制
        </button>
      </div>
      <p class="text-xs text-gray-700 dark:text-gray-300 font-mono bg-white dark:bg-gray-800 p-2 rounded border">
        {{ positivePrompt }}
      </p>
    </div>

    <!-- 负面提示词 -->
    <div v-if="negativePrompt" class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
      <div class="flex items-center justify-between mb-2">
        <h4 class="font-semibold text-sm text-red-700 dark:text-red-300">❌ 负面提示词 (Negative Prompt)</h4>
        <button
          @click="copyNegativePrompt"
          class="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition"
          title="复制负面提示词"
        >
          📋 复制
        </button>
      </div>
      <p class="text-xs text-gray-700 dark:text-gray-300 font-mono bg-white dark:bg-gray-800 p-2 rounded border">
        {{ negativePrompt }}
      </p>
    </div>

    <!-- 采样器参数 -->
    <div v-if="samplerParams" class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
      <div class="flex items-center justify-between mb-2">
        <h4 class="font-semibold text-sm text-purple-700 dark:text-purple-300">⚙️ 采样器参数 (Sampler Parameters)</h4>
        <button
          @click="copySamplerParams"
          class="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition"
          title="复制采样器参数"
        >
          📋 复制
        </button>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
        <div class="bg-white dark:bg-gray-800 p-2 rounded border">
          <span class="font-semibold">采样器:</span> {{ samplerParams.sampler }}
        </div>
        <div class="bg-white dark:bg-gray-800 p-2 rounded border">
          <span class="font-semibold">步数:</span> {{ samplerParams.steps }}
        </div>
        <div class="bg-white dark:bg-gray-800 p-2 rounded border">
          <span class="font-semibold">CFG:</span> {{ samplerParams.cfgScale }}
        </div>
        <div class="bg-white dark:bg-gray-800 p-2 rounded border">
          <span class="font-semibold">种子:</span> {{ samplerParams.seed }}
        </div>
        <div class="bg-white dark:bg-gray-800 p-2 rounded border">
          <span class="font-semibold">Clip Skip:</span> {{ samplerParams.clipSkip }}
        </div>
      </div>
    </div>

    <!-- 无数据提示 -->
    <div v-if="!allTrainedWords.length && !positivePrompt && !negativePrompt && !samplerParams" 
         class="text-center text-gray-500 text-sm py-4">
      该图片暂无相关参数信息
    </div>
  </div>
</template>
