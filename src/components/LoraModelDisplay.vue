<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { getLoraModelInfo } from './info_getter';
import type { LoraModel } from './lora_api_types';
import ModelUrlInput from './ModelUrlInput.vue';
import ModelCard from './ModelCard.vue';
import CacheManagement from './CacheManagement.vue';
import Calendar from './Calendar.vue';
import DataDaysGrid from './DataDaysGrid.vue';
import ModelSearch from './ModelSearch.vue';
import SearchShortcuts from './SearchShortcuts.vue';
import { MarkdownExporter } from './markdown_exporter';
import { CacheManager } from './cache_manager';
import { useI18n } from '../i18n';

const { t } = useI18n();

// 存储所有模型的数组
const models = ref<LoraModel[]>([]);
const error = ref<string | null>(null);

// 搜索相关状态
const filteredModels = ref<LoraModel[]>([]);
const isSearchActive = ref(false);
const currentViewDate = ref<string>(''); // 当前查看的日期

// 引用输入组件
const inputComponent = ref<InstanceType<typeof ModelUrlInput>>();
const modelCardRefs = ref<InstanceType<typeof ModelCard>[]>([]);
const calendarRef = ref<InstanceType<typeof Calendar>>();
const dataDaysGridRef = ref<InstanceType<typeof DataDaysGrid>>();

// 显示状态
const showCalendar = ref(false);
const showDataDaysGrid = ref(false);

// 计算是否有模型（包括搜索结果）
const hasModels = computed(() => {
  return models.value.length > 0 || isSearchActive.value;
});

// 计算要显示的模型列表
const displayModels = computed(() => {
  // 在搜索模式下，显示搜索结果
  if (isSearchActive.value) {
    return filteredModels.value;
  }
  // 非搜索模式下，显示当前模型列表
  return models.value;
});

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
        error.value = t('modelExists', { name: data.name });
      } else {
        // 将新模型添加到数组开头
        models.value.unshift(data);
        // 自动保存到缓存并记录今日保存
        autoSaveToCache();
        // 记录单个模型到今日
        CacheManager.recordDailySave([data]);
      }
    } else {
      error.value = t('fetchModelFailed');
    }
  } catch (e: any) {
    error.value = e.message || t('unknownError');
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
  if (confirm(t('clearAllModelsConfirm'))) {
    models.value = [];
    error.value = null;
    // 清除缓存
    CacheManager.clearLocalStorage();
  }
}

