<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Calendar组件测试</h1>
    
    <!-- 测试按钮 -->
    <div class="mb-4 space-x-2">
      <button @click="addTestData" class="px-4 py-2 bg-blue-500 text-white rounded">
        添加测试数据
      </button>
      <button @click="clearTestData" class="px-4 py-2 bg-red-500 text-white rounded">
        清除测试数据
      </button>
    </div>
    
    <!-- Calendar组件 -->
    <Calendar
      ref="calendarRef"
      @day-click="handleDayClick"
      @month-change="handleMonthChange"
      @load-day-cache="handleLoadDayCache"
      @clear-day-cache="handleClearDayCache"
    />
    
    <!-- 事件日志 -->
    <div class="mt-4 p-4 bg-gray-100 rounded">
      <h3 class="font-bold mb-2">事件日志:</h3>
      <div v-for="(log, index) in eventLogs" :key="index" class="text-sm">
        {{ log }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Calendar from './components/Calendar.vue';
import { CacheManager } from './components/cache_manager';
import type { LoraModel } from './components/lora_api_types';

const calendarRef = ref();
const eventLogs = ref<string[]>([]);

const addLog = (message: string) => {
  eventLogs.value.unshift(`${new Date().toLocaleTimeString()}: ${message}`);
  if (eventLogs.value.length > 10) {
    eventLogs.value.pop();
  }
};

const addTestData = () => {
  // 创建一些测试模型数据
  const testModels: LoraModel[] = [
    {
      id: 1001,
      name: "测试模型1",
      description: "这是一个测试模型",
      creator: { username: "testuser1" },
      modelVersions: [],
      tags: ["test"]
    },
    {
      id: 1002,
      name: "测试模型2", 
      description: "这是另一个测试模型",
      creator: { username: "testuser2" },
      modelVersions: [],
      tags: ["test"]
    }
  ];

  // 保存到缓存
  CacheManager.saveToLocalStorage(testModels);
  
  // 记录今日和昨日的保存
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  CacheManager.recordDailySave([testModels[0]]);
  
  // 模拟昨天的数据
  const yesterdayRecord = {
    date: yesterday,
    modelIds: [testModels[1].id],
    modelTitles: [testModels[1].name],
    timestamp: Date.now() - 24 * 60 * 60 * 1000
  };
  
  addLog("已添加测试数据");
  calendarRef.value?.refresh();
};

const clearTestData = () => {
  CacheManager.clearLocalStorage();
  addLog("已清除所有测试数据");
  calendarRef.value?.refresh();
};

const handleDayClick = (date: string, modelTitles: string[]) => {
  addLog(`点击日期: ${date}, 模型数量: ${modelTitles.length}`);
};

const handleMonthChange = (year: number, month: number) => {
  addLog(`切换到: ${year}年${month}月`);
};

const handleLoadDayCache = (date: string) => {
  addLog(`加载日期缓存: ${date}`);
};

const handleClearDayCache = (date: string) => {
  addLog(`清除日期缓存: ${date}`);
};
</script>
