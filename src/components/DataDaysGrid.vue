<!--
  DataDaysGrid.vue
  
  数据日期网格组件 - 展示所有有LORA数据的日期
  
  功能特性:
  - 以网格形式展示所有有数据的日期
  - 显示每个日期的模型数量
  - 支持点击日期查看对应的LORA模型
  - 响应式布局，适配不同屏幕尺寸
  - 高亮当前选中的日期
  
  Props:
  - currentViewDate: 当前查看的日期，用于高亮显示
  
  Events:
  - dayClick: 点击日期时触发，传递日期信息和对应的模型列表
  - close: 请求关闭组件时触发
  
  作者: GitHub Copilot
  创建时间: 2025-01-10
-->
<template>
  <div class="w-full max-w-6xl mx-auto p-4">
    <!-- 头部标题和统计信息 -->
    <div class="mb-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        📊 有数据的日期一览
      </h2>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        共找到 {{ dataDays.length }} 个有LORA数据的日期
      </p>
    </div>

    <!-- 日期网格 -->
    <div v-if="dataDays.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
      <div
        v-for="day in dataDays"
        :key="day.date"
        class="relative group cursor-pointer"
        :class="{ 'ring-2 ring-blue-500 ring-opacity-50': day.date === currentViewDate }"
        @click="handleDayClick(day)"
      >
        <CalendarDay
          :day="day"
          :isCurrentMonth="true"
          :currentViewDate="currentViewDate"
          @click="handleDayClick(day)"
          @contextmenu="handleDayContextMenu"
          @mouseenter="handleDayMouseEnter"
          @mouseleave="handleDayMouseLeave"
        />
        
        <!-- 日期标签 -->
        <div class="mt-2 text-center">
          <div class="text-xs font-medium text-gray-700 dark:text-gray-300"
               :class="{ 'text-blue-600 dark:text-blue-400 font-bold': day.date === currentViewDate }">
            {{ formatDateLabel(day.date) }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400"
               :class="{ 'text-blue-500 dark:text-blue-300': day.date === currentViewDate }">
            {{ day.totalModelCount }} 个模型
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="text-center py-12">
      <div class="text-gray-400 dark:text-gray-600 text-lg mb-2">📅</div>
      <p class="text-gray-500 dark:text-gray-400">暂无保存的LORA数据</p>
    </div>

    <!-- 关闭按钮 -->
    <div class="mt-6 flex justify-center">
      <button
        @click="$emit('close')"
        class="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition text-sm font-medium"
      >
        关闭
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import CalendarDay from './CalendarDay.vue'
import type { CalendarDay as CalendarDayType } from './calendar_types'
import type { LoraModel } from './lora_api_types'
import { CacheManager } from './cache_manager'

// 定义组件的 props 和 emits
interface Props {
  currentViewDate?: string
}

const props = withDefaults(defineProps<Props>(), {
  currentViewDate: ''
})

const emit = defineEmits<{
  dayClick: [day: CalendarDayType, models: LoraModel[]]
  close: []
}>()

// 响应式数据
const dataDays = ref<CalendarDayType[]>([])

// 获取有数据的日期
async function loadDataDays() {
  try {
    const dailyRecords = CacheManager.getDailyRecords()
    
    // 转换为 CalendarDay 格式并按日期排序
    dataDays.value = dailyRecords
      .map(record => ({
        date: record.date,
        day: new Date(record.date).getDate(),
        hasRecord: true,
        modelTitles: record.modelTitles,
        totalModelCount: record.modelIds.length,
        isCurrentMonth: true,
        isToday: record.date === new Date().toISOString().split('T')[0]
      } as CalendarDayType))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // 按日期倒序排列
  } catch (error) {
    console.error('加载数据日期失败:', error)
    dataDays.value = []
  }
}

// 格式化日期标签
function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  const diffTime = today.getTime() - targetDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return '今天'
  } else if (diffDays === 1) {
    return '昨天'
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    })
  }
}

// 处理日期点击
async function handleDayClick(day: CalendarDayType) {
  try {
    const models = CacheManager.getModelsForDate(day.date)
    emit('dayClick', day, models)
  } catch (error) {
    console.error('获取日期数据失败:', error)
    emit('dayClick', day, [])
  }
}

// 处理日期右键菜单（暂时禁用）
function handleDayContextMenu(event: Event) {
  event.preventDefault()
}

// 处理鼠标悬停（暂时禁用）
function handleDayMouseEnter() {
  // 可以在这里添加悬停效果
}

function handleDayMouseLeave() {
  // 可以在这里清除悬停效果
}

// 组件挂载时加载数据
onMounted(() => {
  loadDataDays()
})

// 暴露刷新方法给父组件
defineExpose({
  refresh: loadDataDays
})
</script>

<style scoped>
/* 确保网格布局在不同屏幕尺寸下的响应性 */
@media (max-width: 640px) {
  .grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 641px) and (max-width: 768px) {
  .sm\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .md\:grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 1025px) and (max-width: 1280px) {
  .lg\:grid-cols-6 {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

@media (min-width: 1281px) {
  .xl\:grid-cols-8 {
    grid-template-columns: repeat(8, minmax(0, 1fr));
  }
}
</style>
