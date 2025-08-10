<script setup lang="ts">
import { onMounted, ref } from 'vue';
import LoraModelDisplay from './components/LoraModelDisplay.vue';
import PromptManager from './components/prompt-manager/PromptManager.vue';
import BackToTop from './components/BackToTop.vue';
import LanguageSwitcher from './components/LanguageSwitcher.vue';
import { useI18n } from './i18n';

const { t, initLanguage } = useI18n();

// Tab 管理
const activeTab = ref<'lora' | 'prompt'>('lora');

// 初始化语言设置
onMounted(() => {
  initLanguage();
});

function switchTab(tab: 'lora' | 'prompt') {
  activeTab.value = tab;
}
</script>

<template>
  <main class="bg-gray-100 dark:bg-gray-800 min-h-screen w-full">
    <!-- 语言切换按钮 -->
    <div class="fixed top-4 right-4 z-50">
      <LanguageSwitcher />
    </div>
    
    <!-- Tab导航 -->
    <div class="w-full bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="w-[85%] mx-auto">
        <nav class="flex space-x-0">
          <button
            @click="switchTab('lora')"
            :class="{
              'bg-blue-600 text-white': activeTab === 'lora',
              'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700': activeTab !== 'lora'
            }"
            class="px-6 py-4 font-medium text-sm transition-all duration-200 border-b-2 border-transparent"
          >
            🖼️ {{ t('loraModelManager') }}
          </button>
          <button
            @click="switchTab('prompt')"
            :class="{
              'bg-blue-600 text-white': activeTab === 'prompt',
              'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700': activeTab !== 'prompt'
            }"
            class="px-6 py-4 font-medium text-sm transition-all duration-200 border-b-2 border-transparent"
          >
            🎨 {{ t('promptManager') }}
          </button>
        </nav>
      </div>
    </div>
    
    <!-- Tab内容 -->
    <div class="w-[85%] mx-auto p-4 sm:p-6 md:p-8">
      <!-- LoRA模型管理 -->
      <div v-show="activeTab === 'lora'">
        <LoraModelDisplay />
      </div>
      
      <!-- Prompt管理 -->
      <div v-show="activeTab === 'prompt'">
        <PromptManager />
      </div>
    </div>
    
    <!-- 回到顶部按钮 -->
    <BackToTop />
  </main>
</template>

<style scoped>
/* You can add any additional global styles for the App component here if needed */
</style>