// 批量导出所有模型的 Markdown
async function exportAllModels() {
  if (models.value.length === 0) {
    alert(t('noModelsToExport'));
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
    console.error(t('exportFailed'), error);
    alert(t('exportFailed'));
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

// 统一的日期模型显示处理函数
function displayModelsForDate(date: string, dayModels: LoraModel[], source: string = 'calendar') {
  console.log(`从${source}点击日期: ${date}, 找到 ${dayModels.length} 个模型`);
  
  // 首先清空所有相关状态，确保干净的状态
  error.value = null;
  filteredModels.value = [];
  isSearchActive.value = false;
  
  // 设置当前查看的日期
  currentViewDate.value = date;
  
  // 更新日历组件的选中状态（只对calendar来源有效）
  if (source === 'calendar') {
    calendarRef.value?.setSelectedDate(date);
  }
  
  // 显示该日期的模型
  if (dayModels.length > 0) {
    // 设置为日期查看模式
    isSearchActive.value = true;
    
    // 先清空当前模型列表，再设置新的模型
    models.value = [];
    
    // 使用 nextTick 确保DOM更新后再设置新数据
    nextTick(() => {
      models.value = [...dayModels];
      filteredModels.value = [...dayModels];
      
      // 显示成功消息
      console.log(`正在显示 ${date} 的 ${dayModels.length} 个模型`);
    });
  } else {
    // 如果该日期没有模型，设置为搜索模式并显示提示信息
    isSearchActive.value = true;
    console.log(`${date} ${t('noModelsOnDate')}`);
    error.value = `${date} ${t('noModelsOnDate')}`;
    
    // 确保列表为空
    models.value = [];
    filteredModels.value = [];
  }
}

// 切换日历显示
function toggleCalendar() {
  showCalendar.value = !showCalendar.value;
}

// 切换数据日期网格显示状态
function toggleDataDaysGrid() {
  showDataDaysGrid.value = !showDataDaysGrid.value;
}

// 处理日历日期点击
function handleCalendarDayClick(date: string, dayModels: LoraModel[]) {
  displayModelsForDate(date, dayModels, 'calendar');
};

// 处理日历月份变化
function handleCalendarMonthChange(year: number, month: number) {
  console.log(`日历切换到: ${year}年${month}月`);
};

// 处理加载日期缓存
function handleLoadDayCache(date: string) {
  const models = CacheManager.getModelsForDate(date);
  displayModelsForDate(date, models, 'cache');
};

// 处理数据日期网格日期点击
function handleDataDayClick(day: any, dayModels: LoraModel[]) {
  displayModelsForDate(day.date, dayModels, 'dataGrid');
  
  // 不要自动关闭数据日期网格，让用户可以继续浏览其他日期
  // showDataDaysGrid.value = false; // 移除自动关闭
}

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

// 处理导入JSON到指定日期
function handleImportJsonToDate(date: string) {
  // 验证日期参数
  if (!date || typeof date !== 'string') {
    error.value = '无效的日期参数';
    return;
  }
  
  console.log(`开始导入JSON到指定日期: ${date}`);
  
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.style.display = 'none';
  
  input.onchange = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file) return;
    
    try {
      // 验证文件格式
      if (!file.name.toLowerCase().endsWith('.json')) {
        error.value = '请选择有效的JSON文件';
        return;
      }
      
      // 验证目标日期格式
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        error.value = `无效的日期格式: ${date}，期望格式为 YYYY-MM-DD`;
        return;
      }
      
      // 导入模型数据
      const importedModels = await CacheManager.importFromJson(file);
      
      if (importedModels.length === 0) {
        error.value = '导入的文件中没有有效的模型数据';
        return;
      }
      
      // 将导入的模型记录到指定日期（不是今天）
      CacheManager.recordDailySaveForDate(importedModels, date);
      
      // 合并到当前模型列表（避免重复）
      const existingIds = new Set(models.value.map(m => m.id));
      const newModels = importedModels.filter(m => !existingIds.has(m.id));
      
      if (newModels.length > 0) {
        models.value.unshift(...newModels);
        // 只保存到本地存储，不记录到今日（避免污染今日记录）
        CacheManager.saveToLocalStorage(models.value);
      }
      
      // 刷新日历显示
      calendarRef.value?.refresh();
      
      // 清除错误状态
      error.value = null;
      
      // 显示成功消息，明确说明导入到了指定日期
      const today = new Date().toISOString().split('T')[0];
      const isToday = date === today;
      const dateMessage = isToday ? `${date}（今天）` : date;
      
      alert(`成功导入 ${importedModels.length} 个模型到 ${dateMessage}！${newModels.length > 0 ? `其中 ${newModels.length} 个是新模型。` : '所有模型已存在于当前列表中。'}`);
      
      console.log(`导入完成: ${importedModels.length} 个模型已记录到 ${date}，${newModels.length} 个新模型已添加到当前列表`);
      
    } catch (err: any) {
      console.error('导入JSON到指定日期失败:', err);
      error.value = `导入失败: ${err.message || '未知错误'}`;
    } finally {
      // 清理临时DOM元素
      document.body.removeChild(input);
    }
  };
  
  // 添加到DOM并触发点击
  document.body.appendChild(input);
  input.click();
}

// 处理日历刷新请求
function handleCalendarRefresh() {
  calendarRef.value?.refresh();
  dataDaysGridRef.value?.refresh(); // 同时刷新数据日期网格
};

// 处理搜索结果
function handleSearchResults(searchResults: LoraModel[]) {
  console.log(`=== 搜索功能执行 ===`);
  console.log(`搜索结果: 找到 ${searchResults.length} 个模型`);
  console.log(`搜索结果详情:`, searchResults.map(m => ({ id: m.id, name: m.name })));
  
  // 清除当前显示状态
  error.value = null;
  currentViewDate.value = '';
  
  // 清除日历选中状态
  calendarRef.value?.setSelectedDate('');
  
  // 关闭数据日期网格
  showDataDaysGrid.value = false;
  
  // 设置搜索结果
  filteredModels.value = searchResults;
  isSearchActive.value = true;
  
  // 直接设置搜索结果，避免中间清空导致组件重新渲染
  models.value = [...searchResults];
  console.log(`搜索完成: 显示 ${searchResults.length} 个搜索结果`);
  console.log(`当前显示状态: isSearchActive=${isSearchActive.value}, models.length=${models.value.length}, filteredModels.length=${filteredModels.value.length}`);
}

