<template>
  <div
    class="calendar-day"
    :class="dayClasses"
    @click="handleClick"
    @contextmenu.prevent="handleContextMenu"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <span class="day-number">{{ day.day }}</span>
    <div v-if="day.hasRecord" class="record-indicator"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CalendarDay } from './calendar_types';
import { CalendarUtils } from './calendar_utils';

interface Props {
  day: CalendarDay;
}

interface Emits {
  (e: 'click', day: CalendarDay): void;
  (e: 'contextmenu', event: MouseEvent, day: CalendarDay): void;
  (e: 'mouseenter', event: MouseEvent, day: CalendarDay): void;
  (e: 'mouseleave'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 计算日期方块的样式类
const dayClasses = computed(() => {
  const classes = [];
  
  // 基础样式
  classes.push('relative', 'flex', 'flex-col', 'items-center', 'justify-center', 
               'min-h-[40px]', 'rounded-md', 'transition-colors', 'duration-200');
  
  // 是否属于当前月份
  if (props.day.isCurrentMonth) {
    classes.push('text-gray-800', 'dark:text-gray-200');
  } else {
    classes.push('text-gray-400', 'dark:text-gray-600');
  }
  
  // 是否是今天
  if (props.day.isToday) {
    classes.push('ring-2', 'ring-blue-500', 'ring-offset-1');
  }
  
  // 根据记录情况设置背景色
  if (props.day.hasRecord) {
    const intensityLevel = CalendarUtils.getIntensityLevel(props.day.totalModelCount);
    switch (intensityLevel) {
      case 1:
        classes.push('bg-green-100', 'dark:bg-green-900', 'hover:bg-green-200', 'dark:hover:bg-green-800');
        break;
      case 2:
        classes.push('bg-green-200', 'dark:bg-green-800', 'hover:bg-green-300', 'dark:hover:bg-green-700');
        break;
      case 3:
        classes.push('bg-green-300', 'dark:bg-green-700', 'hover:bg-green-400', 'dark:hover:bg-green-600');
        break;
      case 4:
        classes.push('bg-green-400', 'dark:bg-green-600', 'hover:bg-green-500', 'dark:hover:bg-green-500');
        break;
      default:
        classes.push('bg-green-50', 'dark:bg-green-950', 'hover:bg-green-100', 'dark:hover:bg-green-900');
    }
    classes.push('cursor-pointer');
  } else {
    classes.push('bg-gray-50', 'dark:bg-gray-800', 'hover:bg-gray-100', 'dark:hover:bg-gray-700');
  }
  
  return classes;
});

// 事件处理
const handleClick = () => {
  emit('click', props.day);
};

const handleContextMenu = (event: MouseEvent) => {
  emit('contextmenu', event, props.day);
};

const handleMouseEnter = (event: MouseEvent) => {
  emit('mouseenter', event, props.day);
};

const handleMouseLeave = () => {
  emit('mouseleave');
};
</script>

<style scoped>
.calendar-day {
  aspect-ratio: 1;
  min-width: 40px;
  position: relative;
}

.day-number {
  font-size: 0.875rem;
  font-weight: 500;
  z-index: 1;
}

.record-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 6px;
  height: 6px;
  background-color: currentColor;
  border-radius: 50%;
  opacity: 0.6;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .calendar-day {
    min-width: 32px;
    min-height: 32px;
  }
  
  .day-number {
    font-size: 0.75rem;
  }
  
  .record-indicator {
    width: 4px;
    height: 4px;
    bottom: 1px;
    right: 1px;
  }
}
</style>
