<template>
  <Teleport to="body">
    <div
      v-if="day && day.hasRecord"
      class="calendar-tooltip"
      :style="tooltipStyle"
    >
      <div class="tooltip-content">
        <div class="tooltip-header">
          <span class="date-text">{{ formatDate(day.date) }}</span>
          <span class="count-badge">{{ day.totalModelCount }}个模型</span>
        </div>
        
        <div class="tooltip-body">
          <div class="model-list">
            <div
              v-for="(title, index) in displayTitles"
              :key="index"
              class="model-item"
            >
              📁 {{ title }}
            </div>
            
            <div
              v-if="remainingCount > 0"
              class="more-indicator"
            >
              More ...
            </div>
          </div>
        </div>
      </div>
      
      <!-- 箭头指示器 -->
      <div class="tooltip-arrow"></div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CalendarDay } from './calendar_types';

interface Props {
  day: CalendarDay | null;
  position: { x: number; y: number };
}

const props = defineProps<Props>();

// 计算显示的标题列表
const displayTitles = computed(() => {
  if (!props.day) return [];
  return props.day.modelTitles.slice(0, 6); // 最多显示6个
});

// 计算剩余数量
const remainingCount = computed(() => {
  if (!props.day) return 0;
  return Math.max(0, props.day.totalModelCount - 6);
});

// 计算tooltip的位置样式
const tooltipStyle = computed(() => {
  const OFFSET_X = 10;
  const OFFSET_Y = -10;
  const TOOLTIP_WIDTH = 300;
  const TOOLTIP_HEIGHT = 200;
  
  let x = props.position.x + OFFSET_X;
  let y = props.position.y + OFFSET_Y;
  
  // 防止tooltip超出屏幕右边
  if (x + TOOLTIP_WIDTH > window.innerWidth) {
    x = props.position.x - TOOLTIP_WIDTH - OFFSET_X;
  }
  
  // 防止tooltip超出屏幕上方
  if (y < 0) {
    y = props.position.y + 20;
  }
  
  // 防止tooltip超出屏幕下方
  if (y + TOOLTIP_HEIGHT > window.innerHeight) {
    y = window.innerHeight - TOOLTIP_HEIGHT - 10;
  }
  
  return {
    position: 'fixed' as const,
    left: `${x}px`,
    top: `${y}px`,
    zIndex: 9999
  };
});

// 格式化日期显示
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
};
</script>

<style scoped>
.calendar-tooltip {
  max-width: 300px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  padding: 0;
  overflow: hidden;
  transition: opacity 0.2s ease-in-out;
}

.dark .calendar-tooltip {
  background: #1f2937;
  border-color: #374151;
  color: #f9fafb;
}

.tooltip-content {
  padding: 12px;
}

.tooltip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.dark .tooltip-header {
  border-bottom-color: #374151;
}

.date-text {
  font-weight: 600;
  font-size: 0.875rem;
  color: #1f2937;
}

.dark .date-text {
  color: #f9fafb;
}

.count-badge {
  background: #3b82f6;
  color: white;
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.tooltip-body {
  max-height: 150px;
  overflow-y: auto;
}

.model-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.model-item {
  font-size: 0.8rem;
  color: #4b5563;
  line-height: 1.4;
  padding: 2px 0;
  border-bottom: 1px solid #f3f4f6;
  word-break: break-word;
}

.dark .model-item {
  color: #d1d5db;
  border-bottom-color: #374151;
}

.model-item:last-child {
  border-bottom: none;
}

.more-indicator {
  font-size: 0.75rem;
  color: #6b7280;
  font-style: italic;
  margin-top: 4px;
  text-align: center;
}

.dark .more-indicator {
  color: #9ca3af;
}

.tooltip-arrow {
  position: absolute;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid white;
  bottom: -6px;
  left: 20px;
}

.dark .tooltip-arrow {
  border-top-color: #1f2937;
}

/* 滚动条样式 */
.tooltip-body::-webkit-scrollbar {
  width: 4px;
}

.tooltip-body::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 2px;
}

.tooltip-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.tooltip-body::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
