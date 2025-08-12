<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { CacheManager } from './cache_manager';
import { ExportManager, ExportType } from './export_manager';
import type { LoraModel } from './lora_api_types';
import type { ExportResult } from './export_manager';
import ExportPanel from './ExportPanel.vue';
import { useI18n } from '../i18n';

const { t } = useI18n();

const emit = defineEmits<{
  modelsLoaded: [models: LoraModel[]];
  cacheUpdated: [];
  calendarRefresh: [];
}>();

const props = defineProps<{
  models: LoraModel[];
}>();

const fileInput = ref<HTMLInputElement>();
const isLoading = ref(false);
const cacheStats = ref(CacheManager.getCacheStats());
const showExportPanel = ref(false);

// 计算是否有模型可以缓存
const hasModelsToCache = computed(() => props.models.length > 0);

// 更新缓存统计信息
function updateCacheStats() {
  cacheStats.value = CacheManager.getCacheStats();
}

// 保存到本地缓存
function saveToCache() {
  try {
    const success = CacheManager.saveToLocalStorage(props.models);
    if (success) {
      console.log(`💾 手动保存了 ${props.models.length} 个模型到缓存`);
      // 注意：手动保存不应该记录到今天，因为这些模型可能不是今天添加的
      // 只有在添加新模型时才记录到今天
      updateCacheStats();
      // 通知刷新日历
      emit('calendarRefresh');
      alert(t('cacheSaved', { count: props.models.length.toString() }));
      emit('cacheUpdated');
    } else {
      alert(t('cacheFailedPermission'));
    }
  } catch (error) {
    console.error(t('cacheFailed'), error);
    alert(t('cacheFailed'));
  }
}

// 从本地缓存加载
function loadFromCache() {
  try {
    const cachedModels = CacheManager.loadFromLocalStorage();
    if (cachedModels && cachedModels.length > 0) {
      // 合并现有模型和缓存模型
      const mergedModels = CacheManager.mergeModels(props.models, cachedModels);
      emit('modelsLoaded', mergedModels);
      alert(t('cacheLoaded', { count: cachedModels.length.toString() }));
    } else {
      alert(t('noCacheFound'));
    }
  } catch (error) {
    console.error(t('loadCacheFailed'), error);
    alert(t('loadCacheFailed'));
  }
}

// 清除本地缓存
function clearCache() {
  if (confirm(t('clearCacheConfirm'))) {
    CacheManager.clearLocalStorage();
    updateCacheStats();
    // 通知刷新日历
    emit('calendarRefresh');
    alert(t('cacheCleared'));
    emit('cacheUpdated');
  }
}

// 导出为JSON文件
function exportToJson() {
  showExportPanel.value = true;
}

// 关闭导出面板
function closeExportPanel() {
  showExportPanel.value = false;
}

// 快速导出当前模型为JSON
function quickExportJson() {
  if (!hasModelsToCache.value) {
    alert(t('noModelsToExport'));
    return;
  }
  
  try {
    CacheManager.exportToJson(props.models);
    alert(`成功导出 ${props.models.length} 个模型到JSON文件`);
  } catch (error) {
    console.error('导出失败:', error);
    alert('导出失败，请重试');
  }
}

// 处理导出完成
function handleExportComplete(result: ExportResult) {
  if (result.success) {
    alert(`导出成功！\n${result.message}`);
  } else {
    alert(`导出失败：${result.message}`);
  }
}

// 触发文件选择
function triggerFileImport() {
  fileInput.value?.click();
}

