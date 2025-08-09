<template>
  <div class="calendar-container bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
    <!-- 日历头部：月份导航 -->
    <div class="calendar-header flex items-center justify-between mb-6">
      <div class="flex items-center space-x-2">
        <button
          @click="goToPreviousYear"
          class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="上一年"
        >
          <span class="text-lg">⏪</span>
        </button>
        <button
          @click="goToPreviousMonth"
          class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="上个月"
        >
          <span class="text-lg">◀</span>
        </button>
      </div>
      
      <h2 class="text-xl font-bold text-gray-800 dark:text-gray-200">
        {{ monthDisplay }}
      </h2>
      
      <div class="flex items-center space-x-2">
        <button
          @click="goToNextMonth"
          class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="下个月"
        >
          <span class="text-lg">▶</span>
        </button>
        <button
          @click="goToNextYear"
          class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="下一年"
        >
          <span class="text-lg">⏩</span>
        </button>
      </div>
    </div>

    <!-- 快速导航 -->
    <div class="quick-nav flex items-center justify-center mb-4 space-x-4">
      <button
        @click="goToToday"
        class="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        📅 今天
      </button>
      <select
        v-model="selectedYear"
        @change="goToYear"
        class="px-2 py-1 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
      >
        <option v-for="year in availableYears" :key="year" :value="year">
          {{ year }}年
        </option>
      </select>
    </div>

    <!-- 图例说明 -->
    <div class="legend flex items-center justify-center mb-4 space-x-4 text-sm text-gray-600 dark:text-gray-400">
      <div class="flex items-center space-x-1">
        <div class="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <span>无记录</span>
      </div>
      <div class="flex items-center space-x-1">
        <div class="w-3 h-3 bg-green-300 rounded"></div>
        <span>有记录</span>
      </div>
      
      <!-- 筛选选项 -->
      <div class="flex items-center space-x-2 ml-4">
        <label class="flex items-center space-x-1 cursor-pointer">
          <input 
            v-model="showOnlyWithData" 
            type="checkbox" 
            class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
          <span class="text-sm">只显示有记录的日期</span>
        </label>
      </div>
    </div>

    <!-- 星期标题 -->
    <div class="weekday-header grid grid-cols-7 gap-1 mb-2">
      <div
        v-for="weekday in weekDayNames"
        :key="weekday"
        class="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2"
      >
        {{ weekday }}
      </div>
    </div>

    <!-- 日历网格 -->
    <div class="calendar-grid grid grid-cols-7 gap-1">
      <CalendarDay
        v-for="day in calendarDays"
        :key="day.date"
        :day="day"
        @click="onDayClick"
        @contextmenu="onDayContextMenu"
        @mouseenter="onDayHover"
        @mouseleave="onDayLeave"
      />
    </div>

    <!-- Tooltip 提示框 -->
    <CalendarTooltip
      v-if="showTooltip"
      :day="hoveredDay"
      :position="tooltipPosition"
    />

    <!-- 右键菜单 -->
    <CalendarContextMenu
      :visible="showContextMenu"
      :day="contextMenuDay"
      :position="contextMenuPosition"
      @close="closeContextMenu"
      @loadDayCache="loadDayCache"
      @clearDayCache="clearDayCache"
      @viewDetails="viewDayDetails"
      @importJsonToDate="importJsonToDate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { CalendarUtils } from './calendar_utils';
import { CacheManager } from './cache_manager';
import type { CalendarDay as CalendarDayType, CalendarProps, CalendarEmits } from './calendar_types';
import CalendarDay from './CalendarDay.vue';
import CalendarTooltip from './CalendarTooltip.vue';
import CalendarContextMenu from './CalendarContextMenu.vue';

// Props
const props = withDefaults(defineProps<CalendarProps>(), {
  currentYear: () => new Date().getFullYear(),
  currentMonth: () => new Date().getMonth() + 1,
  config: () => ({})
});

// Emits
const emit = defineEmits<CalendarEmits>();

// 响应式数据
const currentYear = ref(props.currentYear);
const currentMonth = ref(props.currentMonth);
const selectedYear = ref(props.currentYear);
const calendarDays = ref<CalendarDayType[]>([]);
const allCalendarDays = ref<CalendarDayType[]>([]); // 保存完整的日历数据
const showOnlyWithData = ref(false); // 筛选选项

// Tooltip 相关
const showTooltip = ref(false);
const hoveredDay = ref<CalendarDayType | null>(null);
const tooltipPosition = ref({ x: 0, y: 0 });

// Context Menu 相关
const showContextMenu = ref(false);
const contextMenuDay = ref<CalendarDayType | null>(null);
const contextMenuPosition = ref({ x: 0, y: 0 });

// 计算属性
const monthDisplay = computed(() => 
  CalendarUtils.formatMonthDisplay(currentYear.value, currentMonth.value)
);

const weekDayNames = computed(() => 
  CalendarUtils.getWeekDayNames(props.config?.firstDayOfWeek)
);

const availableYears = computed(() => {
  const currentYearVal = new Date().getFullYear();
  const years = [];
  for (let year = currentYearVal - 5; year <= currentYearVal + 2; year++) {
    years.push(year);
  }
  return years;
});

