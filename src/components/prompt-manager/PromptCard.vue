<template>
  <div class="prompt-card">
    <div class="card-header">
      <div class="title-section">
        <h3 v-if="prompt.title" class="prompt-title">
          📝 {{ prompt.title }}
        </h3>
        <h3 v-else class="prompt-title-placeholder">
          📝 {{ t('noTitle') }}
        </h3>
        <div class="timestamp">
          <span class="created-time">
            {{ t('created') }}: {{ formatTime(prompt.createdAt) }}
          </span>
          <span v-if="prompt.updatedAt !== prompt.createdAt" class="updated-time">
            | {{ t('updated') }}: {{ formatTime(prompt.updatedAt) }}
          </span>
        </div>
      </div>
      
      <div class="action-buttons">
        <button
          @click="copyPrompt"
          class="action-btn copy-btn"
          :title="t('copyPrompt')"
        >
          📋
        </button>
        <button
          @click="editPrompt"
          class="action-btn edit-btn"
          :title="t('editPrompt')"
        >
          ✏️
        </button>
        <button
          @click="deletePrompt"
          class="action-btn delete-btn"
          :title="t('deletePrompt')"
        >
          🗑️
        </button>
      </div>
    </div>

    <div class="prompt-content">
      <div class="content-wrapper">
        <pre class="prompt-text">{{ prompt.prompt }}</pre>
      </div>
      
      <!-- 标签显示 -->
      <div class="tags-section" v-if="promptTags.length > 0">
        <div class="tags-container">
          <span
            v-for="tag in promptTags.slice(0, showAllTags ? promptTags.length : 10)"
            :key="tag"
            class="tag"
          >
            {{ tag }}
          </span>
          <button
            v-if="promptTags.length > 10"
            @click="toggleShowAllTags"
            class="show-more-btn"
          >
            {{ showAllTags ? t('showLess') : `+${promptTags.length - 10} ${t('more')}` }}
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑模式 -->
    <div v-if="isEditing" class="edit-mode">
      <div class="edit-form">
        <div class="field-group">
          <label>{{ t('promptTitle') }}:</label>
          <input
            v-model="editTitle"
            type="text"
            :placeholder="t('promptTitlePlaceholder')"
            class="edit-input"
            maxlength="100"
          />
        </div>
        <div class="field-group">
          <label>{{ t('promptContent') }}:</label>
          <textarea
            v-model="editContent"
            rows="6"
            class="edit-textarea"
            maxlength="2000"
          ></textarea>
        </div>
        <div class="edit-actions">
          <button @click="saveEdit" class="save-btn">
            💾 {{ t('save') }}
          </button>
          <button @click="cancelEdit" class="cancel-btn">
            ❌ {{ t('cancel') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { PromptEntry } from './prompt_types';
import { PromptCacheManager } from './prompt_cache_manager';
import { useI18n } from '../../i18n';

const { t } = useI18n();

interface Props {
  prompt: PromptEntry;
  index: number;
}

const props = defineProps<Props>();

interface Emits {
  promptUpdated: [prompt: PromptEntry];
  promptDeleted: [id: string];
}

const emit = defineEmits<Emits>();

// 编辑状态
const isEditing = ref(false);
const editTitle = ref('');
const editContent = ref('');
const showAllTags = ref(false);

// 计算属性
const promptTags = computed(() => {
  // 将Prompt按逗号分割成标签
  return props.prompt.prompt
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
});

// 格式化时间
function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN');
}

// 复制Prompt到剪贴板
async function copyPrompt() {
  try {
    await navigator.clipboard.writeText(props.prompt.prompt);
    // 可以添加一个toast提示
    console.log('Prompt已复制到剪贴板');
  } catch (error) {
    console.error('复制失败:', error);
    // 备用方案：创建临时textarea
    const textarea = document.createElement('textarea');
    textarea.value = props.prompt.prompt;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

// 开始编辑
function editPrompt() {
  editTitle.value = props.prompt.title || '';
  editContent.value = props.prompt.prompt;
  isEditing.value = true;
}

// 保存编辑
function saveEdit() {
  const success = PromptCacheManager.updatePrompt(
    props.prompt.id,
    editTitle.value,
    editContent.value
  );

  if (success) {
    // 更新本地prompt对象
    const updatedPrompt: PromptEntry = {
      ...props.prompt,
      title: editTitle.value.trim() || undefined,
      prompt: editContent.value.trim(),
      updatedAt: Date.now()
    };
    
    emit('promptUpdated', updatedPrompt);
    isEditing.value = false;
  } else {
    alert(t('updatePromptFailed'));
  }
}

// 取消编辑
function cancelEdit() {
  isEditing.value = false;
  editTitle.value = '';
  editContent.value = '';
}

// 删除Prompt
function deletePrompt() {
  if (confirm(t('deletePromptConfirm'))) {
    const success = PromptCacheManager.deletePrompt(props.prompt.id);
    if (success) {
      emit('promptDeleted', props.prompt.id);
    } else {
      alert(t('deletePromptFailed'));
    }
  }
}

// 切换显示所有标签
function toggleShowAllTags() {
  showAllTags.value = !showAllTags.value;
}
</script>

<style scoped>
.prompt-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  margin-bottom: 1rem;
  overflow: hidden;
  transition: all 0.2s ease;
}

.prompt-card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

:global(.dark) .prompt-card {
  background: rgb(17, 24, 39);
  border: 1px solid rgb(55, 65, 81);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgb(229, 231, 235);
}

:global(.dark) .card-header {
  border-bottom-color: rgb(55, 65, 81);
}

.title-section {
  flex: 1;
}

.prompt-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(17, 24, 39);
  margin: 0 0 0.25rem 0;
}

.prompt-title-placeholder {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(156, 163, 175);
  margin: 0 0 0.25rem 0;
  font-style: italic;
}

:global(.dark) .prompt-title {
  color: white;
}

:global(.dark) .prompt-title-placeholder {
  color: rgb(107, 114, 128);
}

.timestamp {
  font-size: 0.75rem;
  color: rgb(107, 114, 128);
}

:global(.dark) .timestamp {
  color: rgb(156, 163, 175);
}

.created-time {
  color: rgb(59, 130, 246);
}

.updated-time {
  color: rgb(16, 185, 129);
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: rgb(249, 250, 251);
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.copy-btn:hover {
  background: rgb(219, 234, 254);
}

.edit-btn:hover {
  background: rgb(254, 243, 199);
}

.delete-btn:hover {
  background: rgb(254, 226, 226);
}

:global(.dark) .action-btn {
  background: rgb(55, 65, 81);
}

.prompt-content {
  padding: 1.5rem;
}

.content-wrapper {
  background: rgb(249, 250, 251);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

:global(.dark) .content-wrapper {
  background: rgb(31, 41, 55);
}

.prompt-text {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  color: rgb(17, 24, 39);
}

:global(.dark) .prompt-text {
  color: rgb(229, 231, 235);
}

.tags-section {
  margin-top: 1rem;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  background: rgb(219, 234, 254);
  color: rgb(30, 64, 175);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid rgb(147, 197, 253);
}

:global(.dark) .tag {
  background: rgb(30, 58, 138);
  color: rgb(191, 219, 254);
  border-color: rgb(59, 130, 246);
}

.show-more-btn {
  background: rgb(229, 231, 235);
  color: rgb(75, 85, 99);
  padding: 0.25rem 0.75rem;
  border: none;
  border-radius: 20px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.show-more-btn:hover {
  background: rgb(209, 213, 219);
}

:global(.dark) .show-more-btn {
  background: rgb(55, 65, 81);
  color: rgb(156, 163, 175);
}

:global(.dark) .show-more-btn:hover {
  background: rgb(75, 85, 99);
}

.edit-mode {
  padding: 1.5rem;
  background: rgb(248, 250, 252);
  border-top: 1px solid rgb(229, 231, 235);
}

:global(.dark) .edit-mode {
  background: rgb(31, 41, 55);
  border-top-color: rgb(55, 65, 81);
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(17, 24, 39);
}

:global(.dark) .field-group label {
  color: white;
}

.edit-input,
.edit-textarea {
  padding: 0.75rem;
  border: 1px solid rgb(209, 213, 219);
  border-radius: 6px;
  font-size: 0.875rem;
}

.edit-textarea {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  resize: vertical;
}

.edit-input:focus,
.edit-textarea:focus {
  outline: none;
  border-color: rgb(59, 130, 246);
  box-shadow: 0 0 0 1px rgb(59, 130, 246);
}

:global(.dark) .edit-input,
:global(.dark) .edit-textarea {
  background: rgb(55, 65, 81);
  border-color: rgb(75, 85, 99);
  color: white;
}

.edit-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.save-btn,
.cancel-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-btn {
  background: rgb(34, 197, 94);
  color: white;
}

.save-btn:hover {
  background: rgb(22, 163, 74);
}

.cancel-btn {
  background: rgb(107, 114, 128);
  color: white;
}

.cancel-btn:hover {
  background: rgb(75, 85, 99);
}

@media (max-width: 640px) {
  .card-header {
    flex-direction: column;
    gap: 1rem;
  }

  .action-buttons {
    align-self: flex-end;
  }

  .edit-actions {
    flex-direction: column;
  }
}
</style>
