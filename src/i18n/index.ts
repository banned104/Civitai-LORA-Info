import { ref, computed } from 'vue';

// 支持的语言类型
export type Language = 'zh' | 'en';

// 当前语言状态
const currentLanguage = ref<Language>('zh');

// 翻译文本定义
const translations = {
  zh: {
    // 通用
    search: '搜索',
    clear: '清除',
    cancel: '取消',
    confirm: '确认',
    save: '保存',
    export: '导出',
    delete: '删除',
    edit: '编辑',
    close: '关闭',
    loading: '加载中...',
    success: '成功',
    error: '错误',
    warning: '警告',
    info: '信息',
    
    // 搜索相关
    searchPlaceholder: '搜索所有历史模型数据... (输入2个字符后自动搜索，搜索词会一直保持)',
    searchAll: '搜索所有历史模型数据',
    clearSearch: '清除搜索',
    searchResults: '搜索结果',
    noSearchResults: '没有找到匹配的结果',
    advancedSearch: '高级搜索',
    showAdvancedSearch: '显示高级搜索',
    hideAdvancedSearch: '隐藏高级搜索',
    searching: '搜索中',
    found: '找到',
    models: '个模型',
    showAll: '显示全部',
    clearFilter: '清空筛选',
    searchByName: '按名称搜索',
    searchByTags: '按标签搜索',
    searchByDescription: '按描述搜索',
    positivePrompt: '正面提示词',
    negativePrompt: '负面提示词',
    searchPositivePrompt: '搜索正面提示词内容',
    searchNegativePrompt: '搜索负面提示词内容',
    trainedWords: '训练词',
    commaSeparated: '用逗号分隔',
    trainedWordsExample: '例如: character, anime, girl',
    tagsExample: '例如: style, character, photorealistic',
    
    // 模型相关
    modelExists: '模型 "{name}" 已经存在于列表中',
    modelNotFound: '未找到模型',
    fetchModelFailed: '获取模型信息失败，请检查控制台获取详细信息',
    unknownError: '发生未知错误',
    removeModel: '移除模型',
    removeModelConfirm: '确定要移除这个模型吗？',
    clearAllModels: '清空所有模型',
    clearAllModelsConfirm: '确定要清空所有模型吗？',
    exportAllModels: '导出所有模型',
    noModelsToExport: '没有模型可以导出',
    exportFailed: '导出失败，请重试',
    exportSuccess: '导出成功',
    
    // URL输入
    enterModelUrl: '请输入模型URL',
    urlPlaceholder: '请输入 Civitai 模型页面链接',
    getModelInfo: '获取模型信息',
    invalidUrl: '无效的URL格式',
    urlRequired: '请输入模型 URL',
    loraInfoGetter: 'LoRA 模型信息获取器',
    fetching: '获取中...',
    
    // 缓存管理
    cacheManagement: '缓存管理',
    loadFromCache: '从缓存加载',
    saveToCache: '保存到缓存',
    clearCache: '清除缓存',
    exportCache: '导出缓存',
    importCache: '导入缓存',
    cacheCleared: '本地缓存已清除',
    cacheLoaded: '成功从缓存加载 {count} 个模型',
    cacheSaved: '成功缓存 {count} 个模型到本地存储',
    cacheFailed: '缓存失败，请重试',
    cacheFailedPermission: '缓存失败，请检查浏览器存储权限',
    loadCacheFailed: '加载缓存失败，请重试',
    noCacheFound: '没有找到缓存数据',
    clearCacheConfirm: '确定要清除本地缓存吗？这将删除所有已保存的模型数据和日历记录。',
    cache: '缓存',
    updated: '更新',
    noCache: '暂无缓存',
    saveToCacheTooltip: '将当前模型保存到本地缓存',
    loadFromCacheTooltip: '从本地缓存加载模型',
    quickExportJsonTooltip: '快速导出当前模型为JSON文件',
    quickExportJson: '快速导出',
    advancedExport: '高级导出',
    advancedExportTooltip: '选择导出方式和格式',
    importJson: '导入JSON',
    importJsonTooltip: '从JSON文件导入模型数据',
    importing: '导入中',
    clearCacheTooltip: '清除本地缓存数据',
    localCacheNote: '本地缓存使用浏览器存储，清除浏览器数据会丢失缓存',
    jsonExportNote: 'JSON导出/导入功能可用于数据备份和跨设备同步',
    importDeduplicateNote: '导入时会自动去重，相同ID的模型会被更新',
    
    // 日历
    calendar: '日历',
    showCalendar: '显示保存历史日历',
    hideCalendar: '隐藏日历',
    selectDate: '选择日期',
    noModelsOnDate: '没有保存的LORA模型',
    modelsOnDate: '的模型',
    previousYear: '上一年',
    previousMonth: '上个月',
    nextMonth: '下个月',
    nextYear: '下一年',
    year: '年',
    noRecords: '无记录',
    hasRecords: '有记录',
    showOnlyWithData: '只显示有记录的日期',
    
    // 数据网格
    dataGrid: '数据网格',
    showDataGrid: '有数据的日期一览',
    hideDataGrid: '隐藏数据日期',
    dataOverview: '有数据的日期一览',
    foundDatesWithData: '共找到 {count} 个有数据的日期',
    clickDateToView: '点击日期查看详情',
    noLoraDataSaved: '暂无保存的LORA数据',
    
    // 通用界面
    totalModels: '已获取',
    batchExport: '批量导出 ZIP',
    clearAll: '清空所有',
    searchHint: '尝试调整搜索关键词或使用高级搜索功能',
    noModelsYet: '还没有获取任何模型信息',
    getStartedHint: '请在上方输入 Civitai 模型 URL 开始获取，或从缓存/JSON文件导入已保存的模型',
    copiedToClipboard: '已复制到剪贴板！',
    copyFailed: '复制失败，请手动复制',
    modelIdCopied: '模型ID已复制到剪贴板！',
    copyModelId: '复制模型ID',
    downloadMarkdown: '下载 Markdown',
    copyMarkdown: '复制 Markdown',
    hidePreview: '隐藏预览',
    previewMarkdown: '预览 Markdown',
    
    // 模型卡片
    modelName: '模型名称',
    modelDescription: '模型描述',
    modelTags: '标签',
    modelType: '类型',
    modelVersion: '版本',
    downloadCount: '下载次数',
    likeCount: '点赞次数',
    commentCount: '评论次数',
    creator: '创建者',
    publishedAt: '发布时间',
    updatedAt: '更新时间',
    
    // 图片相关
    images: '图片',
    previewImage: '预览图片',
    downloadImage: '下载图片',
    imageMetadata: '图片元数据',
    noImages: '没有图片',
    
    // 导航
    backToTop: '返回顶部',
    
    // 快捷方式
    searchShortcuts: '搜索快捷方式',
    recentSearches: '最近搜索',
    popularTags: '热门标签',
    quickSearch: '快速搜索',
    popularTrainedWords: '热门训练词',
    quickFilters: '快速过滤',
    recentlyAdded: '最近添加',
    mostImages: '图片最多',
    mostTrainedWords: '训练词最多',
    statistics: '统计信息',
    trainedWordsCount: '训练词数',
    totalImagesCount: '图片总数',
    creatorsCount: '创建者数',
    
    // 语言切换
    languageSwitch: '语言',
    chinese: '中文',
    english: 'English',
    switchToEnglish: '切换到英文',
    switchToChinese: '切换到中文',
    
    // 时间格式
    today: '今天',
    yesterday: '昨天',
    daysAgo: '{count}天前',
    weeksAgo: '{count}周前',
    monthsAgo: '{count}月前',
    yearsAgo: '{count}年前',
    
    // 月份
    months: [
      '一月', '二月', '三月', '四月', '五月', '六月',
      '七月', '八月', '九月', '十月', '十一月', '十二月'
    ],
    
    // 星期
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    weekdaysFull: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  },
  
  en: {
    // General
    search: 'Search',
    clear: 'Clear',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    export: 'Export',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Info',
    
    // Search related
    searchPlaceholder: 'Search all historical model data... (Auto search after 2 characters, search term will persist)',
    searchAll: 'Search all historical model data',
    clearSearch: 'Clear search',
    searchResults: 'Search Results',
    noSearchResults: 'No matching results found',
    advancedSearch: 'Advanced Search',
    showAdvancedSearch: 'Show Advanced Search',
    hideAdvancedSearch: 'Hide Advanced Search',
    searching: 'Searching',
    found: 'Found',
    models: 'models',
    showAll: 'Show All',
    clearFilter: 'Clear Filter',
    searchByName: 'Search by name',
    searchByTags: 'Search by tags',
    searchByDescription: 'Search by description',
    positivePrompt: 'Positive Prompt',
    negativePrompt: 'Negative Prompt',
    searchPositivePrompt: 'Search positive prompt content',
    searchNegativePrompt: 'Search negative prompt content',
    trainedWords: 'Trained Words',
    commaSeparated: 'comma separated',
    trainedWordsExample: 'e.g.: character, anime, girl',
    tagsExample: 'e.g.: style, character, photorealistic',
    
    // Model related
    modelExists: 'Model "{name}" already exists in the list',
    modelNotFound: 'Model not found',
    fetchModelFailed: 'Failed to fetch model information, please check console for details',
    unknownError: 'Unknown error occurred',
    removeModel: 'Remove model',
    removeModelConfirm: 'Are you sure you want to remove this model?',
    clearAllModels: 'Clear all models',
    clearAllModelsConfirm: 'Are you sure you want to clear all models?',
    exportAllModels: 'Export all models',
    noModelsToExport: 'No models to export',
    exportFailed: 'Export failed, please try again',
    exportSuccess: 'Export successful',
    
    // URL input
    enterModelUrl: 'Enter model URL',
    urlPlaceholder: 'Enter Civitai model page link',
    getModelInfo: 'Get model info',
    invalidUrl: 'Invalid URL format',
    urlRequired: 'Please enter model URL',
    loraInfoGetter: 'LoRA Model Info Getter',
    fetching: 'Fetching...',
    
    // Cache management
    cacheManagement: 'Cache Management',
    loadFromCache: 'Load from cache',
    saveToCache: 'Save to cache',
    clearCache: 'Clear cache',
    exportCache: 'Export cache',
    importCache: 'Import cache',
    cacheCleared: 'Local cache cleared',
    cacheLoaded: 'Successfully loaded {count} models from cache',
    cacheSaved: 'Successfully cached {count} models to local storage',
    cacheFailed: 'Cache failed, please try again',
    cacheFailedPermission: 'Cache failed, please check browser storage permissions',
    loadCacheFailed: 'Load cache failed, please try again',
    noCacheFound: 'No cache data found',
    clearCacheConfirm: 'Are you sure you want to clear local cache? This will delete all saved model data and calendar records.',
    cache: 'Cache',
    updated: 'Updated',
    noCache: 'No cache',
    saveToCacheTooltip: 'Save current models to local cache',
    loadFromCacheTooltip: 'Load models from local cache',
    quickExportJsonTooltip: 'Quick export current models to JSON file',
    quickExportJson: 'Quick Export',
    advancedExport: 'Advanced Export',
    advancedExportTooltip: 'Choose export method and format',
    importJson: 'Import JSON',
    importJsonTooltip: 'Import model data from JSON file',
    importing: 'Importing',
    clearCacheTooltip: 'Clear local cache data',
    localCacheNote: 'Local cache uses browser storage, clearing browser data will lose cache',
    jsonExportNote: 'JSON export/import can be used for data backup and cross-device sync',
    importDeduplicateNote: 'Duplicate models will be automatically removed, models with same ID will be updated',
    
    // Calendar
    calendar: 'Calendar',
    showCalendar: 'Show Save History Calendar',
    hideCalendar: 'Hide calendar',
    selectDate: 'Select date',
    noModelsOnDate: 'No saved LORA models on this date',
    modelsOnDate: 'models on',
    previousYear: 'Previous year',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    nextYear: 'Next year',
    year: '',
    noRecords: 'No records',
    hasRecords: 'Has records',
    showOnlyWithData: 'Show only dates with records',
    
    // Data grid
    dataGrid: 'Data Grid',
    showDataGrid: 'Show Data Dates Overview',
    hideDataGrid: 'Hide data grid',
    dataOverview: 'Data Dates Overview',
    foundDatesWithData: 'Found {count} dates with data',
    clickDateToView: 'Click date to view details',
    noLoraDataSaved: 'No LORA data saved',
    
    // General UI
    totalModels: 'Fetched',
    batchExport: 'Batch Export ZIP',
    clearAll: 'Clear All',
    searchHint: 'Try adjusting search keywords or use advanced search',
    noModelsYet: 'No model information fetched yet',
    getStartedHint: 'Enter a Civitai model URL above to get started, or import saved models from cache/JSON file',
    copiedToClipboard: 'Copied to clipboard!',
    copyFailed: 'Copy failed, please copy manually',
    modelIdCopied: 'Model ID copied to clipboard!',
    copyModelId: 'Copy model ID',
    downloadMarkdown: 'Download Markdown',
    copyMarkdown: 'Copy Markdown',
    hidePreview: 'Hide Preview',
    previewMarkdown: 'Preview Markdown',
    
    // Model card
    modelName: 'Model Name',
    modelDescription: 'Description',
    modelTags: 'Tags',
    modelType: 'Type',
    modelVersion: 'Version',
    downloadCount: 'Downloads',
    likeCount: 'Likes',
    commentCount: 'Comments',
    creator: 'Creator',
    publishedAt: 'Published',
    updatedAt: 'Updated',
    
    // Images
    images: 'Images',
    previewImage: 'Preview image',
    downloadImage: 'Download image',
    imageMetadata: 'Image metadata',
    noImages: 'No images',
    
    // Navigation
    backToTop: 'Back to top',
    
    // Shortcuts
    searchShortcuts: 'Search Shortcuts',
    recentSearches: 'Recent Searches',
    popularTags: 'Popular Tags',
    quickSearch: 'Quick Search',
    popularTrainedWords: 'Popular Trained Words',
    quickFilters: 'Quick Filters',
    recentlyAdded: 'Recently Added',
    mostImages: 'Most Images',
    mostTrainedWords: 'Most Trained Words',
    statistics: 'Statistics',
    trainedWordsCount: 'Trained Words',
    totalImagesCount: 'Total Images',
    creatorsCount: 'Creators',
    
    // Language switch
    languageSwitch: 'Language',
    chinese: '中文',
    english: 'English',
    switchToEnglish: 'Switch to English',
    switchToChinese: 'Switch to Chinese',
    
    // Time format
    today: 'Today',
    yesterday: 'Yesterday',
    daysAgo: '{count} days ago',
    weeksAgo: '{count} weeks ago',
    monthsAgo: '{count} months ago',
    yearsAgo: '{count} years ago',
    
    // Months
    months: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    
    // Weekdays
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    weekdaysFull: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  }
};

// 获取翻译文本的函数
export function useI18n() {
  const t = (key: string, params?: Record<string, string>): string => {
    const keys = key.split('.');
    let value: any = translations[currentLanguage.value];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }
    
    if (typeof value === 'string') {
      // 支持模板字符串替换
      if (params) {
        return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
          return params[paramKey] || match;
        });
      }
      return value;
    }
    
    return key;
  };
  
  const setLanguage = (lang: Language) => {
    currentLanguage.value = lang;
    // 保存到本地存储
    localStorage.setItem('app-language', lang);
  };
  
  const toggleLanguage = () => {
    setLanguage(currentLanguage.value === 'zh' ? 'en' : 'zh');
  };
  
  const currentLang = computed(() => currentLanguage.value);
  
  // 初始化时从本地存储读取语言设置
  const initLanguage = () => {
    const savedLang = localStorage.getItem('app-language') as Language;
    if (savedLang && (savedLang === 'zh' || savedLang === 'en')) {
      currentLanguage.value = savedLang;
    }
  };
  
  return {
    t,
    setLanguage,
    toggleLanguage,
    currentLang,
    initLanguage
  };
}

// 导出当前语言状态（供其他地方使用）
export { currentLanguage };
