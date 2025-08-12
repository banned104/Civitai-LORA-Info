<template>
  <div class="image-upload-area">
    <!-- 拖拽区域 -->
    <div 
      class="drop-zone"
      :class="{ 
        'drag-over': isDragOver,
        'has-images': images.length > 0 
      }"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
    >
      <!-- 上传提示 -->
      <div v-if="images.length === 0" class="upload-hint">
        <div class="upload-icon">📸</div>
        <div class="upload-text">
          <p>拖拽图片到这里，或者</p>
          <button @click="triggerFileInput" class="upload-btn">选择文件</button>
        </div>
        <div class="upload-tips">
          <p>支持格式: JPG, PNG, GIF, WebP</p>
          <p>最大大小: 10MB</p>
          <p>也可以使用 Ctrl+V 粘贴剪贴板图片</p>
        </div>
      </div>

      <!-- 图片预览区域 -->
      <div v-if="images.length > 0" class="image-preview-area">
        <div class="image-grid">
          <div 
            v-for="image in images" 
            :key="image.id"
            class="image-item"
          >
            <div class="image-container">
              <img 
                :src="getImageDisplayUrl(image)" 
                :alt="image.name"
                class="preview-image"
                @load="handleImageLoad"
                @error="handleImageError"
              />
              <div class="image-overlay">
                <button 
                  @click="removeImage(image.id)"
                  class="remove-btn"
                  title="删除图片"
                >
                  ✕
                </button>
              </div>
            </div>
            <div class="image-info">
              <div class="image-name" :title="image.name">{{ truncateName(image.name) }}</div>
              <div class="image-size">{{ formatFileSize(image.size) }}</div>
            </div>
          </div>
        </div>

        <!-- 添加更多图片按钮 -->
        <div class="add-more-container">
          <button @click="triggerFileInput" class="add-more-btn">
            ➕ 添加更多图片
          </button>
        </div>
      </div>
    </div>

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInput"
      type="file"
      multiple
      accept="image/*"
      style="display: none"
      @change="handleFileInput"
    />

    <!-- 错误提示 -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <!-- 加载提示 -->
    <div v-if="isLoading" class="loading-message">
      正在处理图片...
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { PromptImage } from './prompt_types'
import { ImageManager } from './image_manager'

// Props
interface Props {
  modelValue: PromptImage[]
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [images: PromptImage[]]
  'error': [error: string]
  'image-added': [image: PromptImage]
  'image-removed': [imageId: string]
}>()

// 响应式数据
const images = ref<PromptImage[]>([...props.modelValue])
const isDragOver = ref(false)
const error = ref<string>('')
const isLoading = ref(false)
const fileInput = ref<HTMLInputElement>()

// 监听数据变化
const updateImages = (newImages: PromptImage[]) => {
  images.value = newImages
  emit('update:modelValue', newImages)
}

// 拖拽处理
const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
}

const handleDragEnter = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  isDragOver.value = true
}

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  // 检查是否真的离开了拖拽区域
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = e.clientX
  const y = e.clientY
  
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    isDragOver.value = false
  }
}

const handleDrop = async (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  isDragOver.value = false

  if (props.disabled) return

  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    await processFiles(files)
  }
}

// 文件输入处理
const triggerFileInput = () => {
  if (!props.disabled) {
    fileInput.value?.click()
  }
}

const handleFileInput = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    await processFiles(files)
  }
  // 清空input值，允许重复选择同一文件
  target.value = ''
}

// 处理文件
const processFiles = async (files: FileList) => {
  error.value = ''
  isLoading.value = true

  try {
    const newImages = await ImageManager.handleDroppedFiles(files)
    const updatedImages = [...images.value, ...newImages]
    updateImages(updatedImages)
    
    // 触发事件
    newImages.forEach(image => {
      emit('image-added', image)
    })

    console.log(`成功添加 ${newImages.length} 张图片`)
  } catch (err: any) {
    error.value = err.message || '图片处理失败'
    emit('error', error.value)
  } finally {
    isLoading.value = false
  }
}

// 剪贴板处理
const handlePaste = async (e: ClipboardEvent) => {
  if (props.disabled || !e.clipboardData) return

  error.value = ''
  isLoading.value = true

  try {
    const image = await ImageManager.createImageFromClipboard()
    if (image) {
      const updatedImages = [...images.value, image]
      updateImages(updatedImages)
      emit('image-added', image)
      console.log('从剪贴板添加图片成功')
    } else {
      error.value = '剪贴板中没有图片数据'
    }
  } catch (err: any) {
    error.value = err.message || '从剪贴板读取图片失败'
    emit('error', error.value)
  } finally {
    isLoading.value = false
  }
}

