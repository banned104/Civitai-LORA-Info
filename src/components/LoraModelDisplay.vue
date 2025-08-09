<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getLoraModelInfo } from './info_getter';
import type { LoraModel } from './lora_api_types';
import ModelUrlInput from './ModelUrlInput.vue';
import ModelCard from './ModelCard.vue';
import CacheManagement from './CacheManagement.vue';
import Calendar from './Calendar.vue';
import { MarkdownExporter } from './markdown_exporter';
import { CacheManager } from './cache_manager';

// 存储所有模型的数组
const models = ref<LoraModel[]>([]);
const error = ref<string | null>(null);

// 引用输入组件
const inputComponent = ref<InstanceType<typeof ModelUrlInput>>();
const modelCardRefs = ref<InstanceType<typeof ModelCard>[]>([]);
const calendarRef = ref<InstanceType<typeof Calendar>>();

// 显示状态
const showCalendar = ref(false);

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
        // 自动保存到缓存并记录今日保存
        autoSaveToCache();
        // 记录单个模型到今日
        CacheManager.recordDailySave([data]);
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
    // 自动保存到缓存
    autoSaveToCache();
  }
}

// 清空所有模型
function clearAllModels() {
  if (confirm('确定要清空所有模型吗？')) {
    models.value = [];
    error.value = null;
    // 清除缓存
    CacheManager.clearLocalStorage();
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

// 处理缓存加载的模型
function handleModelsLoaded(loadedModels: LoraModel[]) {
  models.value = loadedModels;
  error.value = null;
  
  // 刷新日历以显示更新后的数据
  calendarRef.value?.refresh();
}

// 自动保存到缓存
function autoSaveToCache() {
  if (models.value.length > 0) {
    CacheManager.saveToLocalStorage(models.value);
    // 记录今日保存
    CacheManager.recordDailySave(models.value);
    // 刷新日历
    calendarRef.value?.refresh();
  }
}

// 切换日历显示
function toggleCalendar() {
  showCalendar.value = !showCalendar.value;
}

// 处理日历日期点击
function handleCalendarDayClick(date: string, modelTitles: string[]) {
  console.log(`点击日期: ${date}, 模型: `, modelTitles);
  
  // 加载该日期的模型到当前显示列表
  try {
    const dayModels = CacheManager.getModelsForDate(date);
    if (dayModels.length > 0) {
      // 合并当前模型和该日期的模型，去除重复
      const mergedModels = CacheManager.mergeModels(models.value, dayModels);
      models.value = mergedModels;
      
      // 显示成功消息
      console.log(`已加载 ${date} 的 ${dayModels.length} 个模型到当前列表`);
    }
  } catch (err: any) {
    console.error('加载日期模型失败:', err);
    error.value = `加载 ${date} 的模型失败`;
  }
};

// 处理日历月份变化
function handleCalendarMonthChange(year: number, month: number) {
  console.log(`日历切换到: ${year}年${month}月`);
};

// 处理加载日期缓存
function handleLoadDayCache(date: string) {
  handleCalendarDayClick(date, []);
};

// 处理清除日期缓存
function handleClearDayCache(date: string) {
  try {
    const success = CacheManager.clearDailyRecord(date);
    if (success) {
      console.log(`已清除 ${date} 的缓存记录`);
      // 刷新日历显示
      calendarRef.value?.refresh();
    } else {
      console.log(`清除 ${date} 的缓存记录失败`);
    }
  } catch (err: any) {
    console.error('清除日期缓存失败:', err);
    error.value = `清除 ${date} 的缓存失败`;
  }
}

// 处理日历刷新请求
function handleCalendarRefresh() {
  calendarRef.value?.refresh();
};

// 组件挂载时尝试加载缓存
onMounted(() => {
  const cachedModels = CacheManager.loadFromLocalStorage();
  if (cachedModels && cachedModels.length > 0) {
    models.value = cachedModels;
    console.log(`已从缓存加载 ${cachedModels.length} 个模型`);
  }
});
</script>

<template>
  <div class="space-y-6">
    <!-- 输入组件 -->
    <ModelUrlInput 
      ref="inputComponent"
      @fetch-model="fetchModelInfo" 
    />
    
    <!-- 缓存管理组件 -->
    <CacheManagement 
      :models="models"
      @models-loaded="handleModelsLoaded"
      @cache-updated="() => {}"
      @calendar-refresh="handleCalendarRefresh"
    />

    <!-- 日历组件切换按钮 -->
    <div class="flex justify-center">
      <button
        @click="toggleCalendar"
        class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition text-sm font-medium flex items-center gap-2"
      >
        📅 {{ showCalendar ? '隐藏日历' : '显示保存历史日历' }}
      </button>
    </div>

    <!-- 日历组件 -->
    <div v-if="showCalendar" class="w-full">
      <Calendar
        ref="calendarRef"
        @day-click="handleCalendarDayClick"
        @month-change="handleCalendarMonthChange"
        @load-day-cache="handleLoadDayCache"
        @clear-day-cache="handleClearDayCache"
      />
    </div>
    
    <!-- 错误提示 -->
    <div v-if="error" class="p-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
      <span class="font-medium">错误!</span> {{ error }}
    </div>

    <!-- 批量操作区域 -->
    <div v-if="hasModels" class="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg shadow-xl p-6">
      <div class="flex flex-wrap gap-3 items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-lg font-semibold">📋 已获取 {{ models.length }} 个模型</span>
        </div>
        <div class="flex flex-wrap gap-3">
          <button
            @click="exportAllModels"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm font-medium"
          >
            📦 批量导出 ZIP
          </button>
          <button
            @click="clearAllModels"
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm font-medium"
          >
            🗑️ 清空所有
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
      <p class="text-gray-400 text-sm mt-2">请在上方输入 Civitai 模型 URL 开始获取，或从缓存/JSON文件导入已保存的模型</p>
    </div>
  </div>
</template>

