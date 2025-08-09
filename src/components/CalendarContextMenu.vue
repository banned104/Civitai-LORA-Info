<template>
  <Teleport to="body">
    <div
      v-if="visible && day"
      class="context-menu"
      :style="menuStyle"
      @click.stop
      @contextmenu.prevent
    >
      <div class="context-menu-content">
        <!-- 菜单头部 -->
        <div class="menu-header">
          <span class="date-text">{{ formatDate(day.date) }}</span>
          <span v-if="day.hasRecord" class="model-count">{{ day.modelTitles.length }}个模型</span>
        </div>

        <!-- 菜单项 -->
        <div class="menu-items">
          <!-- 加载当日缓存 -->
          <button
            v-if="day.hasRecord"
            @click="loadDayCache"
            class="menu-item load-item"
          >
            📂 加载当日缓存
          </button>

          <!-- 查看详情 -->
          <button
            v-if="day.hasRecord"
            @click="viewDetails"
            class="menu-item view-item"
          >
            👁️ 查看详情
          </button>

          <!-- 导入JSON到此日期 -->
          <button
            @click="importJsonToDate"
            class="menu-item import-item"
          >
            📥 导入JSON到此日期
          </button>

          <!-- 分隔线 -->
          <div v-if="day.hasRecord" class="menu-divider"></div>

          <!-- 清除当日缓存 -->
          <button
            v-if="day.hasRecord"
            @click="clearDayCache"
            class="menu-item danger-item"
          >
            🗑️ 清除当日缓存
          </button>

          <!-- 无记录提示 -->
          <div v-if="!day.hasRecord" class="menu-item disabled-item">
            📭 该日期无保存记录
          </div>
        </div>
      </div>
    </div>

    <!-- 遮罩层 -->
    <div
      v-if="visible"
      class="context-menu-overlay"
      @click="closeMenu"
      @contextmenu.prevent="closeMenu"
    ></div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CalendarDay } from './calendar_types';

interface Props {
  visible: boolean;
  day: CalendarDay | null;
  position: { x: number; y: number };
}

interface Emits {
  (e: 'close'): void;
  (e: 'loadDayCache', date: string): void;
  (e: 'clearDayCache', date: string): void;
  (e: 'viewDetails', date: string, modelTitles: string[]): void;
  (e: 'importJsonToDate', date: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 计算菜单位置
const menuStyle = computed(() => {
  const MENU_WIDTH = 200;
  const MENU_HEIGHT = 150;
  
  let x = props.position.x;
  let y = props.position.y;
  
  // 防止菜单超出屏幕右边
  if (x + MENU_WIDTH > window.innerWidth) {
    x = props.position.x - MENU_WIDTH;
  }
  
  // 防止菜单超出屏幕下方
  if (y + MENU_HEIGHT > window.innerHeight) {
    y = props.position.y - MENU_HEIGHT;
  }
  
  // 防止菜单超出屏幕左边和上方
  x = Math.max(10, x);
  y = Math.max(10, y);
  
  return {
    position: 'fixed' as const,
    left: `${x}px`,
    top: `${y}px`,
    zIndex: 10000
  };
});

// 格式化日期
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    weekday: 'short'
  });
};

// 菜单操作
const loadDayCache = () => {
  if (props.day) {
    emit('loadDayCache', props.day.date);
    closeMenu();
  }
};

const clearDayCache = () => {
  if (props.day && confirm(`确定要清除 ${formatDate(props.day.date)} 的保存记录吗？\n\n这将删除该日期的所有模型保存记录，但不会删除实际的模型数据。`)) {
    emit('clearDayCache', props.day.date);
    closeMenu();
  }
};

const viewDetails = () => {
  if (props.day) {
    emit('viewDetails', props.day.date, props.day.modelTitles);
    closeMenu();
  }
};

const importJsonToDate = () => {
  if (props.day) {
    emit('importJsonToDate', props.day.date);
    closeMenu();
  }
};

const closeMenu = () => {
  emit('close');
};
</script>

<style scoped>
.context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: transparent;
}

.context-menu {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  min-width: 200px;
  overflow: hidden;
  user-select: none;
  animation: contextMenuAppear 0.15s ease-out;
}

.dark .context-menu {
  background: #1f2937;
  border-color: #374151;
  color: #f9fafb;
}

@keyframes contextMenuAppear {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-5px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.context-menu-content {
  padding: 8px 0;
}

.menu-header {
  padding: 8px 16px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 4px;
}

.dark .menu-header {
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

.model-count {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 2px;
}

.dark .model-count {
  color: #9ca3af;
}

.menu-items {
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  font-size: 0.875rem;
  border: none;
  background: none;
  cursor: pointer;
  transition: background-color 0.15s ease;
  text-align: left;
  width: 100%;
}

.menu-item:hover:not(.disabled-item) {
  background-color: #f3f4f6;
}

.dark .menu-item:hover:not(.disabled-item) {
  background-color: #374151;
}

.load-item {
  color: #059669;
}

.dark .load-item {
  color: #10b981;
}

.view-item {
  color: #0ea5e9;
}

.dark .view-item {
  color: #38bdf8;
}

.import-item {
  color: #7c3aed;
}

.dark .import-item {
  color: #a78bfa;
}

.danger-item {
  color: #dc2626;
}

.dark .danger-item {
  color: #f87171;
}

.danger-item:hover {
  background-color: #fef2f2 !important;
}

.dark .danger-item:hover {
  background-color: #7f1d1d !important;
}

.disabled-item {
  color: #9ca3af;
  cursor: not-allowed;
  font-style: italic;
}

.dark .disabled-item {
  color: #6b7280;
}

.menu-divider {
  height: 1px;
  background-color: #e5e7eb;
  margin: 4px 0;
}

.dark .menu-divider {
  background-color: #374151;
}
</style>
