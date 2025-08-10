<script setup lang="ts">
import { onMounted } from 'vue';
import LoraModelDisplay from './components/LoraModelDisplay.vue';
import BackToTop from './components/BackToTop.vue';
import LanguageSwitcher from './components/LanguageSwitcher.vue';
import { useI18n } from './i18n';

const { initLanguage } = useI18n();

// 初始化语言设置
onMounted(() => {
  initLanguage();
});
</script>

<template>
  <main class="bg-gray-100 dark:bg-gray-800 min-h-screen w-full p-4 sm:p-6 md:p-8">
    <!-- 语言切换按钮 -->
    <div class="fixed top-4 right-4 z-50">
      <LanguageSwitcher />
    </div>
    
    <div class="w-[85%] mx-auto">
      <LoraModelDisplay />
    </div>
    
    <!-- 回到顶部按钮 -->
    <BackToTop />
  </main>
</template>

<style scoped>
/* You can add any additional global styles for the App component here if needed */
</style>


