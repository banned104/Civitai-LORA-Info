<template>
  <div class="export-panel bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
    <h3 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
      📤 导出选项
    </h3>

    <!-- 导出类型选择 -->
    <div class="space-y-4">
      <div
        v-for="exportOption in exportOptions"
        :key="exportOption.type"
        class="export-option"
        :class="{ 'selected': selectedExportType === exportOption.type }"
        @click="selectExportType(exportOption.type)"
      >
        <div class="flex items-center space-x-3">
          <input
            type="radio"
            :id="exportOption.type"
            :value="exportOption.type"
            v-model="selectedExportType"
            class="text-blue-600"
          />
          <div class="flex-1">
            <label 
              :for="exportOption.type"
              class="block font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              {{ exportOption.name }}
            </label>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ exportOption.description }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 高级选项 -->
    <div v-if="showAdvancedOptions" class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      <h4 class="text-md font-medium mb-3 text-gray-700 dark:text-gray-300">
        ⚙️ 高级选项
      </h4>
      
      <!-- 自定义文件名 -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          自定义文件名 (可选)
        </label>
        <input
          v-model="customFilename"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                 focus:outline-none focus:ring-2 focus:ring-blue-500 
                 dark:bg-gray-800 dark:text-gray-200"
          placeholder="留空使用默认文件名"
        />
      </div>

      <!-- 日期范围选择 -->
      <div v-if="needsDateRange" class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            开始日期
          </label>
          <input
            v-model="dateRange.startDate"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 
                   dark:bg-gray-800 dark:text-gray-200"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            结束日期
          </label>
          <input
            v-model="dateRange.endDate"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 
                   dark:bg-gray-800 dark:text-gray-200"
          />
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="mt-6 flex items-center justify-between">
      <button
        @click="toggleAdvancedOptions"
        class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        {{ showAdvancedOptions ? '隐藏高级选项' : '显示高级选项' }}
      </button>
      
      <div class="space-x-3">
        <button
          @click="cancelExport"
          class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          取消
        </button>
        <button
          @click="startExport"
          :disabled="isExporting || !selectedExportType"
          class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {{ isExporting ? '导出中...' : '开始导出' }}
        </button>
      </div>
    </div>

    <!-- 导出状态显示 -->
    <div v-if="exportStatus" class="mt-4 p-3 rounded-md" :class="exportStatusClass">
      <div class="flex items-center space-x-2">
        <span v-if="exportStatus.success">✅</span>
        <span v-else>❌</span>
        <span class="text-sm">{{ exportStatus.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ExportManager, ExportType, type ExportConfig, type ExportResult } from './export_manager';
import type { LoraModel } from './lora_api_types';

interface Props {
  models: LoraModel[];
}

interface Emits {
  (e: 'close'): void;
  (e: 'exportComplete', result: ExportResult): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 响应式数据
const selectedExportType = ref<ExportType | null>(null);
const customFilename = ref('');
const showAdvancedOptions = ref(false);
const isExporting = ref(false);
const exportStatus = ref<ExportResult | null>(null);

// 日期范围
const dateRange = ref({
  startDate: '',
  endDate: ''
});

// 导出选项
const exportOptions = ref(ExportManager.getSupportedExportTypes());

// 计算属性
const needsDateRange = computed(() => 
  selectedExportType.value === ExportType.DAILY_JSON || 
  selectedExportType.value === ExportType.DAILY_MARKDOWN
);

const exportStatusClass = computed(() => ({
  'bg-green-50 text-green-800 border border-green-200': exportStatus.value?.success,
  'bg-red-50 text-red-800 border border-red-200': exportStatus.value && !exportStatus.value.success
}));

// 方法
const selectExportType = (type: ExportType) => {
  selectedExportType.value = type;
  exportStatus.value = null;
};

const toggleAdvancedOptions = () => {
  showAdvancedOptions.value = !showAdvancedOptions.value;
};

const startExport = async () => {
  if (!selectedExportType.value) return;
  
  isExporting.value = true;
  exportStatus.value = null;
  
  try {
    const config: ExportConfig = {
      type: selectedExportType.value,
      filename: customFilename.value || undefined,
      includeMetadata: true
    };
    
    // 如果需要日期范围且用户设置了，则添加到配置中
    if (needsDateRange.value && dateRange.value.startDate && dateRange.value.endDate) {
      config.dateRange = {
        startDate: dateRange.value.startDate,
        endDate: dateRange.value.endDate
      };
    }
    
    const result = await ExportManager.export(props.models, config);
    exportStatus.value = result;
    
    if (result.success) {
      emit('exportComplete', result);
      
      // 成功后延迟关闭面板
      setTimeout(() => {
        emit('close');
      }, 2000);
    }
    
  } catch (error) {
    console.error('导出过程出错:', error);
    exportStatus.value = {
      success: false,
      message: error instanceof Error ? error.message : '导出过程中发生未知错误'
    };
  } finally {
    isExporting.value = false;
  }
};

const cancelExport = () => {
  emit('close');
};

// 初始化日期范围
const initializeDateRange = () => {
  const today = new Date();
  const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
  
  dateRange.value.endDate = today.toISOString().split('T')[0];
  dateRange.value.startDate = oneMonthAgo.toISOString().split('T')[0];
};

// 生命周期
onMounted(() => {
  initializeDateRange();
  
  // 默认选择第一个选项
  if (exportOptions.value.length > 0) {
    selectedExportType.value = exportOptions.value[0].type;
  }
});
</script>

<style scoped>
.export-option {
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.export-option:hover {
  border-color: #93c5fd;
}

.dark .export-option {
  border-color: #374151;
}

.dark .export-option:hover {
  border-color: #2563eb;
}

.export-option.selected {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.dark .export-option.selected {
  background-color: rgba(29, 78, 216, 0.2);
}

.export-option input[type="radio"] {
  width: 1rem;
  height: 1rem;
}
</style>