// 移除图片
const removeImage = async (imageId: string) => {
  const imageToRemove = images.value.find(img => img.id === imageId)
  if (imageToRemove) {
    // 删除本地文件（如果有）
    await ImageManager.deleteLocalImage(imageToRemove.localPath)
    
    const updatedImages = images.value.filter(img => img.id !== imageId)
    updateImages(updatedImages)
    emit('image-removed', imageId)
  }
}

// 工具函数
const getImageDisplayUrl = (image: PromptImage): string => {
  return ImageManager.getImageDisplayUrl(image)
}

const truncateName = (name: string, maxLength: number = 20): string => {
  if (name.length <= maxLength) return name
  const ext = name.split('.').pop()
  const nameWithoutExt = name.substring(0, name.lastIndexOf('.'))
  const truncated = nameWithoutExt.substring(0, maxLength - ext!.length - 4) + '...'
  return `${truncated}.${ext}`
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const handleImageLoad = () => {
  // 图片加载成功
}

const handleImageError = (e: Event) => {
  console.error('图片加载失败:', e)
}

// 生命周期
onMounted(() => {
  // 监听全局粘贴事件
  document.addEventListener('paste', handlePaste)
})

onUnmounted(() => {
  // 清理事件监听
  document.removeEventListener('paste', handlePaste)
})

// 监听props变化
const updateFromProps = () => {
  if (JSON.stringify(images.value) !== JSON.stringify(props.modelValue)) {
    images.value = [...props.modelValue]
  }
}

// 暴露方法给父组件
defineExpose({
  clearImages: () => updateImages([]),
  addImageFromUrl: async (url: string) => {
    // 可以添加从URL加载图片的功能
  }
})
</script>

<style scoped>
.image-upload-area {
  width: 100%;
}

.drop-zone {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
  background-color: #f9fafb;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
}

.drop-zone.drag-over {
  border-color: #3b82f6;
  background-color: #eff6ff;
  transform: scale(1.02);
}

.drop-zone.has-images {
  min-height: auto;
  padding: 1.5rem;
}

.upload-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.upload-icon {
  font-size: 3rem;
  opacity: 0.6;
}

.upload-text p {
  margin: 0 0 0.5rem 0;
  color: #6b7280;
  font-size: 1.1rem;
}

.upload-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}

.upload-btn:hover {
  background: #2563eb;
}

.upload-tips {
  margin-top: 1rem;
  color: #9ca3af;
  font-size: 0.875rem;
}

.upload-tips p {
  margin: 0.25rem 0;
}

.image-preview-area {
  width: 100%;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.image-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.image-container {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e5e7eb;
  transition: border-color 0.2s;
}

.image-container:hover {
  border-color: #3b82f6;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-container:hover .image-overlay {
  opacity: 1;
}

.remove-btn {
  background: #ef4444;
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.remove-btn:hover {
  background: #dc2626;
}

.image-info {
  margin-top: 0.5rem;
  text-align: center;
  width: 100%;
}

.image-name {
  font-size: 0.875rem;
  color: #374151;
  margin-bottom: 0.25rem;
  word-break: break-all;
}

.image-size {
  font-size: 0.75rem;
  color: #9ca3af;
}

.add-more-container {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.add-more-btn {
  background: #f3f4f6;
  color: #374151;
  border: 2px dashed #d1d5db;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.add-more-btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.875rem;
}

.loading-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  color: #1d4ed8;
  font-size: 0.875rem;
  text-align: center;
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  .drop-zone {
    background-color: #1f2937;
    border-color: #4b5563;
  }
  
  .drop-zone.drag-over {
    background-color: #1e3a8a;
    border-color: #3b82f6;
  }
  
  .upload-text p {
    color: #d1d5db;
  }
  
  .upload-tips {
    color: #9ca3af;
  }
  
  .image-container {
    border-color: #4b5563;
  }
  
  .image-name {
    color: #e5e7eb;
  }
  
  .add-more-btn {
    background: #374151;
    color: #e5e7eb;
    border-color: #4b5563;
  }
  
  .add-more-btn:hover {
    background: #4b5563;
  }
}
</style>