// 处理清除搜索
function handleClearSearch() {
  console.log('清除搜索状态并恢复主模型列表');
  
  // 清除搜索相关状态
  filteredModels.value = [];
  isSearchActive.value = false;
  currentViewDate.value = '';
  error.value = null;
  
  // 关闭数据日期网格
  showDataDaysGrid.value = false;
  
  // 清除日历选中状态
  calendarRef.value?.setSelectedDate('');
  
  // 恢复当前模型列表（从缓存重新加载）
  const cachedModels = CacheManager.loadFromLocalStorage();
  if (cachedModels && cachedModels.length > 0) {
    models.value = cachedModels;
    console.log(`已恢复主模型列表: ${cachedModels.length} 个模型`);
  } else {
    models.value = [];
    console.log('没有缓存的模型，显示空列表');
  }
}

// 处理搜索快捷方式
function handleQuickSearch(query: string) {
  const results = CacheManager.searchModels(query);
  handleSearchResults(results);
}

// 处理高级搜索快捷方式
function handleQuickAdvancedSearch(options: any) {
  if (options.customResults) {
    // 直接使用自定义结果
    handleSearchResults(options.customResults);
  } else {
    // 使用高级搜索
    const results = CacheManager.advancedSearchModels(options);
    handleSearchResults(results);
  }
}

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

    <!-- 搜索快捷方式 -->
    <SearchShortcuts
      v-if="hasModels"
      @search="handleQuickSearch"
      @advanced-search="handleQuickAdvancedSearch"
    />

    <!-- 搜索组件 -->
    <ModelSearch
      v-if="hasModels"
      @search-results="handleSearchResults"
      @clear-search="handleClearSearch"
    />

    <!-- 日历组件切换按钮 -->
    <div class="flex justify-center gap-3">
      <button
        @click="toggleCalendar"
        class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition text-sm font-medium flex items-center gap-2"
      >
        📅 {{ showCalendar ? t('hideCalendar') : t('showCalendar') }}
      </button>
      <button
        @click="toggleDataDaysGrid"
        class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition text-sm font-medium flex items-center gap-2"
      >
        📊 {{ showDataDaysGrid ? t('hideDataGrid') : t('showDataGrid') }}
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
        @import-json-to-date="handleImportJsonToDate"
      />
    </div>

    <!-- 数据日期网格组件 -->
    <div v-if="showDataDaysGrid" class="w-full">
      <DataDaysGrid
        ref="dataDaysGridRef"
        :currentViewDate="currentViewDate"
        @day-click="handleDataDayClick"
        @close="showDataDaysGrid = false"
      />
    </div>
    
    <!-- 错误提示 -->
    <div v-if="error" class="p-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
      <span class="font-medium">{{ t('error') }}!</span> {{ error }}
    </div>

    <!-- 批量操作区域 -->
    <div v-if="hasModels" class="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg shadow-xl p-6">
      <div class="flex flex-wrap gap-3 items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-lg font-semibold">
            📋 
            <span v-if="isSearchActive">
              {{ t('searchResults') }}: {{ displayModels.length }} {{ t('models') }}
            </span>
            <span v-else-if="currentViewDate">
              {{ currentViewDate }} {{ t('modelsOnDate') }}: {{ displayModels.length }} {{ t('models') }}
            </span>
            <span v-else>
              {{ t('totalModels') }} {{ models.length }} {{ t('models') }}
            </span>
          </span>
        </div>
        <div class="flex flex-wrap gap-3">
          <button
            @click="exportAllModels"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm font-medium"
          >
            📦 {{ t('batchExport') }}
          </button>
          <button
            @click="clearAllModels"
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm font-medium"
          >
            🗑️ {{ t('clearAll') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 模型卡片列表 -->
    <div v-if="displayModels.length > 0" class="space-y-6">
      <ModelCard
        v-for="(model, index) in displayModels"
        :key="model.id"
        ref="modelCardRefs"
        :model-info="model"
        :index="models.findIndex(m => m.id === model.id)"
        @remove="removeModel"
      />
    </div>

    <!-- 搜索无结果状态 -->
    <div v-if="isSearchActive && displayModels.length === 0" class="text-center p-12 bg-white dark:bg-gray-900 rounded-lg shadow-xl">
      <p class="text-gray-500 text-lg">🔍 {{ t('noSearchResults') }}</p>
      <p class="text-gray-400 text-sm mt-2">{{ t('searchHint') }}</p>
    </div>

    <!-- 空状态 -->
    <div v-if="!hasModels" class="text-center p-12 bg-white dark:bg-gray-900 rounded-lg shadow-xl">
      <p class="text-gray-500 text-lg">{{ t('noModelsYet') }}</p>
      <p class="text-gray-400 text-sm mt-2">{{ t('getStartedHint') }}</p>
    </div>
  </div>
</template>

