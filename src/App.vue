<script setup lang="ts">
import LoraModelDisplay from './components/LoraModelDisplay.vue';
import BackToTop from './components/BackToTop.vue';
</script>

<template>
  <main class="bg-gray-100 dark:bg-gray-800 min-h-screen w-full p-4 sm:p-6 md:p-8">
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