// 方法
const loadCalendarData = async () => {
  try {
    const records = CacheManager.getDailyRecordsForMonth(currentYear.value, currentMonth.value);
    const allDays = CalendarUtils.generateCalendarGrid(
      currentYear.value,
      currentMonth.value,
      records,
      props.config
    );
    
    // 保存完整数据
    allCalendarDays.value = allDays;
    
    // 应用筛选
    applyFilter();
  } catch (error) {
    console.error('加载日历数据失败:', error);
    allCalendarDays.value = [];
    calendarDays.value = [];
  }
};

// 应用筛选
const applyFilter = () => {
  if (showOnlyWithData.value) {
    // 只显示有记录的日期，但保持空白占位符以维持网格布局
    calendarDays.value = allCalendarDays.value.map(day => {
      if (!day.hasRecord) {
        // 创建空白占位符
        return {
          ...day,
          date: '',
          isCurrentMonth: false,
          isEmpty: true
        };
      }
      return day;
    });
  } else {
    // 显示所有日期
    calendarDays.value = allCalendarDays.value;
  }
};

const goToPreviousMonth = () => {
  const prev = CalendarUtils.getRelativeMonth(currentYear.value, currentMonth.value, -1);
  updateMonth(prev.year, prev.month);
};

const goToNextMonth = () => {
  const next = CalendarUtils.getRelativeMonth(currentYear.value, currentMonth.value, 1);
  updateMonth(next.year, next.month);
};

const goToPreviousYear = () => {
  updateMonth(currentYear.value - 1, currentMonth.value);
};

const goToNextYear = () => {
  updateMonth(currentYear.value + 1, currentMonth.value);
};

const goToToday = () => {
  const today = CalendarUtils.getCurrentYearMonth();
  updateMonth(today.year, today.month);
};

const goToYear = () => {
  updateMonth(selectedYear.value, currentMonth.value);
};

const updateMonth = (year: number, month: number) => {
  if (!CalendarUtils.isValidYearMonth(year, month)) {
    console.warn('无效的年月:', year, month);
    return;
  }
  
  currentYear.value = year;
  currentMonth.value = month;
  selectedYear.value = year;
  
  emit('monthChange', year, month);
  loadCalendarData();
};

const onDayClick = (day: CalendarDayType) => {
  // 无论是否有记录都处理点击事件
  if (day.hasRecord) {
    // 如果有记录，获取当日的所有模型
    const models = CacheManager.getModelsForDate(day.date);
    emit('dayClick', day.date, models);
  } else {
    // 如果没有记录，发送空数组
    emit('dayClick', day.date, []);
  }
};

const onDayContextMenu = (event: MouseEvent, day: CalendarDayType) => {
  contextMenuDay.value = day;
  contextMenuPosition.value = {
    x: event.clientX,
    y: event.clientY
  };
  showContextMenu.value = true;
  
  // 关闭tooltip
  showTooltip.value = false;
};

const onDayHover = (event: MouseEvent, day: CalendarDayType) => {
  if (day.hasRecord && day.totalModelCount > 0 && !showContextMenu.value) {
    hoveredDay.value = day;
    tooltipPosition.value = {
      x: event.clientX,
      y: event.clientY
    };
    showTooltip.value = true;
  }
};

const onDayLeave = () => {
  showTooltip.value = false;
  hoveredDay.value = null;
};

// 加载指定日期的缓存
const loadDayCache = (date: string) => {
  try {
    const models = CacheManager.getModelsForDate(date);
    if (models.length > 0) {
      emit('dayClick', date, models.map(m => m.name));
      console.log(`加载 ${date} 的缓存，共 ${models.length} 个模型`);
    } else {
      console.log(`${date} 没有缓存的模型`);
    }
  } catch (error) {
    console.error('加载日期缓存失败:', error);
  }
};

// 清除指定日期的缓存
const clearDayCache = (date: string) => {
  try {
    const success = CacheManager.clearDailyRecord(date);
    if (success) {
      console.log(`已清除 ${date} 的缓存记录`);
      loadCalendarData(); // 重新加载日历数据
    } else {
      console.log(`清除 ${date} 的缓存记录失败`);
    }
  } catch (error) {
    console.error('清除日期缓存失败:', error);
  }
};

// 查看日期详情
const viewDayDetails = (date: string, modelTitles: string[]) => {
  console.log(`查看 ${date} 的详情:`, modelTitles);
  // 可以在这里触发一个详情弹窗或其他UI交互
};

// 导入JSON到指定日期
const importJsonToDate = (date: string) => {
  emit('importJsonToDate', date);
};

// 关闭右键菜单
const closeContextMenu = () => {
  showContextMenu.value = false;
  contextMenuDay.value = null;
};

// 监听器
watch([currentYear, currentMonth], () => {
  loadCalendarData();
}, { immediate: false });

// 生命周期
onMounted(() => {
  loadCalendarData();
});

// 暴露方法给父组件
defineExpose({
  refresh: loadCalendarData,
  goToMonth: updateMonth,
  goToToday
});
</script>

<style scoped>
.calendar-container {
  max-width: 800px;
  margin: 0 auto;
}

.calendar-grid {
  min-height: 320px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .calendar-container {
    padding: 1rem;
  }
  
  .quick-nav {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .legend {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>
