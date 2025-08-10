<template>
  <div class="search-shortcuts">
    <h3 class="shortcuts-title">🔍 {{ t('quickSearch') }}</h3>
    
    <div class="shortcuts-grid">
      <!-- 按训练词搜索 -->
      <div class="shortcut-section">
        <h4 class="section-title">🏷️ {{ t('popularTrainedWords') }}</h4>
        <div class="tags-container">
          <button
            v-for="word in popularTrainedWords"
            :key="word"
            @click="searchByTrainedWord(word)"
            class="tag-button"
          >
            {{ word }}
          </button>
        </div>
      </div>

      <!-- 按标签搜索 -->
      <div class="shortcut-section">
        <h4 class="section-title">🏷️ {{ t('popularTags') }}</h4>
        <div class="tags-container">
          <button
            v-for="tag in popularTags"
            :key="tag"
            @click="searchByTag(tag)"
            class="tag-button"
          >
            {{ tag }}
          </button>
        </div>
      </div>

      <!-- 快速过滤 -->
      <div class="shortcut-section">
        <h4 class="section-title">⚡ {{ t('quickFilters') }}</h4>
        <div class="filter-buttons">
          <button @click="filterByRecentlyAdded" class="filter-button">
            📅 {{ t('recentlyAdded') }}
          </button>
          <button @click="filterByMostImages" class="filter-button">
            🖼️ {{ t('mostImages') }}
          </button>
          <button @click="filterByMostTrainedWords" class="filter-button">
            🏷️ {{ t('mostTrainedWords') }}
          </button>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="shortcut-section">
        <h4 class="section-title">📊 {{ t('statistics') }}</h4>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">{{ totalModels }}</div>
            <div class="stat-label">{{ t('totalModels') }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ totalTrainedWords }}</div>
            <div class="stat-label">{{ t('trainedWordsCount') }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ totalImages }}</div>
            <div class="stat-label">{{ t('totalImagesCount') }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ uniqueCreators }}</div>
            <div class="stat-label">{{ t('creatorsCount') }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
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
  search: [query: string];
  advancedSearch: [options: any];
}

const emit = defineEmits<Emits>();

// 获取所有历史模型数据
const allHistoricalModels = computed(() => {
  return CacheManager.getAllHistoricalModels();
});

// 计算热门训练词（出现频率最高的前10个）
const popularTrainedWords = computed(() => {
  const wordCount = new Map<string, number>();
  
  allHistoricalModels.value.forEach(model => {
    model.modelVersions?.forEach(version => {
      version.trainedWords?.forEach(word => {
        const count = wordCount.get(word) || 0;
        wordCount.set(word, count + 1);
      });
    });
  });

  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
});

// 计算热门标签（出现频率最高的前8个）
const popularTags = computed(() => {
  const tagCount = new Map<string, number>();
  
  allHistoricalModels.value.forEach(model => {
    model.tags?.forEach(tag => {
      const count = tagCount.get(tag) || 0;
      tagCount.set(tag, count + 1);
    });
  });

  return Array.from(tagCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag]) => tag);
});

// 统计信息
const totalModels = computed(() => allHistoricalModels.value.length);

const totalTrainedWords = computed(() => {
  const uniqueWords = new Set<string>();
  allHistoricalModels.value.forEach(model => {
    model.modelVersions?.forEach(version => {
      version.trainedWords?.forEach(word => uniqueWords.add(word));
    });
  });
  return uniqueWords.size;
});

const totalImages = computed(() => {
  return allHistoricalModels.value.reduce((total, model) => {
    return total + (model.modelVersions?.reduce((versionTotal, version) => {
      return versionTotal + (version.images?.length || 0);
    }, 0) || 0);
  }, 0);
});

const uniqueCreators = computed(() => {
  const creators = new Set<string>();
  allHistoricalModels.value.forEach(model => {
    if (model.creator?.username) {
      creators.add(model.creator.username);
    }
  });
  return creators.size;
});

// 搜索方法
function searchByTrainedWord(word: string) {
  emit('search', word);
}

function searchByTag(tag: string) {
  emit('search', tag);
}

function filterByRecentlyAdded() {
  // 按添加时间排序，显示最近添加的
  const sortedModels = [...allHistoricalModels.value].sort((a, b) => {
    const aDate = a.modelVersions?.[0]?.createdAt || '';
    const bDate = b.modelVersions?.[0]?.createdAt || '';
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });
  
  // 发出高级搜索事件，传递排序后的结果
  emit('advancedSearch', { customResults: sortedModels.slice(0, 10) });
}

function filterByMostImages() {
  // 按图片数量排序
  const sortedModels = [...allHistoricalModels.value].sort((a, b) => {
    const aImages = a.modelVersions?.reduce((total: number, version) => total + (version.images?.length || 0), 0) || 0;
    const bImages = b.modelVersions?.reduce((total: number, version) => total + (version.images?.length || 0), 0) || 0;
    return bImages - aImages;
  });
  
  emit('advancedSearch', { customResults: sortedModels.slice(0, 10) });
}

function filterByMostTrainedWords() {
  // 按训练词数量排序
  const sortedModels = [...allHistoricalModels.value].sort((a, b) => {
    const aWords = a.modelVersions?.reduce((total: number, version) => total + (version.trainedWords?.length || 0), 0) || 0;
    const bWords = b.modelVersions?.reduce((total: number, version) => total + (version.trainedWords?.length || 0), 0) || 0;
    return bWords - aWords;
  });
  
  emit('advancedSearch', { customResults: sortedModels.slice(0, 10) });
}
</script>

<style scoped>
.search-shortcuts {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  color: white;
}

.shortcuts-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-align: center;
}

.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.shortcut-section {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1rem;
  backdrop-filter: blur(10px);
}

.section-title {
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
  color: rgba(255, 255, 255, 0.9);
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-button {
  padding: 0.25rem 0.75rem;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  color: white;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tag-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.filter-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-button {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.filter-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateX(4px);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.stat-item {
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.75rem 0.5rem;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fbbf24;
}

.stat-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 0.25rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .shortcuts-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filter-buttons {
    flex-direction: column;
  }
  
  .tags-container {
    justify-content: center;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .search-shortcuts {
    background: linear-gradient(135deg, #1e3a8a 0%, #581c87 100%);
  }
}
</style>
