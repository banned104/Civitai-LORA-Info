<template>
  <div class="prompt-calendar">
    <div class="calendar-header">
      <button @click="previousMonth" class="nav-button">
        ‹
      </button>
      <h3 class="month-title">
        {{ currentYear }}年 {{ currentMonth + 1 }}月
      </h3>
      <button @click="nextMonth" class="nav-button">
        ›
      </button>
    </div>

    <div class="calendar-grid">
      <!-- 星期标题 -->
      <div 
        v-for="day in weekdays" 
        :key="day" 
        class="weekday-header"
      >
        {{ day }}
      </div>

      <!-- 日期格子 -->
      <div
        v-for="date in calendarDates"
        :key="date.key"
        class="date-cell"
        :class="{
          'other-month': !date.isCurrentMonth,
          'today': date.isToday,
          'has-prompts': date.promptCount > 0,
          'selected': date.dateString === selectedDate
        }"
        @click="handleDateClick(date)"
      >
        <div class="date-number">{{ date.day }}</div>
        <div v-if="date.promptCount > 0" class="prompt-indicator">
          <span class="prompt-count">{{ date.promptCount }}</span>
        </div>
      </div>
    </div>

    <!-- 选中日期信息 -->
    <div v-if="selectedDateInfo" class="selected-date-info">
      <h4 class="selected-date-title">
        📅 {{ selectedDateInfo.displayDate }}
      </h4>
      <p class="prompt-summary">
        {{ selectedDateInfo.promptCount > 0 
          ? `${t('found')} ${selectedDateInfo.promptCount} ${t('promptsOnThisDate')}` 
          : t('noPromptsOnThisDate') }}
      </p>
      <button
        v-if="selectedDateInfo.promptCount > 0"
        @click="viewDatePrompts"
        class="view-prompts-btn"
      >
        📝 {{ t('viewPrompts') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { PromptCacheManager } from './prompt_cache_manager';
import type { DailyPromptRecord, PromptEntry } from './prompt_types';
import { useI18n } from '../../i18n';

const { t } = useI18n();

interface CalendarDate {
  day: number;
  dateString: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  promptCount: number;
  key: string;
}

interface SelectedDateInfo {
  dateString: string;
  displayDate: string;
  promptCount: number;
  prompts: PromptEntry[];
}

interface Emits {
  dateSelected: [date: string, prompts: PromptEntry[]];
}

const emit = defineEmits<Emits>();

// 状态
const currentDate = ref(new Date());
const selectedDate = ref<string>('');
const dailyRecords = ref<DailyPromptRecord[]>([]);
const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

// 计算属性
const currentYear = computed(() => currentDate.value.getFullYear());
const currentMonth = computed(() => currentDate.value.getMonth());

const selectedDateInfo = computed((): SelectedDateInfo | null => {
  if (!selectedDate.value) return null;

  const prompts = PromptCacheManager.getPromptsForDate(selectedDate.value);
  return {
    dateString: selectedDate.value,
    displayDate: formatDisplayDate(selectedDate.value),
    promptCount: prompts.length,
    prompts: prompts
  };
});

const calendarDates = computed((): CalendarDate[] => {
  const year = currentYear.value;
  const month = currentMonth.value;
  
  // 获取当前月的第一天和最后一天
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // 获取第一周开始的日期（可能是上个月的）
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  // 获取最后一周结束的日期（可能是下个月的）
  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
  
  const dates: CalendarDate[] = [];
  const current = new Date(startDate);
  const today = new Date();
  const todayString = formatDateString(today);
  
  while (current <= endDate) {
    const dateString = formatDateString(current);
    const promptCount = getPromptCountForDate(dateString);
    
    dates.push({
      day: current.getDate(),
      dateString: dateString,
      isCurrentMonth: current.getMonth() === month,
      isToday: dateString === todayString,
      promptCount: promptCount,
      key: `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
});

// 方法
function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
}

function getPromptCountForDate(dateString: string): number {
  const record = dailyRecords.value.find(r => r.date === dateString);
  return record ? record.promptIds.length : 0;
}

function previousMonth() {
  const newDate = new Date(currentDate.value);
  newDate.setMonth(newDate.getMonth() - 1);
  currentDate.value = newDate;
}

function nextMonth() {
  const newDate = new Date(currentDate.value);
  newDate.setMonth(newDate.getMonth() + 1);
  currentDate.value = newDate;
}

function handleDateClick(date: CalendarDate) {
  if (!date.isCurrentMonth) {
    // 如果点击的是其他月份的日期，切换到那个月
    const clickedDate = new Date(date.dateString + 'T00:00:00');
    currentDate.value = new Date(clickedDate.getFullYear(), clickedDate.getMonth(), 1);
  }
  
  selectedDate.value = date.dateString;
  
  // 获取该日期的Prompt并通知父组件
  const prompts = PromptCacheManager.getPromptsForDate(date.dateString);
  emit('dateSelected', date.dateString, prompts);
}

function viewDatePrompts() {
  if (selectedDateInfo.value) {
    emit('dateSelected', selectedDateInfo.value.dateString, selectedDateInfo.value.prompts);
  }
}

function refresh() {
  dailyRecords.value = PromptCacheManager.getDailyRecords();
}

function setSelectedDate(date: string) {
  selectedDate.value = date;
}

// 生命周期
onMounted(() => {
  refresh();
});

// 暴露方法
defineExpose({
  refresh,
  setSelectedDate
});
</script>

<style scoped>
.prompt-calendar {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

:global(.dark) .prompt-calendar {
  background: rgb(17, 24, 39);
  border: 1px solid rgb(55, 65, 81);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.nav-button {
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  border-radius: 50%;
  background: rgb(59, 130, 246);
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-button:hover {
  background: rgb(37, 99, 235);
  transform: scale(1.05);
}

.month-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgb(17, 24, 39);
  margin: 0;
}

:global(.dark) .month-title {
  color: white;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: rgb(229, 231, 235);
  border-radius: 8px;
  overflow: hidden;
}

:global(.dark) .calendar-grid {
  background: rgb(55, 65, 81);
}

.weekday-header {
  background: rgb(249, 250, 251);
  padding: 0.75rem;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(75, 85, 99);
}

:global(.dark) .weekday-header {
  background: rgb(31, 41, 55);
  color: rgb(156, 163, 175);
}

.date-cell {
  background: white;
  aspect-ratio: 1;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  min-height: 3rem;
}

.date-cell:hover {
  background: rgb(243, 244, 246);
  transform: scale(1.02);
}

:global(.dark) .date-cell {
  background: rgb(31, 41, 55);
}

:global(.dark) .date-cell:hover {
  background: rgb(55, 65, 81);
}

.date-cell.other-month {
  background: rgb(249, 250, 251);
  color: rgb(156, 163, 175);
}

.date-cell.other-month:hover {
  background: rgb(243, 244, 246);
}

:global(.dark) .date-cell.other-month {
  background: rgb(17, 24, 39);
  color: rgb(107, 114, 128);
}

.date-cell.today {
  background: rgb(219, 234, 254);
  color: rgb(30, 64, 175);
  font-weight: 700;
}

.date-cell.today:hover {
  background: rgb(191, 219, 254);
}

:global(.dark) .date-cell.today {
  background: rgb(30, 58, 138);
  color: rgb(191, 219, 254);
}

.date-cell.has-prompts {
  background: rgb(220, 252, 231);
  border: 2px solid rgb(34, 197, 94);
}

.date-cell.has-prompts:hover {
  background: rgb(187, 247, 208);
}

:global(.dark) .date-cell.has-prompts {
  background: rgb(6, 78, 59);
  border-color: rgb(34, 197, 94);
}

.date-cell.selected {
  background: rgb(37, 99, 235);
  color: white;
}

.date-cell.selected:hover {
  background: rgb(29, 78, 216);
}

.date-number {
  font-size: 0.875rem;
  font-weight: 500;
}

.prompt-indicator {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
}

.prompt-count {
  background: rgb(239, 68, 68);
  color: white;
  font-size: 0.625rem;
  font-weight: 700;
  padding: 0.125rem 0.375rem;
  border-radius: 10px;
  min-width: 1.25rem;
  text-align: center;
  display: inline-block;
}

.selected-date-info {
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgb(243, 244, 246);
  border-radius: 8px;
  text-align: center;
}

:global(.dark) .selected-date-info {
  background: rgb(31, 41, 55);
}

.selected-date-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(17, 24, 39);
  margin: 0 0 0.5rem 0;
}

:global(.dark) .selected-date-title {
  color: white;
}

.prompt-summary {
  color: rgb(75, 85, 99);
  margin: 0 0 1rem 0;
}

:global(.dark) .prompt-summary {
  color: rgb(156, 163, 175);
}

.view-prompts-btn {
  background: rgb(34, 197, 94);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.view-prompts-btn:hover {
  background: rgb(22, 163, 74);
  transform: translateY(-1px);
}

@media (max-width: 640px) {
  .prompt-calendar {
    padding: 1rem;
  }
  
  .calendar-grid {
    gap: 0.5px;
  }
  
  .date-cell {
    min-height: 2.5rem;
    padding: 0.25rem;
  }
  
  .date-number {
    font-size: 0.75rem;
  }
  
  .prompt-count {
    font-size: 0.5rem;
    padding: 0.0625rem 0.25rem;
    min-width: 1rem;
  }
}
</style>
