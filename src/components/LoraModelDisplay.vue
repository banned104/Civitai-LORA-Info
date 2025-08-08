<script setup lang="ts">
import { ref, computed } from 'vue';
import { getLoraModelInfo } from './info_getter';
import type { LoraModel } from './lora_api_types';
import ModelUrlInput from './ModelUrlInput.vue';
import ModelCard from './ModelCard.vue';
import { MarkdownExporter } from './markdown_exporter';

// 存储所有模型的数组
const models = ref<LoraModel[]>([]);
const error = ref<string | null>(null);

// 引用输入组件
const inputComponent = ref<InstanceType<typeof ModelUrlInput>>();
const modelCardRefs = ref<InstanceType<typeof ModelCard>[]>([]);

// 计算是否有模型
const hasModels = computed(() => models.value.length > 0);

// 获取模型信息
async function fetchModelInfo(modelUrl: string) {
  inputComponent.value?.setLoading(true);
  error.value = null;

  try {
    const data = await getLoraModelInfo(modelUrl);
    if (data) {
      // 检查是否已经存在相同的模型
      const existingModel = models.value.find(model => model.id === data.id);
      if (existingModel) {
        error.value = `模型 "${data.name}" 已经存在于列表中`;
      } else {
        // 将新模型添加到数组开头
        models.value.unshift(data);
      }
    } else {
      error.value = "获取模型信息失败，请检查控制台获取详细信息";
    }
  } catch (e: any) {
    error.value = e.message || "发生未知错误";
  } finally {
    inputComponent.value?.setLoading(false);
  }
}

// 移除模型
function removeModel(index: number) {
  if (index >= 0 && index < models.value.length) {
    models.value.splice(index, 1);
  }
}

// 清空所有模型
function clearAllModels() {
  if (confirm('确定要清空所有模型吗？')) {
    models.value = [];
    error.value = null;
  }
}

// 批量导出所有模型的 Markdown
async function exportAllModels() {
  if (models.value.length === 0) {
    alert('没有模型可以导出');
    return;
  }

  try {
    const exportData = models.value.map((model, index) => {
      const cardRef = modelCardRefs.value[index];
      return {
        model,
        filename: cardRef?.generateFilename || `model_${model.id}`,
        content: cardRef?.markdownContent || MarkdownExporter.exportModel(model)
      };
    });

    await MarkdownExporter.exportMultipleModels(exportData);
  } catch (error) {
    console.error('导出失败:', error);
    alert('导出失败，请重试');
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- 输入组件 -->
    <ModelUrlInput 
      ref="inputComponent"
      @fetch-model="fetchModelInfo" 
    />
    
    <!-- 错误提示 -->
    <div v-if="error" class="p-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
      <span class="font-medium">错误!</span> {{ error }}
    </div>

    <!-- 批量操作区域 -->
    <div v-if="hasModels" class="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg shadow-xl p-6">
      <div class="flex flex-wrap gap-3 items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-lg font-semibold">已获取 {{ models.length }} 个模型</span>
        </div>
        <div class="flex flex-wrap gap-3">
          <button
            @click="exportAllModels"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm font-medium"
          >
            批量导出 ZIP
          </button>
          <button
            @click="clearAllModels"
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm font-medium"
          >
            清空所有
          </button>
        </div>
      </div>
    </div>

    <!-- 模型卡片列表 -->
    <div v-if="hasModels" class="space-y-6">
      <ModelCard
        v-for="(model, index) in models"
        :key="model.id"
        ref="modelCardRefs"
        :model-info="model"
        :index="index"
        @remove="removeModel"
      />
    </div>

    <!-- 空状态 -->
    <div v-if="!hasModels" class="text-center p-12 bg-white dark:bg-gray-900 rounded-lg shadow-xl">
      <p class="text-gray-500 text-lg">还没有获取任何模型信息</p>
      <p class="text-gray-400 text-sm mt-2">请在上方输入 Civitai 模型 URL 开始获取</p>
    </div>
  </div>
</template>

