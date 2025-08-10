<template>
  <div class="prompt-input-form">
    <div class="form-container">
      <!-- 标题/注释输入框 -->
      <div class="field-group mb-4">
        <label for="prompt-title" class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          📝 {{ t('promptTitle') }} ({{ t('optional') }})
        </label>
        <input
          id="prompt-title"
          v-model="titleInput"
          type="text"
          :placeholder="t('promptTitlePlaceholder')"
          class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          maxlength="100"
        />
        <div class="text-xs text-gray-500 mt-1">{{ titleInput.length }}/100</div>
      </div>

      <!-- Prompt富文本输入框 -->
      <div class="field-group mb-4">
        <label for="prompt-content" class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          🎨 {{ t('promptContent') }} <span class="text-red-500">*</span>
        </label>
        <textarea
          id="prompt-content"
          v-model="promptInput"
          rows="8"
          :placeholder="t('promptContentPlaceholder')"
          class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm"
          maxlength="2000"
        ></textarea>
        <div class="flex justify-between items-center mt-1">
          <span class="text-xs text-gray-500">{{ promptInput.length }}/2000</span>
          <span class="text-xs text-gray-500">{{ t('promptInputTip') }}</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="button-group flex gap-3">
        <button
          @click="savePrompt"
          :disabled="!canSave || isSaving"
          class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
        >
          <span v-if="isSaving" class="inline-flex items-center gap-2">
            ⏳ {{ t('saving') }}...
          </span>
          <span v-else class="inline-flex items-center gap-2">
            💾 {{ t('savePrompt') }}
          </span>
        </button>
        
        <button
          @click="clearForm"
          :disabled="isSaving"
          class="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-400 transition font-medium"
        >
          🗑️ {{ t('clear') }}
        </button>
      </div>

      <!-- 快速提示 -->
      <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p class="text-sm text-blue-700 dark:text-blue-300">
          💡 <strong>{{ t('tip') }}:</strong> {{ t('promptInputHelpText') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { PromptCacheManager } from './prompt_cache_manager';
import type { PromptEntry } from './prompt_types';
import { useI18n } from '../../i18n';

const { t } = useI18n();

// 表单状态
const titleInput = ref('');
const promptInput = ref('');
const isSaving = ref(false);

// 事件定义
interface Emits {
  promptSaved: [prompt: PromptEntry];
}

const emit = defineEmits<Emits>();

// 计算属性
const canSave = computed(() => {
  return promptInput.value.trim().length > 0 && !isSaving.value;
});

// 保存Prompt
async function savePrompt() {
  if (!canSave.value) return;

  isSaving.value = true;
  
  try {
    const newPrompt = PromptCacheManager.addPrompt(
      titleInput.value,
      promptInput.value
    );

    // 清空表单
    clearForm();
    
    // 通知父组件
    emit('promptSaved', newPrompt);
    
    console.log('Prompt保存成功:', newPrompt);
  } catch (error) {
    console.error('保存Prompt失败:', error);
    alert(t('savePromptFailed'));
  } finally {
    isSaving.value = false;
  }
}

// 清空表单
function clearForm() {
  titleInput.value = '';
  promptInput.value = '';
}

// 快速填充示例数据（开发调试用）
function fillExample() {
  titleInput.value = '动漫男孩角色';
  promptInput.value = '1boy, very short hair, brown hair, blue eyes, male, solo, backwards hat, black headwear, cap, glasses, blue-framed eyewear, red scarf, bracelet, white open jacket, black top, denim shorts, micro shorts, white leg warmers, blue footwear';
}

// 暴露方法供父组件调用
defineExpose({
  clearForm,
  fillExample
});
</script>

<style scoped>
.prompt-input-form {
  width: 100%;
  max-width: 64rem;
  margin: 0 auto;
}

.form-container {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
}

:global(.dark) .form-container {
  background-color: rgb(17, 24, 39);
}

.field-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(17, 24, 39);
  margin-bottom: 0.5rem;
}

:global(.dark) .field-group label {
  color: white;
}

.field-group input,
.field-group textarea {
  width: 100%;
  border: 1px solid rgb(209, 213, 219);
  border-radius: 0.5rem;
  padding: 0.75rem;
}

.field-group input:focus,
.field-group textarea:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgb(59, 130, 246);
  border-color: transparent;
}

:global(.dark) .field-group input,
:global(.dark) .field-group textarea {
  border-color: rgb(75, 85, 99);
  background-color: rgb(55, 65, 81);
  color: white;
}

.button-group {
  display: flex;
  gap: 0.75rem;
}

@media (max-width: 640px) {
  .button-group {
    flex-direction: column;
  }
}
</style>
