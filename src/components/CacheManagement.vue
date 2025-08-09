<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { CacheManager } from './cache_manager';
import { ExportManager, ExportType } from './export_manager';
import type { LoraModel } from './lora_api_types';
import type { ExportResult } from './export_manager';
import ExportPanel from './ExportPanel.vue';

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
      // 记录今日保存
      CacheManager.recordDailySave(props.models);
      updateCacheStats();
      // 通知刷新日历
      emit('calendarRefresh');
      alert(`成功缓存 ${props.models.length} 个模型到本地存储`);
      emit('cacheUpdated');
    } else {
      alert('缓存失败，请检查浏览器存储权限');
    }
  } catch (error) {
    console.error('缓存失败:', error);
    alert('缓存失败，请重试');
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
      alert(`成功从缓存加载 ${cachedModels.length} 个模型`);
    } else {
      alert('没有找到缓存数据');
    }
  } catch (error) {
    console.error('加载缓存失败:', error);
    alert('加载缓存失败，请重试');
  }
}

// 清除本地缓存
function clearCache() {
  if (confirm('确定要清除本地缓存吗？这将删除所有已保存的模型数据和日历记录。')) {
    CacheManager.clearLocalStorage();
    updateCacheStats();
    // 通知刷新日历
    emit('calendarRefresh');
    alert('本地缓存已清除');
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
    alert('没有模型可以导出');
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
    
    // 合并导入的模型和现有模型
    const mergedModels = CacheManager.mergeModels(props.models, importedModels);
    emit('modelsLoaded', mergedModels);
    
    // 保存合并后的模型到缓存
    CacheManager.saveToLocalStorage(mergedModels);
    
    // 记录今日导入的模型到日历
    CacheManager.recordDailySave(importedModels);
    
    // 更新缓存统计
    updateCacheStats();
    
    // 通知刷新日历
    emit('calendarRefresh');
    
    alert(`成功导入 ${importedModels.length} 个模型`);
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
      <h3 class="text-lg font-semibold">💾 缓存管理</h3>
      <div class="text-sm text-gray-500">
        <span v-if="cacheStats.hasCache">
          缓存: {{ cacheStats.modelsCount }} 个模型 | 更新: {{ cacheStats.lastUpdated }}
        </span>
        <span v-else>暂无缓存</span>
      </div>
    </div>

    <!-- 操作按钮组 -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <!-- 保存到缓存 -->
      <button
        @click="saveToCache"
        :disabled="!hasModelsToCache"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-sm font-medium"
        title="将当前模型保存到本地缓存"
      >
        💾 保存缓存
      </button>

      <!-- 从缓存加载 -->
      <button
        @click="loadFromCache"
        :disabled="!cacheStats.hasCache"
        class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-sm font-medium"
        title="从本地缓存加载模型"
      >
        📂 加载缓存
      </button>

      <!-- 快速导出JSON -->
      <button
        @click="quickExportJson"
        :disabled="!hasModelsToCache"
        class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-sm font-medium"
        title="快速导出当前模型为JSON文件"
      >
        📄 快速导出
      </button>

      <!-- 高级导出 -->
      <button
        @click="exportToJson"
        :disabled="!hasModelsToCache"
        class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-sm font-medium"
        title="选择导出方式和格式"
      >
        📤 高级导出
      </button>

      <!-- 导入JSON -->
      <button
        @click="triggerFileImport"
        :disabled="isLoading"
        class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-sm font-medium"
        title="从JSON文件导入模型数据"
      >
        <span v-if="isLoading">⏳ 导入中...</span>
        <span v-else>📥 导入JSON</span>
      </button>

      <!-- 清除缓存 -->
      <button
        @click="clearCache"
        :disabled="!cacheStats.hasCache"
        class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-sm font-medium"
        title="清除本地缓存数据"
      >
        🗑️ 清除缓存
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
      <p>• 本地缓存使用浏览器存储，清除浏览器数据会丢失缓存</p>
      <p>• JSON导出/导入功能可用于数据备份和跨设备同步</p>
      <p>• 导入时会自动去重，相同ID的模型会被更新</p>
    </div>
  </div>
</template>