// 从JSON文件导入
async function importFromJson(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;
  
  if (!file.name.toLowerCase().endsWith('.json')) {
    alert('请选择JSON文件');
    return;
  }
  
  isLoading.value = true;
  
  try {
    const importedModels = await CacheManager.importFromJson(file);
    
    if (importedModels.length === 0) {
      alert('导入的文件中没有模型数据');
      return;
    }
    
    console.log(`📦 从JSON文件导入了 ${importedModels.length} 个模型`);
    
    // 合并导入的模型和现有模型
    const mergedModels = CacheManager.mergeModels(props.models, importedModels);
    emit('modelsLoaded', mergedModels);
    
    // 只保存模型数据，不自动记录到今天
    CacheManager.saveModelsOnly(mergedModels);
    
    // 只记录真正新增的模型到今天（修复版本）
    const existingIds = new Set(props.models.map(m => m.id));
    const reallyNewModels = importedModels.filter(m => !existingIds.has(m.id));
    
    if (reallyNewModels.length > 0) {
      CacheManager.recordNewModelsToday(reallyNewModels);
      console.log(`📅 已将 ${reallyNewModels.length} 个新模型记录到今天`);
    } else {
      console.log(`ℹ️  所有导入的模型都已存在，无需记录到今天`);
    }
    
    // 更新缓存统计
    updateCacheStats();
    
    // 通知刷新日历
    emit('calendarRefresh');
    
    const message = reallyNewModels.length > 0 
      ? `成功导入 ${importedModels.length} 个模型，其中 ${reallyNewModels.length} 个是新模型已记录到今天`
      : `成功导入 ${importedModels.length} 个模型，所有模型都已存在`;
    
    alert(message);
  } catch (error) {
    console.error('导入失败:', error);
    alert(error instanceof Error ? error.message : '导入失败，请检查文件格式');
  } finally {
    isLoading.value = false;
    // 清除文件输入
    if (target) target.value = '';
  }
}

// 组件挂载时更新缓存统计
onMounted(() => {
  updateCacheStats();
});
</script>

<template>
  <div class="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg shadow-xl p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">💾 {{ t('cacheManagement') }}</h3>
      <div class="text-sm text-gray-500">
        <span v-if="cacheStats.hasCache">
          {{ t('cache') }}: {{ cacheStats.modelsCount }} {{ t('models') }} | {{ t('updated') }}: {{ cacheStats.lastUpdated }}
        </span>
        <span v-else>{{ t('noCache') }}</span>
      </div>
    </div>

    <!-- 操作按钮组 -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <!-- 保存到缓存 -->
      <button
        @click="saveToCache"
        :disabled="!hasModelsToCache"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-sm font-medium"
        :title="t('saveToCacheTooltip')"
      >
        💾 {{ t('saveToCache') }}
      </button>

      <!-- 从缓存加载 -->
      <button
        @click="loadFromCache"
        :disabled="!cacheStats.hasCache"
        class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-sm font-medium"
        :title="t('loadFromCacheTooltip')"
      >
        📂 {{ t('loadFromCache') }}
      </button>

      <!-- 快速导出JSON -->
      <button
        @click="quickExportJson"
        :disabled="!hasModelsToCache"
        class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-sm font-medium"
        :title="t('quickExportJsonTooltip')"
      >
        📄 {{ t('quickExportJson') }}
      </button>

      <!-- 高级导出 -->
      <button
        @click="exportToJson"
        :disabled="!hasModelsToCache"
        class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-sm font-medium"
        :title="t('advancedExportTooltip')"
      >
        📤 {{ t('advancedExport') }}
      </button>

      <!-- 导入JSON -->
      <button
        @click="triggerFileImport"
        :disabled="isLoading"
        class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-sm font-medium"
        :title="t('importJsonTooltip')"
      >
        <span v-if="isLoading">⏳ {{ t('importing') }}...</span>
        <span v-else>📥 {{ t('importJson') }}</span>
      </button>

      <!-- 清除缓存 -->
      <button
        @click="clearCache"
        :disabled="!cacheStats.hasCache"
        class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-sm font-medium"
        :title="t('clearCacheTooltip')"
      >
        🗑️ {{ t('clearCache') }}
      </button>
    </div>

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInput"
      type="file"
      accept=".json"
      @change="importFromJson"
      class="hidden"
    />

    <!-- 导出面板 -->
    <div v-if="showExportPanel" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="max-w-2xl w-full mx-4">
        <ExportPanel 
          :models="props.models"
          @close="closeExportPanel"
          @export-complete="handleExportComplete"
        />
      </div>
    </div>

    <!-- 状态信息 -->
    <div class="mt-4 text-xs text-gray-500 space-y-1">
      <p>• {{ t('localCacheNote') }}</p>
      <p>• {{ t('jsonExportNote') }}</p>
      <p>• {{ t('importDeduplicateNote') }}</p>
    </div>
  </div>
</template>
