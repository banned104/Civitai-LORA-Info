<template>
  <Teleport to="body">
    <Transition name="back-to-top">
      <button
        v-if="showButton"
        @click="scrollToTop"
        class="back-to-top-button"
        :class="{ 'visible': showButton }"
        :title="t('backToTop')"
        :aria-label="t('backToTop')"
      >
        ⬆️
      </button>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from '../i18n';

const { t } = useI18n();

// 响应式数据
const showButton = ref(false);
const scrollThreshold = 300; // 滚动超过300px时显示按钮

// 检查滚动位置
function checkScrollPosition() {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  showButton.value = scrollTop > scrollThreshold;
}

// 平滑滚动到顶部
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

// 节流函数，优化滚动事件性能
function throttle(func: Function, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastExecTime = 0;
  
  return function (...args: any[]) {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}

// 节流后的滚动检查函数
const throttledScrollCheck = throttle(checkScrollPosition, 100);

// 生命周期钩子
onMounted(() => {
  // 初始检查
  checkScrollPosition();
  // 添加滚动事件监听器
  window.addEventListener('scroll', throttledScrollCheck, { passive: true });
});

onUnmounted(() => {
  // 移除滚动事件监听器
  window.removeEventListener('scroll', throttledScrollCheck);
});
</script>

<style scoped>
.back-to-top-button {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 3.5rem;
  height: 3.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.back-to-top-button:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
}

.back-to-top-button:active {
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .back-to-top-button {
    bottom: 1.5rem;
    right: 1.5rem;
    width: 3rem;
    height: 3rem;
    font-size: 1.25rem;
  }
}

@media (max-width: 480px) {
  .back-to-top-button {
    bottom: 1rem;
    right: 1rem;
    width: 2.75rem;
    height: 2.75rem;
    font-size: 1.125rem;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .back-to-top-button {
    background: linear-gradient(135deg, #4c51bf 0%, #553c9a 100%);
    border-color: rgba(255, 255, 255, 0.3);
  }
  
  .back-to-top-button:hover {
    background: linear-gradient(135deg, #434190 0%, #4c1d95 100%);
    box-shadow: 0 8px 20px rgba(76, 81, 191, 0.4);
  }
}

/* 过渡动画 */
.back-to-top-enter-active,
.back-to-top-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.back-to-top-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
}

.back-to-top-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
}

.back-to-top-enter-to,
.back-to-top-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* 辅助功能 */
.back-to-top-button:focus {
  outline: none;
  box-shadow: 0 0 0 2px #667eea, 0 0 0 4px rgba(102, 126, 234, 0.2);
}

/* 支持减少动画的用户偏好 */
@media (prefers-reduced-motion: reduce) {
  .back-to-top-button,
  .back-to-top-enter-active,
  .back-to-top-leave-active {
    transition: none;
  }
  
  .back-to-top-button:hover {
    transform: none;
  }
}
</style>
