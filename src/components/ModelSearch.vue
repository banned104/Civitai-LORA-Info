<template>
  <div class="model-search">
    <!-- 简单搜索 -->
    <div class="search-container">
      <div class="search-input-wrapper">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('searchPlaceholder')"
          class="search-input"
          @input="onSearchInput"
          @keyup.enter="performSearch"
          @focus="showSuggestions = true"
        />
        <button
          v-if="searchQuery"
          @click="clearSearch"
          class="clear-button"
          :title="t('clearSearch')"
        >
          ✕
        </button>
        <button
          @click="performSearch"
          class="search-button"
          :disabled="isSearching"
          :title="t('search')"
        >
          <span v-if="isSearching" class="search-spinner">⏳</span>
          <span v-else>🔍</span>
        </button>
      </div>

      <!-- 搜索建议 -->
      <div
        v-if="showSuggestions && suggestions.length > 0"
        class="suggestions-dropdown"
      >
        <div
          v-for="suggestion in suggestions"
          :key="suggestion"
          class="suggestion-item"
          @click="selectSuggestion(suggestion)"
        >
          {{ suggestion }}
        </div>
      </div>
    </div>

    <!-- 高级搜索选项 -->
    <div class="advanced-search" v-if="showAdvanced">
      <div class="advanced-row">
        <div class="field-group">
          <label>{{ t('modelName') }}:</label>
          <input
            v-model="advancedOptions.name"
            type="text"
            :placeholder="t('modelName')"
            class="advanced-input"
          />
        </div>
        <div class="field-group">
          <label>{{ t('creator') }}:</label>
          <input
            v-model="advancedOptions.creatorUsername"
            type="text"
            :placeholder="t('creator')"
            class="advanced-input"
          />
        </div>
        <div class="field-group">
          <label>{{ t('userNote') }}:</label>
          <input
            v-model="advancedOptions.note"
            type="text"
            :placeholder="t('searchNote')"
            class="advanced-input"
          />
        </div>
      </div>

      <div class="advanced-row">
        <div class="field-group">
          <label>{{ t('positivePrompt') }}:</label>
          <input
            v-model="advancedOptions.prompt"
            type="text"
            :placeholder="t('searchPositivePrompt')"
            class="advanced-input"
          />
        </div>
        <div class="field-group">
          <label>{{ t('negativePrompt') }}:</label>
          <input
            v-model="advancedOptions.negativePrompt"
            type="text"
            :placeholder="t('searchNegativePrompt')"
            class="advanced-input"
          />
        </div>
      </div>

      <div class="advanced-row">
        <div class="field-group full-width">
          <label>{{ t('trainedWords') }} ({{ t('commaSeparated') }}):</label>
          <input
            v-model="trainedWordsInput"
            type="text"
            :placeholder="t('trainedWordsExample')"
            class="advanced-input"
          />
        </div>
      </div>

      <div class="advanced-row">
        <div class="field-group full-width">
          <label>{{ t('modelTags') }} ({{ t('commaSeparated') }}):</label>
          <input
            v-model="tagsInput"
            type="text"
            :placeholder="t('tagsExample')"
            class="advanced-input"
          />
        </div>
      </div>

      <div class="advanced-actions">
        <button @click="performAdvancedSearch" class="advanced-search-button">
          🔍 {{ t('advancedSearch') }}
        </button>
        <button @click="clearAdvancedSearch" class="clear-advanced-button">
          🗑️ {{ t('clear') }}
        </button>
      </div>
    </div>

    <!-- 搜索控制 -->
    <div class="search-controls">
      <div class="control-left">
        <button
          @click="toggleAdvanced"
          class="toggle-advanced-button"
          :class="{ active: showAdvanced }"
        >
          {{ showAdvanced ? t('hideAdvancedSearch') : t('showAdvancedSearch') }}
        </button>
        
        <!-- 实时搜索提示 -->
        <div v-if="isSearching" class="search-status">
          ⏳ {{ t('searching') }}...
        </div>
      </div>
      
      <div class="search-stats" v-if="hasSearched">
        {{ t('found') }} {{ searchResults.length }} {{ t('models') }}
        <div class="search-actions">
          <button v-if="hasActiveSearch" @click="showAllAndClearSearch" class="show-all-button">
            {{ t('showAll') }}
          </button>
          <button v-if="isSearchActive" @click="clearCurrentFilter" class="clear-filter-button">
            🗑️ {{ t('clearFilter') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { CacheManager } from './cache_manager';
import type { LoraModel } from './lora_api_types';
import { useI18n } from '../i18n';

const { t } = useI18n();

// Props - 移除allModels依赖，改为直接从缓存获取数据
interface Props {
  allModels?: LoraModel[]; // 保持兼容性，但不再使用
}

const props = defineProps<Props>();

// Emits
interface Emits {
  searchResults: [models: LoraModel[]];
  clearSearch: [];
}

const emit = defineEmits<Emits>();

// 搜索状态
const searchQuery = ref('');
const showAdvanced = ref(false);
const showSuggestions = ref(false);
const suggestions = ref<string[]>([]);
const hasSearched = ref(false);
const searchResults = ref<LoraModel[]>([]);
const isSearchActive = ref(false);
const isSearching = ref(false); // 新增：搜索进行中状态

// 高级搜索选项
const advancedOptions = ref({
  name: '',
  description: '',
  note: '',
  prompt: '',
  negativePrompt: '',
  creatorUsername: ''
});

const trainedWordsInput = ref('');
const tagsInput = ref('');

// 计算属性
const hasActiveSearch = computed(() => {
  return searchQuery.value.trim() !== '' || 
         Object.values(advancedOptions.value).some(val => val.trim() !== '') ||
         trainedWordsInput.value.trim() !== '' ||
         tagsInput.value.trim() !== '';
});

// 监听搜索输入
let searchTimeout: ReturnType<typeof setTimeout> | null = null;
let lastSearchQuery = ref(''); // 记录上次搜索的关键词

function onSearchInput() {
  // 防抖搜索建议和实时搜索
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  
  // 设置搜索中状态（仅在实际搜索时显示）
  const currentQuery = searchQuery.value.trim();
  
  searchTimeout = setTimeout(() => {
    // 更新搜索建议
    updateSuggestions();
    
    // 只在搜索词真正改变时才执行搜索
    const lastQuery = lastSearchQuery.value.trim();
    
    if (currentQuery !== lastQuery) {
      console.log(`搜索词发生变化: "${lastQuery}" -> "${currentQuery}"`);
      
      // 如果有搜索内容且达到最小长度，自动执行搜索
      if (currentQuery.length >= 2) {
        isSearching.value = true; // 设置搜索中状态
        performSearch();
      } else if (currentQuery.length === 0 && lastQuery.length > 0) {
        // 如果搜索框被完全清空，清除搜索状态但保持搜索框为空
        clearSearchStateButKeepQuery();
      }
      
      // 更新上次搜索的关键词
      lastSearchQuery.value = currentQuery;
    }
    
    // 重置搜索中状态
    isSearching.value = false;
  }, 400); // 增加延迟，减少频繁搜索
}

// 更新搜索建议
function updateSuggestions() {
  if (searchQuery.value.trim().length >= 2) {
    // 基于所有历史数据生成搜索建议
    suggestions.value = CacheManager.getSearchSuggestions(searchQuery.value, 8);
  } else {
    suggestions.value = [];
  }
}

// 选择建议
function selectSuggestion(suggestion: string) {
  console.log(`选择搜索建议: "${suggestion}"`);
  
  // 先更新上次搜索记录，避免触发重复搜索
  lastSearchQuery.value = suggestion;
  // 再设置搜索框内容
  searchQuery.value = suggestion;
  
  showSuggestions.value = false;
  performSearch();
}

// 执行简单搜索
function performSearch() {
  // 关闭建议下拉框，保持搜索框内容不变
  showSuggestions.value = false;
  
  const currentQuery = searchQuery.value.trim();
  
  if (currentQuery === '') {
    clearSearchStateButKeepQuery();
    return;
  }

  // 搜索所有历史数据，不再依赖props.allModels
  const results = CacheManager.searchModels(currentQuery);
  searchResults.value = results;
  hasSearched.value = true;
  isSearchActive.value = true;
  
  console.log(`执行搜索: 关键词 "${currentQuery}", 找到 ${results.length} 个结果`);
  console.log(`搜索框内容保持: "${searchQuery.value}"`);
  emit('searchResults', results);
}

// 清除搜索状态但保持搜索框内容（内部使用）
function clearSearchStateButKeepQuery() {
  console.log('清除搜索状态但保持搜索框内容');
  searchResults.value = [];
  hasSearched.value = false;
  isSearchActive.value = false;
  showSuggestions.value = false;
  // 不通知父组件，也不清空搜索框
}

// 执行高级搜索
function performAdvancedSearch() {
  // 关闭建议下拉框，保持搜索框内容不变
  showSuggestions.value = false;
  
  const options: any = { ...advancedOptions.value };
  
  // 处理训练词
  if (trainedWordsInput.value.trim()) {
    options.trainedWords = trainedWordsInput.value
      .split(',')
      .map(word => word.trim())
      .filter(word => word !== '');
  }
  
  // 处理标签
  if (tagsInput.value.trim()) {
    options.tags = tagsInput.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');
  }
  
  // 如果所有条件都为空，清除搜索状态但保持搜索框内容
  const hasAnyCondition = Object.values(options).some(val => {
    if (Array.isArray(val)) {
      return val.length > 0;
    }
    return val && val.toString().trim() !== '';
  });
  
  if (!hasAnyCondition) {
    clearSearchStateButKeepQuery();
    return;
  }

  // 搜索所有历史数据
  const results = CacheManager.advancedSearchModels(options);
  searchResults.value = results;
  hasSearched.value = true;
  isSearchActive.value = true;
  
  console.log(`高级搜索: 找到 ${results.length} 个结果`, options);
  console.log(`搜索框内容保持: "${searchQuery.value}"`);
  emit('searchResults', results);
}

// 清除搜索（用户主动点击清除按钮）
function clearSearch() {
  console.log('用户主动清除搜索框内容');
  
  // 清空所有搜索条件
  searchQuery.value = '';
  lastSearchQuery.value = '';
  showSuggestions.value = false;
  advancedOptions.value = {
    name: '',
    description: '',
    note: '',
    prompt: '',
    negativePrompt: '',
    creatorUsername: ''
  };
  trainedWordsInput.value = '';
  tagsInput.value = '';
  
  // 清空搜索状态
  isSearchActive.value = false;
  searchResults.value = [];
  hasSearched.value = false;
  
  // 用户主动清除时通知父组件
  emit('clearSearch');
}

// 程序性地显示所有模型（不通知父组件）
function showAllModelsInternal() {
  console.log('程序性显示全部模型，不通知父组件');
  searchResults.value = [];
  hasSearched.value = false;
  isSearchActive.value = false;
}

// 显示全部并清除搜索（用户点击"显示全部"按钮）
function showAllAndClearSearch() {
  console.log('用户点击显示全部，清除搜索状态');
  
  // 清空所有搜索条件
  searchQuery.value = '';
  lastSearchQuery.value = '';
  showSuggestions.value = false;
  advancedOptions.value = {
    name: '',
    description: '',
    note: '',
    prompt: '',
    negativePrompt: '',
    creatorUsername: ''
  };
  trainedWordsInput.value = '';
  tagsInput.value = '';
  
  // 清空搜索状态
  searchResults.value = [];
  hasSearched.value = false;
  isSearchActive.value = false;
  
  // 通知父组件清除搜索并返回主列表
  emit('clearSearch');
}

// 清除高级搜索（保持主搜索框内容）
function clearAdvancedSearch() {
  console.log('清除高级搜索条件，保持主搜索框内容');
  advancedOptions.value = {
    name: '',
    description: '',
    note: '',
    prompt: '',
    negativePrompt: '',
    creatorUsername: ''
  };
  trainedWordsInput.value = '';
  tagsInput.value = '';
  
  // 如果主搜索框有内容，重新执行基础搜索
  if (searchQuery.value.trim()) {
    performSearch();
  } else {
    clearSearchStateButKeepQuery();
  }
}

// 清空当前筛选结果（保持搜索框内容）
function clearCurrentFilter() {
  console.log('清空当前筛选结果');
  
  // 清空所有搜索条件
  searchQuery.value = '';
  lastSearchQuery.value = '';
  advancedOptions.value = {
    name: '',
    description: '',
    note: '',
    prompt: '',
    negativePrompt: '',
    creatorUsername: ''
  };
  trainedWordsInput.value = '';
  tagsInput.value = '';
  
  // 清空搜索状态
  searchResults.value = [];
  hasSearched.value = false;
  isSearchActive.value = false;
  showSuggestions.value = false;
  
  // 通知父组件清除搜索
  emit('clearSearch');
}

// 切换高级搜索
function toggleAdvanced() {
  showAdvanced.value = !showAdvanced.value;
  if (!showAdvanced.value) {
    clearAdvancedSearch();
  }
}

// 点击外部隐藏建议
function handleClickOutside(event: Event) {
  const target = event.target as HTMLElement;
  if (!target.closest('.search-container')) {
    showSuggestions.value = false;
  }
}

// 监听全局点击
watch(showSuggestions, (show) => {
  if (show) {
    document.addEventListener('click', handleClickOutside);
  } else {
    document.removeEventListener('click', handleClickOutside);
  }
});

// 监听搜索查询变化，当清空搜索词时自动清空结果
watch(searchQuery, (newQuery, oldQuery) => {
  // 如果搜索词被清空（从有内容变为空）
  if (oldQuery && oldQuery.trim() !== '' && (!newQuery || newQuery.trim() === '')) {
    console.log('搜索框被清空，检查是否需要清除搜索状态');
    
    // 检查是否还有其他搜索条件
    const hasOtherConditions = Object.values(advancedOptions.value).some(val => val.trim() !== '') ||
                              trainedWordsInput.value.trim() !== '' ||
                              tagsInput.value.trim() !== '';
    
    // 如果没有其他搜索条件，通知父组件清除搜索
    if (!hasOtherConditions) {
      console.log('没有其他搜索条件，清除搜索状态并恢复默认显示');
      searchResults.value = [];
      hasSearched.value = false;
      isSearchActive.value = false;
      showSuggestions.value = false;
      lastSearchQuery.value = '';
      
      // 通知父组件清除搜索
      emit('clearSearch');
    } else {
      console.log('还有其他搜索条件，保持搜索状态');
    }
  }
});

// 监听高级搜索选项变化，实现实时响应
watch([advancedOptions, trainedWordsInput, tagsInput], () => {
  // 如果所有搜索条件都为空，自动清空结果但保持搜索框内容
  const hasAnyCondition = searchQuery.value.trim() !== '' ||
                         Object.values(advancedOptions.value).some(val => val.trim() !== '') ||
                         trainedWordsInput.value.trim() !== '' ||
                         tagsInput.value.trim() !== '';
  
  if (!hasAnyCondition && (hasSearched.value || isSearchActive.value)) {
    clearSearchStateButKeepQuery();
  }
}, { deep: true });
</script>

<style scoped>
.model-search {
  margin-bottom: 1.5rem;
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.search-container {
  position: relative;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  position: relative;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.search-input-wrapper:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  font-size: 1rem;
  outline: none;
}

.clear-button,
.search-button {
  padding: 0.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1rem;
  color: #64748b;
  transition: color 0.2s ease;
}

.clear-button:hover,
.search-button:hover {
  color: #3b82f6;
}

.search-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.search-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  margin-top: 4px;
}

.suggestion-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid #f1f5f9;
  transition: background-color 0.2s ease;
}

.suggestion-item:hover {
  background-color: #f8fafc;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.advanced-search {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.advanced-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.advanced-row:last-child {
  margin-bottom: 0;
}

.field-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.field-group.full-width {
  flex-basis: 100%;
}

.field-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.25rem;
}

