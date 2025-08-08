<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { getLoraModelInfo } from './info_getter';
import type { LoraModel, LoraModelVersion } from './lora_api_types';
import ImageCarousel from './ImageCarousel.vue';
import { MarkdownExporter } from './markdown_exporter';

const modelUrl = ref("https://civitai.com/models/1843641/acenix-katthe-mayictor-style");
const modelInfo = ref<LoraModel | null>(null);
const selectedVersion = ref<LoraModelVersion | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);
const showMarkdownPreview = ref(false);

// 计算生成的 Markdown 内容
const markdownContent = computed(() => {
  if (!modelInfo.value) return '';
  return MarkdownExporter.exportModel(modelInfo.value, selectedVersion.value || undefined);
});

// 生成文件名
const generateFilename = computed(() => {
  if (!modelInfo.value) return 'lora-model';
  return `${modelInfo.value.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_${modelInfo.value.id}`;
});

async function fetchModelInfo() {
  if (!modelUrl.value) {
    error.value = "Please enter a URL.";
    return;
  }
  isLoading.value = true;
  error.value = null;
  modelInfo.value = null;
  selectedVersion.value = null;
  showMarkdownPreview.value = false;

  try {
    const data = await getLoraModelInfo(modelUrl.value);
    if (data) {
      modelInfo.value = data;
      if (data.modelVersions.length > 0) {
        selectedVersion.value = data.modelVersions[0];
      }
    } else {
      error.value = "Failed to fetch model information. Check the console for details.";
    }
  } catch (e: any) {
    error.value = e.message || "An unknown error occurred.";
  } finally {
    isLoading.value = false;
  }
}

// Markdown 导出功能
function downloadMarkdown() {
  if (markdownContent.value) {
    MarkdownExporter.downloadMarkdown(markdownContent.value, generateFilename.value);
  }
}

async function copyMarkdownToClipboard() {
  if (markdownContent.value) {
    const success = await MarkdownExporter.copyToClipboard(markdownContent.value);
    if (success) {
      alert('已复制到剪贴板！');
    } else {
      alert('复制失败，请手动复制');
    }
  }
}

function toggleMarkdownPreview() {
  showMarkdownPreview.value = !showMarkdownPreview.value;
}

onMounted(fetchModelInfo);
</script>

<template>
  <div class="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg shadow-xl p-6">
    <!-- 输入区域 -->
    <div class="flex flex-col lg:flex-row gap-4 mb-6">
      <input
        v-model="modelUrl"
        @keyup.enter="fetchModelInfo"
        type="text"
        placeholder="Enter Civitai Model URL"
        class="flex-grow p-3 border rounded-md bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
      />
      <button
        @click="fetchModelInfo"
        :disabled="isLoading"
        class="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-base font-medium"
      >
        {{ isLoading ? 'Loading...' : 'Get Info' }}
      </button>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="p-4 mb-6 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
      <span class="font-medium">Error!</span> {{ error }}
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="text-center p-12">
      <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
      <p class="mt-4 text-lg">Fetching data...</p>
    </div>

    <!-- 主内容区域 -->
    <div v-if="modelInfo && !isLoading && !error" class="space-y-6">
      <!-- 操作按钮区域 -->
      <div class="flex flex-wrap gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <button
          @click="downloadMarkdown"
          class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm font-medium"
        >
          📄 下载 Markdown
        </button>
        <button
          @click="copyMarkdownToClipboard"
          class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition text-sm font-medium"
        >
          📋 复制 Markdown
        </button>
        <button
          @click="toggleMarkdownPreview"
          class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition text-sm font-medium"
        >
          {{ showMarkdownPreview ? '👁️ 隐藏预览' : '👁️ 预览 Markdown' }}
        </button>
      </div>

      <!-- Markdown 预览区域 -->
      <div v-if="showMarkdownPreview" class="border rounded-lg overflow-hidden">
        <div class="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b">
          <h3 class="font-semibold text-sm">Markdown 预览</h3>
        </div>
        <div class="p-4 bg-gray-50 dark:bg-gray-900 max-h-96 overflow-y-auto">
          <pre class="text-xs font-mono whitespace-pre-wrap">{{ markdownContent }}</pre>
        </div>
      </div>

      <!-- 模型信息展示区域 -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <!-- 左侧：图片轮播 -->
        <div class="space-y-4">
          <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200">示例图片</h2>
          <ImageCarousel v-if="selectedVersion" :images="selectedVersion.images" />
        </div>

        <!-- 右侧：模型详情 -->
        <div class="space-y-6">
          <div>
            <h1 class="text-3xl lg:text-4xl font-bold mb-2">{{ modelInfo.name }}</h1>
            <p class="text-lg text-gray-600 dark:text-gray-400">by {{ modelInfo.creator.username }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-500">ID: {{ modelInfo.id }}</p>
          </div>

          <!-- 版本选择器 -->
          <div v-if="modelInfo.modelVersions.length > 1" class="space-y-2">
            <label for="version-select" class="block text-sm font-medium text-gray-900 dark:text-white">选择版本:</label>
            <select
              id="version-select"
              v-model="selectedVersion"
              class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            >
              <option v-for="version in modelInfo.modelVersions" :key="version.name" :value="version">
                {{ version.name }}
              </option>
            </select>
          </div>

          <!-- 当前版本信息 -->
          <div v-if="selectedVersion" class="space-y-6">
            <!-- 描述 -->
            <div class="space-y-2">
              <h3 class="font-semibold text-lg">描述</h3>
              <div 
                v-if="modelInfo.description" 
                class="text-gray-700 dark:text-gray-300 text-sm prose prose-sm dark:prose-invert max-w-none" 
                v-html="modelInfo.description"
              ></div>
              <p v-else class="text-gray-500 text-sm">暂无描述</p>
            </div>

            <!-- 版本详情 -->
            <div class="space-y-2">
              <h3 class="font-semibold text-lg">版本详情</h3>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                <p><strong>版本名称:</strong> {{ selectedVersion.name }}</p>
                <p><strong>创建时间:</strong> {{ new Date(selectedVersion.createdAt).toLocaleString('zh-CN') }}</p>
              </div>
            </div>

            <!-- 下载文件 -->
            <div class="space-y-2">
              <h3 class="font-semibold text-lg">下载文件</h3>
              <div v-if="selectedVersion.files.length > 0" class="space-y-2">
                <div 
                  v-for="file in selectedVersion.files" 
                  :key="file.name" 
                  class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <span class="text-sm font-medium">{{ file.name }}</span>
                  <a 
                    :href="file.downloadUrl" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    class="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
                  >
                    下载
                  </a>
                </div>
              </div>
              <p v-else class="text-gray-500 text-sm">暂无下载文件</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

