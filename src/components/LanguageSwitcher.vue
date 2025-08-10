<template>
  <div class="language-switcher">
    <button
      @click="toggleLanguage"
      class="language-button"
      :title="currentLang === 'zh' ? t('switchToEnglish') : t('switchToChinese')"
    >
      <span class="language-icon">🌐</span>
      <span class="language-text">{{ currentLang === 'zh' ? 'EN' : '中' }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '../i18n';

const { t, toggleLanguage, currentLang } = useI18n();
</script>

<style scoped>
.language-switcher {
  display: inline-flex;
}

.language-button {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  background-color: white;
  border: 1px solid #d1d5db;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  font-size: 0.875rem;
  font-weight: 500;
}

.language-button:hover {
  background-color: #f9fafb;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transform: scale(1.05);
}

.language-button:active {
  transform: scale(0.95);
}

.language-button:focus {
  outline: none;
  box-shadow: 0 0 0 2px #3b82f6, 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.language-icon {
  font-size: 0.875rem;
}

.language-text {
  font-size: 0.875rem;
  font-weight: 500;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .language-button {
    background-color: #374151;
    border-color: #4b5563;
    color: #d1d5db;
  }
  
  .language-button:hover {
    background-color: #4b5563;
  }
}
</style>