.advanced-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: border-color 0.2s ease;
}

.advanced-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.advanced-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.advanced-search-button,
.clear-advanced-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.advanced-search-button {
  background: #3b82f6;
  color: white;
}

.advanced-search-button:hover {
  background: #2563eb;
}

.clear-advanced-button {
  background: #f3f4f6;
  color: #6b7280;
}

.clear-advanced-button:hover {
  background: #e5e7eb;
}

.search-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.control-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.search-status {
  font-size: 0.875rem;
  color: #3b82f6;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.toggle-advanced-button {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-advanced-button:hover,
.toggle-advanced-button.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.search-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.search-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.show-all-button,
.clear-filter-button {
  padding: 0.25rem 0.5rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.show-all-button:hover {
  background: #f3f4f6;
}

.clear-filter-button {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #dc2626;
}

.clear-filter-button:hover {
  background: #fee2e2;
  border-color: #f87171;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .advanced-row {
    flex-direction: column;
    gap: 0.5rem;
  }

  .search-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .control-left {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .search-stats {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.75rem;
  }

  .search-actions {
    justify-content: center;
  }
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  .model-search {
    background: #1f2937;
    border-color: #374151;
    color: white;
  }

  .search-input-wrapper {
    background: #374151;
    border-color: #4b5563;
  }

  .search-input-wrapper:focus-within {
    border-color: #60a5fa;
  }

  .search-input {
    color: white;
  }

  .search-input::placeholder {
    color: #9ca3af;
  }

  .suggestions-dropdown {
    background: #374151;
    border-color: #4b5563;
  }

  .suggestion-item:hover {
    background-color: #4b5563;
  }

  .advanced-search {
    background: #374151;
    border-color: #4b5563;
  }

  .advanced-input {
    background: #4b5563;
    border-color: #6b7280;
    color: white;
  }

  .advanced-input::placeholder {
    color: #9ca3af;
  }

  .advanced-input:focus {
    border-color: #60a5fa;
  }

  .field-group label {
    color: #d1d5db;
  }

  .clear-advanced-button {
    background: #4b5563;
    color: #d1d5db;
  }

  .clear-advanced-button:hover {
    background: #6b7280;
  }

  .toggle-advanced-button {
    background: #374151;
    border-color: #4b5563;
    color: white;
  }

  .show-all-button,
  .clear-filter-button {
    background: #374151;
    border-color: #4b5563;
    color: white;
  }

  .show-all-button:hover {
    background: #4b5563;
  }

  .clear-filter-button {
    background: #7f1d1d;
    border-color: #991b1b;
    color: #fca5a5;
  }

  .clear-filter-button:hover {
    background: #991b1b;
    border-color: #b91c1c;
  }
}
</style>
