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
      
      <!-- 图片显示区域 -->
      <div v-if="prompt.images && prompt.images.length > 0" class="images-section">
        <div class="images-header">
          <span class="images-count">📸 {{ prompt.images.length }} 张图片</span>
        </div>
        <div class="images-grid">
          <div 
            v-for="image in prompt.images" 
            :key="image.id"
            class="image-item"
            @click="openImagePreview(image)"
          >
            <img 
              :src="getImageDisplayUrl(image)" 
              :alt="image.name"
              class="prompt-image"
              @error="handleImageError"
            />
            <div class="image-overlay">
              <span class="image-name">{{ truncateImageName(image.name) }}</span>
              <span class="image-size">{{ formatFileSize(image.size) }}</span>
            </div>
          </div>
        </div>
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
import type { PromptEntry, PromptImage } from './prompt_types';
import { PromptCacheManager } from './prompt_cache_manager';
import { ImageManager } from './image_manager';
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
async function deletePrompt() {
  if (confirm(t('deletePromptConfirm'))) {
    // 先删除关联的图片文件
    if (props.prompt.images && props.prompt.images.length > 0) {
      try {
        await ImageManager.deleteImages(props.prompt.images);
        console.log(`已删除 ${props.prompt.images.length} 张关联图片`);
      } catch (error) {
        console.warn('删除关联图片失败:', error);
      }
    }
    
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

// 图片处理函数
function getImageDisplayUrl(image: PromptImage): string {
  return ImageManager.getImageDisplayUrl(image);
}

function truncateImageName(name: string, maxLength: number = 15): string {
  if (name.length <= maxLength) return name;
  const ext = name.split('.').pop();
  const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
  const truncated = nameWithoutExt.substring(0, maxLength - ext!.length - 4) + '...';
  return `${truncated}.${ext}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function handleImageError(e: Event) {
  console.error('图片加载失败:', e);
  const img = e.target as HTMLImageElement;
  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiA5VjE1IiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CjxwYXRoIGQ9Ik05IDEySDEzIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPgo='; // 默认错误图片
}

function openImagePreview(image: PromptImage) {
  // 创建模态框显示大图
  const modal = document.createElement('div');
  modal.className = 'image-modal';
  modal.innerHTML = `
    <div class="modal-overlay" onclick="this.parentElement.remove()">
      <div class="modal-content" onclick="event.stopPropagation()">
        <img src="${getImageDisplayUrl(image)}" alt="${image.name}" class="modal-image" />
        <div class="modal-info">
          <h3>${image.name}</h3>
          <p>大小: ${formatFileSize(image.size)}</p>
          <p>类型: ${image.type}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="modal-close">✕</button>
      </div>
    </div>
  `;
  
  // 添加样式
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
  `;
  
  document.body.appendChild(modal);
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

/* 图片样式 */
.images-section {
  margin: 1rem 0;
  padding: 1rem;
  background: rgb(249, 250, 251);
  border-radius: 8px;
}

:global(.dark) .images-section {
  background: rgb(31, 41, 55);
}

.images-header {
  margin-bottom: 0.75rem;
}

.images-count {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(75, 85, 99);
}

:global(.dark) .images-count {
  color: rgb(156, 163, 175);
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.image-item:hover {
  transform: scale(1.05);
}

.prompt-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
  padding: 0.5rem 0.25rem 0.25rem;
  font-size: 0.75rem;
  display: flex;
  flex-direction: column;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.image-item:hover .image-overlay {
  opacity: 1;
}

.image-name {
  font-weight: 500;
  margin-bottom: 0.125rem;
}

.image-size {
  font-size: 0.625rem;
  opacity: 0.8;
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

/* 图片模态框样式 */
:global(.image-modal) {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}

:global(.modal-overlay) {
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

:global(.modal-content) {
  position: relative;
  background: white;
  border-radius: 12px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

:global(.dark .modal-content) {
  background: rgb(17, 24, 39);
}

:global(.modal-image) {
  width: 100%;
  height: auto;
  max-height: 70vh;
  object-fit: contain;
  display: block;
}

:global(.modal-info) {
  padding: 1.5rem;
  border-top: 1px solid rgb(229, 231, 235);
}

:global(.dark .modal-info) {
  border-top-color: rgb(55, 65, 81);
}

:global(.modal-info h3) {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(17, 24, 39);
}

:global(.dark .modal-info h3) {
  color: rgb(229, 231, 235);
}

:global(.modal-info p) {
  margin: 0.25rem 0;
  font-size: 0.875rem;
  color: rgb(75, 85, 99);
}

:global(.dark .modal-info p) {
  color: rgb(156, 163, 175);
}

:global(.modal-close) {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

:global(.modal-close:hover) {
  background: rgba(0, 0, 0, 0.7);
}
</style>
