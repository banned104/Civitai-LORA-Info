<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getLoraModelInfo } from './info_getter';
import type { LoraModel, LoraModelVersion } from './lora_api_types';
import ImageCarousel from './ImageCarousel.vue';

const modelUrl = ref("https://civitai.com/models/1843641/acenix-katthe-mayictor-style");
const modelInfo = ref<LoraModel | null>(null);
const selectedVersion = ref<LoraModelVersion | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

async function fetchModelInfo() {
  if (!modelUrl.value) {
    error.value = "Please enter a URL.";
    return;
  }
  isLoading.value = true;
  error.value = null;
  modelInfo.value = null;
  selectedVersion.value = null;

  try {
    const data = await getLoraModelInfo(modelUrl.value);
    if (data) {
      modelInfo.value = data;
      if (data.modelVersions.length > 0) {
        selectedVersion.value = data.modelVersions[0];
      }
    } else {
      error.value = "Failed to fetch model information. Check the console for details.";
    }
  } catch (e: any) {
    error.value = e.message || "An unknown error occurred.";
  } finally {
    isLoading.value = false;
  }
}

onMounted(fetchModelInfo);
</script>

<template>
  <div class="container mx-auto p-4 max-w-4xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg shadow-xl">
    <div class="flex flex-col md:flex-row gap-4 mb-4">
      <input
        v-model="modelUrl"
        @keyup.enter="fetchModelInfo"
        type="text"
        placeholder="Enter Civitai Model URL"
        class="flex-grow p-2 border rounded-md bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        @click="fetchModelInfo"
        :disabled="isLoading"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
      >
        {{ isLoading ? 'Loading...' : 'Get Info' }}
      </button>
    </div>

    <div v-if="error" class="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
      <span class="font-medium">Error!</span> {{ error }}
    </div>

    <div v-if="isLoading" class="text-center p-8">
      <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
      <p class="mt-4">Fetching data...</p>
    </div>

    <div v-if="modelInfo && !isLoading && !error" class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- Left Column: Image Carousel -->
      <div>
        <ImageCarousel v-if="selectedVersion" :images="selectedVersion.images" />
      </div>

      <!-- Right Column: Model Details -->
      <div class="flex flex-col gap-4">
        <h1 class="text-3xl font-bold">{{ modelInfo.name }}</h1>
        <p class="text-lg text-gray-600 dark:text-gray-400">by {{ modelInfo.creator.username }}</p>

        <!-- Version Selector -->
        <div v-if="modelInfo.modelVersions.length > 1">
          <label for="version-select" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Select a version:</label>
          <select
            id="version-select"
            v-model="selectedVersion"
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          >
            <option v-for="version in modelInfo.modelVersions" :key="version.name" :value="version">
              {{ version.name }}
            </option>
          </select>
        </div>

        <div v-if="selectedVersion" class="space-y-4">
          <div>
            <h3 class="font-semibold text-lg mb-2">Description</h3>
            <p v-if="modelInfo.description" class="text-gray-700 dark:text-gray-300 text-sm prose" v-html="modelInfo.description"></p>
            <p v-else class="text-gray-500">No description provided.</p>
          </div>

          <div>
            <h3 class="font-semibold text-lg mb-2">Download Files</h3>
            <ul class="list-disc list-inside space-y-1">
              <li v-for="file in selectedVersion.files" :key="file.name" class="text-sm">
                <a :href="file.downloadUrl" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">
                  {{ file.name }}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
