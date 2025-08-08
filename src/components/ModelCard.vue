<script setup lang="ts">
import { ref, computed } from 'vue';
import type { LoraModel, LoraModelVersion } from './lora_api_types';
import ImageCarousel from './ImageCarousel.vue';
import { MarkdownExporter } from './markdown_exporter';

const props = defineProps<{
  modelInfo: LoraModel;
  index: number;
}>();

const emit = defineEmits<{
  remove: [index: number];
}>();

const selectedVersion = ref<LoraModelVersion | null>(null);
const showMarkdownPreview = ref(false);

// 初始化选择第一个版本
if (props.modelInfo.modelVersions.length > 0) {
  selectedVersion.value = props.modelInfo.modelVersions[0];
}

// 计算生成的 Markdown 内容
const markdownContent = computed(() => {
  return MarkdownExporter.exportModel(props.modelInfo, selectedVersion.value || undefined);
});

// 生成文件名
const generateFilename = computed(() => {
  return `${props.modelInfo.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_${props.modelInfo.id}`;
});

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

function removeModel() {
  emit('remove', props.index);
}

// 暴露方法供父组件调用
defineExpose({
  markdownContent,
  generateFilename
});
</script>

<template>
  <div class="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg shadow-xl p-6 mb-6">
    <!-- 模型标题和移除按钮 -->
    <div class="flex justify-between items-start mb-4">
      <div class="flex-1">
        <h1 class="text-2xl lg:text-3xl font-bold mb-2">{{ modelInfo.name }}</h1>
        <p class="text-lg text-gray-600 dark:text-gray-400">by {{ modelInfo.creator.username }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-500">ID: {{ modelInfo.id }}</p>
      </div>
      <button
        @click="removeModel"
        class="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm"
        title="移除此模型"
      >
        ✕
      </button>
    </div>

    <!-- 操作按钮区域 -->
    <div class="flex flex-wrap gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-6">
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
    <div v-if="showMarkdownPreview" class="border rounded-lg overflow-hidden mb-6">
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
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-200">示例图片</h2>
        <ImageCarousel v-if="selectedVersion" :images="selectedVersion.images" />
      </div>

      <!-- 右侧：模型详情 -->
      <div class="space-y-6">
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
</template>
