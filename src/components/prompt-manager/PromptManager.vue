<template>
  <div class="prompt-manager">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">
        🎨 {{ t('promptManager') }}
      </h1>
      <p class="page-description">
        {{ t('promptManagerDescription') }}
      </p>
    </div>

    <!-- 输入表单 -->
    <div class="input-section">
      <PromptInputForm @prompt-saved="handlePromptSaved" />
    </div>

    <!-- 日历和统计 -->
    <div class="calendar-section">
      <div class="calendar-header">
        <div class="calendar-title">
          <h2 class="section-title">📅 {{ t('calendar') }}</h2>
          <p class="section-description">{{ t('calendarDescription') }}</p>
        </div>
        <div class="calendar-controls">
          <button
            @click="toggleCalendar"
            class="toggle-btn"
            :title="showCalendar ? t('hidePromptCalendar') : t('showPromptCalendar')"
          >
            {{ showCalendar ? '📅 ' + t('hidePromptCalendar') : '📅 ' + t('showPromptCalendar') }}
          </button>
          <button
            @click="toggleDateBlocks"
            class="toggle-btn"
            :title="showDateBlocks ? t('hideDateBlocks') : t('showDateBlocks')"
          >
            {{ showDateBlocks ? '📋 ' + t('hideDateBlocks') : '📋 ' + t('showDateBlocks') }}
          </button>
        </div>
      </div>
      
      <PromptCalendar 
        v-show="showCalendar"
        ref="calendarRef"
        @date-selected="handleDateSelected" 
      />
      
      <!-- 日期块列表 -->
      <div v-show="showDateBlocks" class="date-blocks-section">
        <div class="date-blocks-header">
          <h3 class="date-blocks-title">📋 {{ t('dateBlocks') }}</h3>
          <div class="date-blocks-stats">
            {{ t('totalDatesWithPrompts', { count: datesWithPrompts.length.toString() }) }}
          </div>
        </div>
        
        <div v-if="datesWithPrompts.length === 0" class="empty-date-blocks">
          <p>{{ t('noDateBlocksYet') }}</p>
        </div>
        
        <div v-else class="date-blocks-grid">
          <div
            v-for="dateBlock in datesWithPrompts"
            :key="dateBlock.date"
            class="date-block"
            @click="handleDateBlockClick(dateBlock)"
          >
            <div class="date-block-date">
              {{ formatDateForDisplay(dateBlock.date) }}
            </div>
            <div class="date-block-count">
              {{ dateBlock.promptCount }} {{ t('prompts') }}
            </div>
            <div class="date-block-actions">
              <button
                @click.stop="exportDatePrompts(dateBlock.date)"
                class="export-date-btn"
                :title="t('exportDatePrompts')"
              >
                📤
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索功能 -->
    <div class="search-section" v-if="allPrompts.length > 0">
      <div class="search-container">
        <div class="search-input-wrapper">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('searchPrompts')"
            class="search-input"
            @input="performSearch"
          />
          <button
            v-if="searchQuery"
            @click="clearSearch"
            class="clear-search-btn"
          >
            ✕
          </button>
        </div>
        <div class="search-stats" v-if="isSearchActive">
          {{ t('found') }} {{ filteredPrompts.length }} {{ t('prompts') }}
          <button @click="showAllPrompts" class="show-all-btn">
            {{ t('showAll') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Prompt列表 -->
    <div class="prompts-section">
      <div class="section-header">
        <h2 class="section-title">
          {{ getSectionTitle() }}
        </h2>
        <div class="section-actions" v-if="displayPrompts.length > 0">
          <span class="prompt-count">
            {{ displayPrompts.length }} {{ t('prompts') }}
          </span>
          <button 
            v-if="!isDateView && !isSearchActive"
            @click="clearAllPrompts"
            class="clear-all-btn"
          >
            🗑️ {{ t('clearAll') }}
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="displayPrompts.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <h3 class="empty-title">{{ getEmptyStateTitle() }}</h3>
        <p class="empty-description">{{ getEmptyStateDescription() }}</p>
      </div>

      <!-- Prompt卡片列表 -->
      <div v-else class="prompt-list">
        <PromptCard
          v-for="(prompt, index) in displayPrompts"
          :key="prompt.id"
          :prompt="prompt"
          :index="index"
          @prompt-updated="handlePromptUpdated"
          @prompt-deleted="handlePromptDeleted"
        />
      </div>
    </div>

    <!-- 导出面板 -->
    <div class="export-section">
      <h2 class="section-title">📤 {{ t('export') }}</h2>
      <p class="section-description">{{ t('exportDescription') }}</p>
      
      <div class="export-actions">
        <button 
          @click="exportAllPrompts" 
          class="export-btn export-all-btn"
          :disabled="totalPrompts === 0"
        >
          <span class="export-icon">📦</span>
          <span class="export-label">{{ t('exportAll') }} (JSON)</span>
          <span class="export-count">({{ totalPrompts }} {{ t('prompts') }})</span>
        </button>
        
        <button 
          @click="exportAllPromptsAsZip" 
          class="export-btn export-zip-btn"
          :disabled="totalPrompts === 0"
        >
          <span class="export-icon">🗜️</span>
          <span class="export-label">{{ t('exportAll') }} (ZIP)</span>
          <span class="export-count">({{ totalPrompts }} {{ t('prompts') }})</span>
        </button>
        
        <button 
          @click="exportByDate" 
          class="export-btn export-by-date-btn"
          :disabled="datesWithPrompts.length === 0"
        >
          <span class="export-icon">📅</span>
          <span class="export-label">{{ t('exportByDate') }}</span>
          <span class="export-count">({{ datesWithPrompts.length }} {{ t('dates') }})</span>
        </button>
        
        <label class="import-btn">
          <span class="export-icon">📥</span>
          <span class="export-label">{{ t('importFromZip') }}</span>
          <input
            type="file"
            accept=".zip"
            @change="handleZipImport"
            style="display: none;"
          />
        </label>
      </div>
      
      <div v-if="exportStatus" class="export-status" :class="exportStatus.type">
        {{ exportStatus.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import PromptInputForm from './PromptInputForm.vue';
import PromptCard from './PromptCard.vue';
import PromptCalendar from './PromptCalendar.vue';
import { PromptCacheManager } from './prompt_cache_manager';
import { ZipExportManager } from './zip_export_manager';
import type { PromptEntry } from './prompt_types';
import { useI18n } from '../../i18n';

const { t } = useI18n();

// 组件引用
const calendarRef = ref<InstanceType<typeof PromptCalendar>>();

// 状态管理
const allPrompts = ref<PromptEntry[]>([]);
const filteredPrompts = ref<PromptEntry[]>([]);
const selectedDatePrompts = ref<PromptEntry[]>([]);
const searchQuery = ref('');
const currentViewDate = ref('');

// 显示模式
const isSearchActive = ref(false);
const isDateView = ref(false);
const showCalendar = ref(true);
const showDateBlocks = ref(false);

// 导出状态
const exportStatus = ref<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

// 计算属性
const displayPrompts = computed(() => {
  if (isDateView.value) {
    return selectedDatePrompts.value;
  }
  if (isSearchActive.value) {
    return filteredPrompts.value;
  }
  return allPrompts.value;
});

const totalPrompts = computed(() => allPrompts.value.length);

const datesWithPrompts = computed(() => {
  const dateMap = new Map<string, number>();
  
  allPrompts.value.forEach(prompt => {
    const date = new Date(prompt.createdAt).toISOString().split('T')[0]; // YYYY-MM-DD 格式
    const count = dateMap.get(date) || 0;
    dateMap.set(date, count + 1);
  });
  
  return Array.from(dateMap.entries())
    .map(([date, promptCount]) => ({ date, promptCount }))
    .sort((a, b) => b.date.localeCompare(a.date)); // 按日期倒序排列
});

// 方法
function getSectionTitle(): string {
  if (isDateView.value && currentViewDate.value) {
    const date = new Date(currentViewDate.value + 'T00:00:00');
    const dateStr = date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return `📅 ${dateStr} ${t('promptsOnDate')}`;
  }
  if (isSearchActive.value) {
    return `🔍 ${t('searchResults')}`;
  }
  return `📋 ${t('allPrompts')}`;
}

function getEmptyStateTitle(): string {
  if (isDateView.value) {
    return t('noPromptsOnThisDate');
  }
  if (isSearchActive.value) {
    return t('noSearchResults');
  }
  return t('noPromptsYet');
}

function getEmptyStateDescription(): string {
  if (isDateView.value) {
    return t('noPromptsOnDateDescription');
  }
  if (isSearchActive.value) {
    return t('tryDifferentSearch');
  }
  return t('addFirstPrompt');
}

// 新增的功能方法
function toggleCalendar() {
  showCalendar.value = !showCalendar.value;
}

function toggleDateBlocks() {
  showDateBlocks.value = !showDateBlocks.value;
}

function formatDateForDisplay(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function handleDateBlockClick(dateBlock: { date: string; promptCount: number }) {
  // 点击日期块时跳转到该日期视图
  const promptsForDate = allPrompts.value.filter(prompt => {
    const promptDate = new Date(prompt.createdAt).toISOString().split('T')[0];
    return promptDate === dateBlock.date;
  });
  handleDateSelected(dateBlock.date, promptsForDate);
}

function exportDatePrompts(dateStr: string) {
  try {
    const promptsForDate = allPrompts.value.filter(prompt => {
      const promptDate = new Date(prompt.createdAt).toISOString().split('T')[0];
      return promptDate === dateStr;
    });
    
    if (promptsForDate.length === 0) {
      exportStatus.value = { type: 'error', message: t('noPromptsToExport') };
      return;
    }
    
    const exportData = {
      date: dateStr,
      totalPrompts: promptsForDate.length,
      prompts: promptsForDate.map(prompt => ({
        id: prompt.id,
        title: prompt.title || '',
        prompt: prompt.prompt,
        createdAt: new Date(prompt.createdAt).toISOString(),
        updatedAt: new Date(prompt.updatedAt).toISOString()
      })),
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompts_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    exportStatus.value = { type: 'success', message: t('exportPromptSuccess', { count: promptsForDate.length.toString() }) };
    
    // 3秒后清除状态
    setTimeout(() => {
      exportStatus.value = null;
    }, 3000);
  } catch (error) {
    console.error('导出失败:', error);
    exportStatus.value = { type: 'error', message: t('exportPromptFailed') };
  }
}

function exportAllPrompts() {
  try {
    if (allPrompts.value.length === 0) {
      exportStatus.value = { type: 'error', message: t('noPromptsToExport') };
      return;
    }
    
    const exportData = {
      totalPrompts: allPrompts.value.length,
      totalDates: datesWithPrompts.value.length,
      prompts: allPrompts.value.map(prompt => ({
        id: prompt.id,
        title: prompt.title || '',
        prompt: prompt.prompt,
        createdAt: new Date(prompt.createdAt).toISOString(),
        updatedAt: new Date(prompt.updatedAt).toISOString()
      })),
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_prompts_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    exportStatus.value = { type: 'success', message: t('exportPromptSuccess', { count: allPrompts.value.length.toString() }) };
    
    // 3秒后清除状态
    setTimeout(() => {
      exportStatus.value = null;
    }, 3000);
  } catch (error) {
    console.error('导出失败:', error);
    exportStatus.value = { type: 'error', message: t('exportPromptFailed') };
  }
}

// ZIP导出功能
async function exportAllPromptsAsZip() {
  try {
    if (allPrompts.value.length === 0) {
      exportStatus.value = { type: 'error', message: t('noPromptsToExport') };
      return;
    }
    
    exportStatus.value = { type: 'info', message: '正在准备ZIP文件...' };
    
    const filename = `all_prompts_${new Date().toISOString().split('T')[0]}`;
    await ZipExportManager.exportToZip(allPrompts.value, filename);
    
    exportStatus.value = { type: 'success', message: `成功导出 ${allPrompts.value.length} 个Prompt到ZIP文件` };
    
    // 3秒后清除状态
    setTimeout(() => {
      exportStatus.value = null;
    }, 3000);
  } catch (error) {
    console.error('ZIP导出失败:', error);
    exportStatus.value = { type: 'error', message: '导出ZIP文件失败: ' + (error instanceof Error ? error.message : '未知错误') };
  }
}

// ZIP导入功能
async function handleZipImport(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;
  
  try {
    exportStatus.value = { type: 'info', message: '正在导入ZIP文件...' };
    
    // 验证文件格式
    const isValidZip = await ZipExportManager.validateZipFile(file);
    if (!isValidZip) {
      exportStatus.value = { type: 'error', message: '无效的ZIP文件格式' };
      return;
    }
    
    // 导入数据
    const importedPrompts = await ZipExportManager.importFromZip(file);
    
    if (importedPrompts.length === 0) {
      exportStatus.value = { type: 'error', message: 'ZIP文件中没有找到有效的Prompt数据' };
      return;
    }
    
    // 保存导入的Prompt
    for (const prompt of importedPrompts) {
      PromptCacheManager.addPrompt(prompt.title || '', prompt.prompt, prompt.images);
    }
    
    // 重新加载数据
    loadPrompts();
    
    exportStatus.value = { type: 'success', message: `成功导入 ${importedPrompts.length} 个Prompt` };
    
    // 清空文件输入
    target.value = '';
    
    // 刷新日历
    nextTick(() => {
      calendarRef.value?.refresh();
    });
    
    // 3秒后清除状态
    setTimeout(() => {
      exportStatus.value = null;
    }, 3000);
  } catch (error) {
    console.error('ZIP导入失败:', error);
    exportStatus.value = { type: 'error', message: '导入ZIP文件失败: ' + (error instanceof Error ? error.message : '未知错误') };
    
    // 清空文件输入
    target.value = '';
  }
}

function exportByDate() {
  try {
    if (datesWithPrompts.value.length === 0) {
      exportStatus.value = { type: 'error', message: t('noPromptsToExport') };
      return;
    }
    
    const exportData = {
      totalDates: datesWithPrompts.value.length,
      totalPrompts: allPrompts.value.length,
      dateGroups: datesWithPrompts.value.map(dateBlock => {
        const promptsForDate = allPrompts.value.filter(prompt => {
          const promptDate = new Date(prompt.createdAt).toISOString().split('T')[0];
          return promptDate === dateBlock.date;
        });
        
        return {
          date: dateBlock.date,
          promptCount: dateBlock.promptCount,
          prompts: promptsForDate.map(prompt => ({
            id: prompt.id,
            title: prompt.title || '',
            prompt: prompt.prompt,
            createdAt: new Date(prompt.createdAt).toISOString(),
            updatedAt: new Date(prompt.updatedAt).toISOString()
          }))
        };
      }),
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompts_by_date_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    exportStatus.value = { type: 'success', message: t('exportByDateSuccess', { count: datesWithPrompts.value.length.toString() }) };
    
    // 3秒后清除状态
    setTimeout(() => {
      exportStatus.value = null;
    }, 3000);
  } catch (error) {
    console.error('按日期导出失败:', error);
    exportStatus.value = { type: 'error', message: t('exportPromptFailed') };
  }
}

function loadPrompts() {
  const prompts = PromptCacheManager.loadFromLocalStorage() || [];
  allPrompts.value = prompts;
  console.log(`加载了 ${prompts.length} 个Prompt`);
}

function handlePromptSaved(prompt: PromptEntry) {
  // 重新加载所有Prompt
  loadPrompts();
  
  // 清除搜索和日期视图，显示最新添加的Prompt
  clearAllViews();
  
  // 刷新日历
  nextTick(() => {
    calendarRef.value?.refresh();
  });
  
  console.log('新Prompt已保存:', prompt);
}

function handlePromptUpdated(updatedPrompt: PromptEntry) {
  // 更新对应的Prompt
  const index = allPrompts.value.findIndex(p => p.id === updatedPrompt.id);
  if (index !== -1) {
    allPrompts.value[index] = updatedPrompt;
  }
  
  // 如果在搜索模式，也更新搜索结果
  if (isSearchActive.value) {
    const searchIndex = filteredPrompts.value.findIndex(p => p.id === updatedPrompt.id);
    if (searchIndex !== -1) {
      filteredPrompts.value[searchIndex] = updatedPrompt;
    }
  }
  
  // 如果在日期视图，也更新日期结果
  if (isDateView.value) {
    const dateIndex = selectedDatePrompts.value.findIndex(p => p.id === updatedPrompt.id);
    if (dateIndex !== -1) {
      selectedDatePrompts.value[dateIndex] = updatedPrompt;
    }
  }
  
  console.log('Prompt已更新:', updatedPrompt);
}

function handlePromptDeleted(promptId: string) {
  // 从所有列表中移除
  allPrompts.value = allPrompts.value.filter(p => p.id !== promptId);
  filteredPrompts.value = filteredPrompts.value.filter(p => p.id !== promptId);
  selectedDatePrompts.value = selectedDatePrompts.value.filter(p => p.id !== promptId);
  
  // 刷新日历
  nextTick(() => {
    calendarRef.value?.refresh();
  });
  
  console.log('Prompt已删除:', promptId);
}

function handleDateSelected(date: string, prompts: PromptEntry[]) {
  console.log(`日期选择: ${date}, ${prompts.length} 个Prompt`);
  
  currentViewDate.value = date;
  selectedDatePrompts.value = prompts;
  isDateView.value = true;
  isSearchActive.value = false;
  searchQuery.value = '';
  
  // 更新日历选中状态
  calendarRef.value?.setSelectedDate(date);
}

function performSearch() {
  const query = searchQuery.value.trim();
  
  if (query === '') {
    clearSearch();
    return;
  }
  
  const results = PromptCacheManager.searchPrompts(query);
  filteredPrompts.value = results;
  isSearchActive.value = true;
  isDateView.value = false;
  currentViewDate.value = '';
  
  console.log(`搜索 "${query}" 找到 ${results.length} 个结果`);
}

function clearSearch() {
  searchQuery.value = '';
  filteredPrompts.value = [];
  isSearchActive.value = false;
}

function showAllPrompts() {
  clearAllViews();
}

function clearAllViews() {
  isSearchActive.value = false;
  isDateView.value = false;
  searchQuery.value = '';
  currentViewDate.value = '';
  filteredPrompts.value = [];
  selectedDatePrompts.value = [];
  
  // 清除日历选中状态
  calendarRef.value?.setSelectedDate('');
}

function clearAllPrompts() {
  if (confirm(t('clearAllPromptsConfirm'))) {
    const success = PromptCacheManager.clearLocalStorage();
    if (success) {
      allPrompts.value = [];
      clearAllViews();
      
      // 刷新日历
      nextTick(() => {
        calendarRef.value?.refresh();
      });
      
      console.log('所有Prompt已清除');
    } else {
      alert(t('clearPromptsFailed'));
    }
  }
}

// 生命周期
onMounted(() => {
  loadPrompts();
});
</script>

<style scoped>
.prompt-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: rgb(17, 24, 39);
  margin: 0 0 1rem 0;
}

:global(.dark) .page-title {
  color: white;
}

.page-description {
  font-size: 1.125rem;
  color: rgb(75, 85, 99);
  margin: 0;
}

:global(.dark) .page-description {
  color: rgb(156, 163, 175);
}

.input-section {
  margin-bottom: 3rem;
}

.calendar-section {
  margin-bottom: 3rem;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.calendar-title {
  flex: 1;
}

.calendar-controls {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.toggle-btn {
  background: rgb(59, 130, 246);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.toggle-btn:hover {
  background: rgb(29, 78, 216);
}

:global(.dark) .toggle-btn {
  background: rgb(29, 78, 216);
}

:global(.dark) .toggle-btn:hover {
  background: rgb(59, 130, 246);
}

.date-blocks-section {
  margin-top: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
}

:global(.dark) .date-blocks-section {
  background: rgb(17, 24, 39);
  border: 1px solid rgb(55, 65, 81);
}

.date-blocks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.date-blocks-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: rgb(17, 24, 39);
}

:global(.dark) .date-blocks-title {
  color: white;
}

.date-blocks-stats {
  font-size: 0.875rem;
  color: rgb(75, 85, 99);
}

:global(.dark) .date-blocks-stats {
  color: rgb(156, 163, 175);
}

.empty-date-blocks {
  text-align: center;
  padding: 2rem;
  color: rgb(75, 85, 99);
}

:global(.dark) .empty-date-blocks {
  color: rgb(156, 163, 175);
}

.date-blocks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.date-block {
  background: rgb(248, 250, 252);
  border: 1px solid rgb(226, 232, 240);
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.date-block:hover {
  border-color: rgb(59, 130, 246);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

:global(.dark) .date-block {
  background: rgb(31, 41, 55);
  border-color: rgb(55, 65, 81);
}

:global(.dark) .date-block:hover {
  border-color: rgb(59, 130, 246);
}

.date-block-date {
  font-weight: 600;
  color: rgb(17, 24, 39);
  margin-bottom: 0.5rem;
}

:global(.dark) .date-block-date {
  color: white;
}

.date-block-count {
  font-size: 0.875rem;
  color: rgb(75, 85, 99);
}

:global(.dark) .date-block-count {
  color: rgb(156, 163, 175);
}

.date-block-actions {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  gap: 0.25rem;
}

.export-date-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s;
  font-size: 0.875rem;
}

.export-date-btn:hover {
  background: rgba(59, 130, 246, 0.1);
}

.export-section {
  margin-bottom: 3rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
}

:global(.dark) .export-section {
  background: rgb(17, 24, 39);
  border: 1px solid rgb(55, 65, 81);
}

.export-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgb(16, 185, 129);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  flex: 1;
}

.export-btn:hover:not(:disabled) {
  background: rgb(5, 150, 105);
}

.export-btn:disabled {
  background: rgb(156, 163, 175);
  cursor: not-allowed;
}

.export-all-btn {
  background: rgb(16, 185, 129);
}

.export-all-btn:hover:not(:disabled) {
  background: rgb(5, 150, 105);
}

.export-by-date-btn {
  background: rgb(59, 130, 246);
}

.export-by-date-btn:hover:not(:disabled) {
  background: rgb(29, 78, 216);
}

.export-icon {
  font-size: 1.25rem;
}

.export-label {
  font-weight: 600;
}

.export-count {
  font-size: 0.875rem;
  opacity: 0.8;
}

.export-status {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 500;
}

.export-status.success {
  background: rgb(220, 252, 231);
  color: rgb(5, 150, 105);
  border: 1px solid rgb(167, 243, 208);
}

.export-status.error {
  background: rgb(254, 226, 226);
  color: rgb(220, 38, 38);
  border: 1px solid rgb(252, 165, 165);
}

:global(.dark) .export-status.success {
  background: rgba(5, 150, 105, 0.1);
  color: rgb(34, 197, 94);
  border-color: rgba(34, 197, 94, 0.3);
}

:global(.dark) .export-status.error {
  background: rgba(220, 38, 38, 0.1);
  color: rgb(248, 113, 113);
  border-color: rgba(248, 113, 113, 0.3);
}

.search-section {
  margin-bottom: 2rem;
}

.search-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
}

:global(.dark) .search-container {
  background: rgb(17, 24, 39);
  border: 1px solid rgb(55, 65, 81);
}

.search-input-wrapper {
  position: relative;
  margin-bottom: 1rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  padding-right: 2.5rem;
  border: 1px solid rgb(209, 213, 219);
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: rgb(59, 130, 246);
  box-shadow: 0 0 0 1px rgb(59, 130, 246);
}

:global(.dark) .search-input {
  background: rgb(55, 65, 81);
  border-color: rgb(75, 85, 99);
  color: white;
}

.clear-search-btn {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: rgb(107, 114, 128);
  cursor: pointer;
  font-size: 1rem;
  transition: color 0.2s ease;
}

.clear-search-btn:hover {
  color: rgb(75, 85, 99);
}

.search-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: rgb(75, 85, 99);
  font-size: 0.875rem;
}

:global(.dark) .search-stats {
  color: rgb(156, 163, 175);
}

.show-all-btn {
  background: rgb(59, 130, 246);
  color: white;
  border: none;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.show-all-btn:hover {
  background: rgb(37, 99, 235);
}

.prompts-section {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgb(229, 231, 235);
}

:global(.dark) .section-header {
  border-bottom-color: rgb(55, 65, 81);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: rgb(17, 24, 39);
  margin: 0;
}

:global(.dark) .section-title {
  color: white;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.prompt-count {
  color: rgb(75, 85, 99);
  font-size: 0.875rem;
}

:global(.dark) .prompt-count {
  color: rgb(156, 163, 175);
}

.clear-all-btn {
  background: rgb(239, 68, 68);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.clear-all-btn:hover {
  background: rgb(220, 38, 38);
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

:global(.dark) .empty-state {
  background: rgb(17, 24, 39);
  border: 1px solid rgb(55, 65, 81);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: rgb(17, 24, 39);
  margin: 0 0 0.5rem 0;
}

:global(.dark) .empty-title {
  color: white;
}

.empty-description {
  color: rgb(75, 85, 99);
  margin: 0;
}

:global(.dark) .empty-description {
  color: rgb(156, 163, 175);
}

.prompt-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (max-width: 768px) {
  .prompt-manager {
    padding: 1rem;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .section-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
