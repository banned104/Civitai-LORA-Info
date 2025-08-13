import type { LoraModel } from './lora_api_types';

/**
 * 日期保存记录
 */
export interface DailySaveRecord {
  date: string; // YYYY-MM-DD 格式
  modelIds: number[];
  modelTitles: string[];
  timestamp: number;
}

/**
 * 缓存数据结构
 */
export interface CacheData {
  version: string;
  timestamp: number;
  models: LoraModel[];
  dailyRecords: DailySaveRecord[]; // 新增：每日保存记录
  metadata: {
    exportDate: string;
    totalModels: number;
    appVersion: string;
  };
}

/**
 * 缓存管理器 - 负责模型数据的缓存、导出和导入
 */
export class CacheManager {
  private static readonly CACHE_VERSION = '1.0.0';
  private static readonly STORAGE_KEY = 'lora_models_cache';
  
  /**
   * 将模型数据保存到本地存储
   */
  static saveToLocalStorage(models: LoraModel[]): boolean {
    try {
      const cacheData: CacheData = this.createCacheData(models);
      const jsonString = JSON.stringify(cacheData);
      localStorage.setItem(this.STORAGE_KEY, jsonString);
      return true;
    } catch (error) {
      console.error('保存到本地存储失败:', error);
      return false;
    }
  }

  /**
   * 只保存模型数据，不影响日期记录
   */
  static saveModelsOnly(models: LoraModel[]): boolean {
    try {
      const existingData = this.getCacheDataFromStorage();
      if (!existingData) {
        // 如果没有现有数据，创建新的
        return this.saveToLocalStorage(models);
      }

      // 保留现有的日期记录，只更新模型列表
      existingData.models = models;
      existingData.timestamp = Date.now();
      existingData.metadata.totalModels = models.length;
      existingData.metadata.exportDate = new Date().toLocaleString('zh-CN');

      const jsonString = JSON.stringify(existingData);
      localStorage.setItem(this.STORAGE_KEY, jsonString);
      
      console.log(`saveModelsOnly: 已保存 ${models.length} 个模型，保留了 ${existingData.dailyRecords.length} 个日期记录`);
      return true;
    } catch (error) {
      console.error('保存模型到本地存储失败:', error);
      return false;
    }
  }

  /**
   * 从本地存储加载模型数据
   */
  static loadFromLocalStorage(): LoraModel[] | null {
    try {
      const jsonString = localStorage.getItem(this.STORAGE_KEY);
      if (!jsonString) return null;

      const cacheData: CacheData = JSON.parse(jsonString);
      
      // 验证缓存数据的有效性
      if (!this.validateCacheData(cacheData)) {
        console.warn('缓存数据无效，已清除');
        this.clearLocalStorage();
        return null;
      }

      return cacheData.models;
    } catch (error) {
      console.error('从本地存储加载失败:', error);
      this.clearLocalStorage();
      return null;
    }
  }

  /**
   * 清除本地存储的缓存
   */
  static clearLocalStorage(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * 导出模型数据为JSON文件
   */
  static exportToJson(models: LoraModel[], filename?: string): void {
    try {
      const cacheData: CacheData = this.createCacheData(models);
      const jsonString = JSON.stringify(cacheData, null, 2);
      
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `lora_models_cache_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出JSON失败:', error);
      throw new Error('导出失败，请重试');
    }
  }

  /**
   * 按日期导出JSON文件，打包为ZIP下载
   */
  static async exportDailyJsonAsZip(filename?: string): Promise<void> {
    try {
      // 动态导入JSZip
      const JSZip = (await import('jszip')).default;
      
      const zip = new JSZip();
      const dailyRecords = this.getDailyRecords();
      const allModels = this.loadFromLocalStorage() || [];
      
      if (dailyRecords.length === 0) {
        throw new Error('没有找到任何日期记录');
      }

      // 按日期分组导出
      for (const record of dailyRecords) {
        const dayModels = allModels.filter(model => record.modelIds.includes(model.id));
        
        if (dayModels.length > 0) {
          const dayData = {
            date: record.date,
            timestamp: record.timestamp,
            modelCount: dayModels.length,
            models: dayModels,
            metadata: {
              exportDate: new Date().toLocaleString('zh-CN'),
              originalDate: new Date(record.timestamp).toLocaleString('zh-CN'),
              appVersion: this.CACHE_VERSION
            }
          };
          
          const jsonString = JSON.stringify(dayData, null, 2);
          const fileName = `models_${record.date}.json`;
          zip.file(fileName, jsonString);
        }
      }

      // 创建汇总文件
      const summaryData = {
        exportInfo: {
          exportDate: new Date().toLocaleString('zh-CN'),
          totalDays: dailyRecords.length,
          totalModels: allModels.length,
          appVersion: this.CACHE_VERSION
        },
        dailySummary: dailyRecords.map(record => ({
          date: record.date,
          modelCount: record.modelIds.length,
          modelTitles: record.modelTitles,
          timestamp: record.timestamp
        })),
        allModels: allModels
      };
      
      zip.file('summary.json', JSON.stringify(summaryData, null, 2));
      
      // 创建README说明文件
      const readmeContent = this.generateExportReadme(dailyRecords, allModels.length);
      zip.file('README.md', readmeContent);

      // 生成ZIP文件并下载
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `lora_models_daily_export_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('按日期导出JSON失败:', error);
      throw new Error('按日期导出失败，请重试');
    }
  }

  /**
   * 生成导出说明文件
   */
  private static generateExportReadme(dailyRecords: DailySaveRecord[], totalModels: number): string {
    const exportDate = new Date().toLocaleString('zh-CN');
    
    return `# LORA模型导出报告

## 导出信息
- **导出时间**: ${exportDate}
- **导出天数**: ${dailyRecords.length} 天
- **模型总数**: ${totalModels} 个
- **应用版本**: ${this.CACHE_VERSION}

## 文件说明

### 核心文件
- \`summary.json\` - 完整汇总数据，包含所有模型和每日统计
- \`README.md\` - 本说明文件

### 按日期分类的文件
${dailyRecords.map(record => 
  `- \`models_${record.date}.json\` - ${record.date} (${record.modelIds.length}个模型)`
).join('\n')}

## 文件结构说明

### 单日文件格式 (models_YYYY-MM-DD.json)
\`\`\`json
{
  "date": "保存日期",
  "timestamp": "保存时间戳", 
  "modelCount": "模型数量",
  "models": [...], // 该日保存的模型数据
  "metadata": {
    "exportDate": "导出时间",
    "originalDate": "原始保存时间", 
    "appVersion": "应用版本"
  }
}
\`\`\`

### 汇总文件格式 (summary.json)
\`\`\`json
{
  "exportInfo": {
    "exportDate": "导出时间",
    "totalDays": "总天数",
    "totalModels": "总模型数",
    "appVersion": "应用版本"
  },
  "dailySummary": [...], // 每日统计摘要
  "allModels": [...] // 所有模型的完整数据
}
\`\`\`

## 使用说明

1. **单日数据恢复**: 可以单独导入某一天的JSON文件
2. **完整数据恢复**: 使用summary.json文件可以恢复所有数据
3. **数据分析**: 可以基于这些JSON文件进行数据分析和统计

## 注意事项

- 所有时间均为本地时间格式
- 模型数据结构遵循Civitai API规范
- 建议定期备份这些导出文件

---
*由 LORA Info Downloader v${this.CACHE_VERSION} 自动生成*
`;
  }

  /**
   * 从JSON文件导入模型数据
   */
  static async importFromJson(file: File): Promise<LoraModel[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const jsonString = event.target?.result as string;
          const raw = JSON.parse(jsonString);

          // 统一解析不同导出格式，提取模型数组
          const models = this.extractModelsFromImport(raw);

          if (!models || !Array.isArray(models) || models.length === 0) {
            reject(new Error('导入的文件中没有找到模型数据'));
            return;
          }

          // 验证模型结构
          if (!this.validateModelsData(models)) {
            reject(new Error('模型数据结构不正确'));
            return;
          }

          resolve(models as LoraModel[]);
        } catch (error) {
          console.error('解析JSON文件失败:', error);
          reject(new Error('JSON文件格式错误'));
        }
      };

      reader.onerror = () => {
        reject(new Error('读取文件失败'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * 兼容导入不同导出格式，提取模型数组
   * 支持：
   * - 完整缓存导出（CacheData）：{ version, timestamp, models, dailyRecords, metadata }
   * - 单日导出（models_YYYY-MM-DD.json）：{ date, timestamp, modelCount, models, metadata }
   * - 汇总导出（summary.json）：{ exportInfo, dailySummary, allModels }
   * - 纯数组：[ LoraModel, ... ]
   */
  private static extractModelsFromImport(raw: any): LoraModel[] | null {
    try {
      // 1) 纯数组
      if (Array.isArray(raw)) {
        return raw as LoraModel[];
      }

      if (!raw || typeof raw !== 'object') return null;

      // 2) 完整缓存导出（宽松校验，不强制版本匹配）
      if (Array.isArray((raw as any).models) && typeof (raw as any).timestamp === 'number') {
        return (raw as any).models as LoraModel[];
      }

      // 3) 单日导出
      if (typeof (raw as any).date === 'string' && Array.isArray((raw as any).models)) {
        return (raw as any).models as LoraModel[];
      }

      // 4) 汇总导出
      if (Array.isArray((raw as any).allModels)) {
        return (raw as any).allModels as LoraModel[];
      }

      // 5) 退化：对象里存在 models 数组
      if (Array.isArray((raw as any).models)) {
        return (raw as any).models as LoraModel[];
      }

      return null;
    } catch (e) {
      console.error('extractModelsFromImport 失败:', e);
      return null;
    }
  }

  /**
   * 创建缓存数据结构
   */
  private static createCacheData(models: LoraModel[]): CacheData {
    // 从现有缓存中获取历史记录
    const existingRecords = this.getDailyRecords();
    
    return {
      version: this.CACHE_VERSION,
      timestamp: Date.now(),
      models: models,
      dailyRecords: existingRecords,
      metadata: {
        exportDate: new Date().toLocaleString('zh-CN'),
        totalModels: models.length,
        appVersion: this.CACHE_VERSION
      }
    };
  }

  /**
   * 验证缓存数据的有效性
   */
  private static validateCacheData(data: any): data is CacheData {
    if (!data || typeof data !== 'object') return false;
    
    // 检查必需的字段
    if (!data.version || !data.timestamp || !Array.isArray(data.models)) {
      return false;
    }

    // 对于旧版本的缓存，添加默认的 dailyRecords
    if (!data.dailyRecords) {
      data.dailyRecords = [];
    }

    // 检查版本兼容性
    if (data.version !== this.CACHE_VERSION) {
      console.warn(`缓存版本不匹配: 期望 ${this.CACHE_VERSION}, 实际 ${data.version}`);
      // 可以在这里添加版本迁移逻辑
      return false;
    }

    // 验证模型数据结构
    return this.validateModelsData(data.models);
  }

  /**
   * 验证模型数据的结构
   */
  private static validateModelsData(models: any[]): boolean {
    if (!Array.isArray(models)) return false;
    
    return models.every(model => {
      return model &&
             typeof model.id === 'number' &&
             typeof model.name === 'string' &&
             model.creator &&
             typeof model.creator.username === 'string' &&
             Array.isArray(model.modelVersions);
    });
  }

  /**
   * 获取缓存统计信息
   */
  static getCacheStats(): { hasCache: boolean; modelsCount: number; lastUpdated: string | null } {
    try {
      const jsonString = localStorage.getItem(this.STORAGE_KEY);
      if (!jsonString) {
        return { hasCache: false, modelsCount: 0, lastUpdated: null };
      }

      const cacheData: CacheData = JSON.parse(jsonString);
      return {
        hasCache: true,
        modelsCount: cacheData.models.length,
        lastUpdated: new Date(cacheData.timestamp).toLocaleString('zh-CN')
      };
    } catch (error) {
      console.error('获取缓存统计失败:', error);
      return { hasCache: false, modelsCount: 0, lastUpdated: null };
    }
  }

  /**
   * 合并两个模型数组，去除重复项
   */
  static mergeModels(existingModels: LoraModel[], newModels: LoraModel[]): LoraModel[] {
    const modelMap = new Map<number, LoraModel>();
    
    // 先添加现有模型
    existingModels.forEach(model => {
      modelMap.set(model.id, model);
    });
    
    // 再添加新模型（会覆盖相同ID的模型）
    newModels.forEach(model => {
      modelMap.set(model.id, model);
    });
    
    return Array.from(modelMap.values());
  }

  /**
   * 记录今日保存的模型（已废弃，请使用 recordNewModelsToday）
   * @deprecated 使用 recordNewModelsToday 替代，避免重复记录整个模型列表
   */
  static recordDailySave(models: LoraModel[]): void {
    console.warn('⚠️  recordDailySave 方法已废弃，建议使用 recordNewModelsToday 方法');
    this.recordNewModelsToday(models);
  }

  /**
   * 记录今日新增的模型（修复版本）
   * 只记录真正新增的模型，避免重复记录
   */
  static recordNewModelsToday(newModels: LoraModel[]): void {
    if (newModels.length === 0) {
      console.warn('recordNewModelsToday: 新模型列表为空，跳过记录');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      console.log(`recordNewModelsToday: 准备记录 ${newModels.length} 个新模型到今日 ${today}`);
      
      const existingData = this.getCacheDataFromStorage();
      
      if (!existingData) {
        console.warn('recordNewModelsToday: 没有现有缓存数据，创建新数据');
        const newData: CacheData = this.createCacheData([]);
        newData.dailyRecords = [];
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newData));
      }

      const cacheData = this.getCacheDataFromStorage();
      if (!cacheData) {
        console.error('recordNewModelsToday: 无法获取缓存数据');
        return;
      }

      // 找到今日的记录或创建新记录
      const todayRecordIndex = cacheData.dailyRecords.findIndex(record => record.date === today);
      
      const newModelIds = newModels.map(m => m.id);
      const newModelTitles = newModels.map(m => m.name);
      
      if (todayRecordIndex >= 0) {
        // 更新现有记录，只添加新的模型ID和标题
        console.log(`recordNewModelsToday: 更新今日现有记录 ${today}`);
        const existingRecord = cacheData.dailyRecords[todayRecordIndex];
        
        // 过滤出真正新增的模型
        const reallyNewIds: number[] = [];
        const reallyNewTitles: string[] = [];
        
        newModelIds.forEach((id, index) => {
          if (!existingRecord.modelIds.includes(id)) {
            reallyNewIds.push(id);
            reallyNewTitles.push(newModelTitles[index]);
          }
        });
        
        if (reallyNewIds.length > 0) {
          existingRecord.modelIds.push(...reallyNewIds);
          existingRecord.modelTitles.push(...reallyNewTitles);
          existingRecord.timestamp = Date.now();
          
          console.log(`recordNewModelsToday: 今日记录已更新，新增 ${reallyNewIds.length} 个模型，现在 ${today} 总共有 ${existingRecord.modelIds.length} 个模型`);
        } else {
          console.log(`recordNewModelsToday: 所有模型都已存在于今日记录中，无需更新`);
          return;
        }
      } else {
        // 添加新记录
        console.log(`recordNewModelsToday: 创建今日新记录 ${today}`);
        const newRecord: DailySaveRecord = {
          date: today,
          modelIds: newModelIds,
          modelTitles: newModelTitles,
          timestamp: Date.now()
        };
        cacheData.dailyRecords.push(newRecord);
        console.log(`recordNewModelsToday: 今日新记录已添加，${today} 有 ${newModelIds.length} 个模型`);
      }

      // 保存更新的数据
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cacheData));
      console.log(`recordNewModelsToday: 成功保存到今日 ${today}`);
      
    } catch (error) {
      console.error('记录今日新模型失败:', error);
    }
  }

  /**
   * 记录单个新模型到今天
   */
  static recordSingleModelToday(model: LoraModel): void {
    this.recordNewModelsToday([model]);
  }

  /**
   * 记录模型到指定日期
   */
  static recordDailySaveForDate(models: LoraModel[], targetDate: string): void {
    if (models.length === 0) {
      console.warn('recordDailySaveForDate: 模型列表为空，跳过记录');
      return;
    }

    // 验证日期格式
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(targetDate)) {
      console.error(`recordDailySaveForDate: 无效的日期格式: ${targetDate}`);
      throw new Error(`无效的日期格式: ${targetDate}，期望格式为 YYYY-MM-DD`);
    }

    // 验证日期是否合理（不能是未来日期）
    const today = new Date().toISOString().split('T')[0];
    const targetDateObj = new Date(targetDate + 'T00:00:00');
    const todayObj = new Date(today + 'T00:00:00');
    
    if (targetDateObj > todayObj) {
      console.error(`recordDailySaveForDate: 不允许记录到未来日期: ${targetDate}`);
      throw new Error(`不允许记录到未来日期: ${targetDate}`);
    }

    console.log(`recordDailySaveForDate: 开始记录 ${models.length} 个模型到日期 ${targetDate}`);

    try {
      const existingData = this.getCacheDataFromStorage();
      
      if (!existingData) {
        // 如果没有现有数据，创建新的缓存数据
        console.log('recordDailySaveForDate: 创建新的缓存数据');
        const newData: CacheData = this.createCacheData([]);
        newData.dailyRecords = [];
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newData));
      }

      const cacheData = this.getCacheDataFromStorage();
      if (!cacheData) {
        console.error('recordDailySaveForDate: 无法获取缓存数据');
        return;
      }

      // 找到指定日期的记录或创建新记录
      const targetRecordIndex = cacheData.dailyRecords.findIndex(record => record.date === targetDate);
      
      const modelIds = models.map(m => m.id);
      const modelTitles = models.map(m => m.name);
      
      const newRecord: DailySaveRecord = {
        date: targetDate,
        modelIds: modelIds,
        modelTitles: modelTitles,
        timestamp: Date.now()
      };

      if (targetRecordIndex >= 0) {
        // 更新现有记录，合并模型ID和标题
        console.log(`recordDailySaveForDate: 更新现有记录 ${targetDate}`);
        const existingRecord = cacheData.dailyRecords[targetRecordIndex];
        const combinedIds = [...new Set([...existingRecord.modelIds, ...modelIds])];
        const combinedTitles = [...new Set([...existingRecord.modelTitles, ...modelTitles])];
        
        cacheData.dailyRecords[targetRecordIndex] = {
          ...newRecord,
          modelIds: combinedIds,
          modelTitles: combinedTitles
        };
        
        console.log(`recordDailySaveForDate: 记录已更新，现在 ${targetDate} 有 ${combinedIds.length} 个模型`);
      } else {
        // 添加新记录
        console.log(`recordDailySaveForDate: 创建新记录 ${targetDate}`);
        cacheData.dailyRecords.push(newRecord);
        console.log(`recordDailySaveForDate: 新记录已添加，${targetDate} 有 ${modelIds.length} 个模型`);
      }

      // 保存更新的数据
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cacheData));
      console.log(`recordDailySaveForDate: 成功保存到 ${targetDate}，不影响其他日期的记录`);
      
      // 验证保存是否成功
      const verifyData = this.getCacheDataFromStorage();
      const verifyRecord = verifyData?.dailyRecords.find(record => record.date === targetDate);
      if (verifyRecord) {
        console.log(`recordDailySaveForDate: 验证成功，${targetDate} 现在有 ${verifyRecord.modelIds.length} 个模型`);
      } else {
        console.error(`recordDailySaveForDate: 验证失败，未找到 ${targetDate} 的记录`);
      }
      
    } catch (error) {
      console.error('记录指定日期保存失败:', error);
      throw error; // 重新抛出错误，让调用者知道失败了
    }
  }

  /**
   * 获取所有每日记录
   */
  static getDailyRecords(): DailySaveRecord[] {
    try {
      const cacheData = this.getCacheDataFromStorage();
      return cacheData?.dailyRecords || [];
    } catch (error) {
      console.error('获取每日记录失败:', error);
      return [];
    }
  }

  /**
   * 获取指定月份的每日记录
   */
  static getDailyRecordsForMonth(year: number, month: number): DailySaveRecord[] {
    const allRecords = this.getDailyRecords();
    const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
    
    return allRecords.filter(record => record.date.startsWith(monthStr));
  }

  /**
   * 获取指定日期的记录
   */
  static getDailyRecordForDate(date: string): DailySaveRecord | null {
    const allRecords = this.getDailyRecords();
    return allRecords.find(record => record.date === date) || null;
  }

  /**
   * 获取指定日期保存的模型
   */
  static getModelsForDate(date: string): LoraModel[] {
    try {
      const dailyRecord = this.getDailyRecordForDate(date);
      if (!dailyRecord) return [];

      const allModels = this.loadFromLocalStorage() || [];
      return allModels.filter(model => dailyRecord.modelIds.includes(model.id));
    } catch (error) {
      console.error('获取指定日期模型失败:', error);
      return [];
    }
  }

  /**
   * 清除指定日期的记录
   */
  static clearDailyRecord(date: string): boolean {
    try {
      const cacheData = this.getCacheDataFromStorage();
      if (!cacheData) return false;

      const recordIndex = cacheData.dailyRecords.findIndex(record => record.date === date);
      if (recordIndex === -1) return false;

      // 移除该日期的记录
      cacheData.dailyRecords.splice(recordIndex, 1);
      
      // 保存更新的数据
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cacheData));
      return true;
    } catch (error) {
      console.error('清除日期记录失败:', error);
      return false;
    }
  }

  /**
   * 从指定日期的记录中移除特定模型
   */
  static removeModelFromDate(date: string, modelId: number): boolean {
    try {
      const cacheData = this.getCacheDataFromStorage();
      if (!cacheData) return false;

      const recordIndex = cacheData.dailyRecords.findIndex(record => record.date === date);
      if (recordIndex === -1) return false;

      const record = cacheData.dailyRecords[recordIndex];
      const modelIndex = record.modelIds.indexOf(modelId);
      
      if (modelIndex === -1) return false;

      // 移除模型ID和标题
      record.modelIds.splice(modelIndex, 1);
      record.modelTitles.splice(modelIndex, 1);

      // 如果记录为空，则删除整个记录
      if (record.modelIds.length === 0) {
        cacheData.dailyRecords.splice(recordIndex, 1);
      }

      // 保存更新的数据
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cacheData));
      return true;
    } catch (error) {
      console.error('从日期记录中移除模型失败:', error);
      return false;
    }
  }

  /**
   * 从存储中获取完整的缓存数据
   */
  private static getCacheDataFromStorage(): CacheData | null {
    try {
      const jsonString = localStorage.getItem(this.STORAGE_KEY);
      if (!jsonString) return null;

      const cacheData: CacheData = JSON.parse(jsonString);
      
      // 确保 dailyRecords 存在
      if (!cacheData.dailyRecords) {
        cacheData.dailyRecords = [];
      }
      
      return cacheData;
    } catch (error) {
      console.error('从存储获取缓存数据失败:', error);
      return null;
    }
  }
  
  /**
   * 获取所有历史模型（包含所有日期的数据）
   */
  static getAllHistoricalModels(): LoraModel[] {
    try {
      // 获取当前模型列表
      const currentModels = this.loadFromLocalStorage() || [];
      console.log(`获取所有历史模型: 当前模型列表包含 ${currentModels.length} 个模型`);
      
      // 获取所有日期记录
      const dailyRecords = this.getDailyRecords();
      console.log(`获取所有历史模型: 日期记录包含 ${dailyRecords.length} 个日期`);
      
      // 收集所有模型ID
      const allModelIds = new Set<number>();
      
      // 添加当前模型ID
      currentModels.forEach(model => allModelIds.add(model.id));
      
      // 添加历史记录中的模型ID
      dailyRecords.forEach(record => {
        record.modelIds.forEach(id => allModelIds.add(id));
      });
      
      console.log(`获取所有历史模型: 总共收集到 ${allModelIds.size} 个唯一模型ID`);
      
      // 目前只返回当前模型列表中的模型，因为历史模型的详细数据需要额外存储
      // 在实际应用中，可能需要将模型详情也按日期存储
      return currentModels;
    } catch (error) {
      console.error('获取所有历史模型失败:', error);
      return [];
    }
  }

  /**
   * 搜索模型（搜索所有历史数据）
   * 支持模糊搜索模型名称、描述、训练词和Prompt
   */
  static searchModels(query: string): LoraModel[] {
    try {
      // 使用所有历史模型进行搜索
      const models = this.getAllHistoricalModels();
      console.log(`执行搜索: 在 ${models.length} 个模型中搜索关键词 "${query}"`);
      
      if (!models || models.length === 0) {
        console.log('搜索中止: 没有可搜索的模型');
        return [];
      }

      if (!query || query.trim() === '') {
        console.log('搜索中止: 搜索关键词为空，返回所有模型');
        return models;
      }

      const searchTerm = query.toLowerCase().trim();
      
      const results = models.filter(model => {
        // 搜索模型名称
        if (model.name?.toLowerCase().includes(searchTerm)) {
          return true;
        }

        // 搜索模型描述
        if (model.description?.toLowerCase().includes(searchTerm)) {
          return true;
        }

        // 搜索用户备注
        if (model.note?.toLowerCase().includes(searchTerm)) {
          return true;
        }

        // 搜索标签
        if (model.tags?.some(tag => tag.toLowerCase().includes(searchTerm))) {
          return true;
        }

        // 搜索所有版本的训练词
        if (model.modelVersions?.some(version => 
          version.trainedWords?.some(word => word.toLowerCase().includes(searchTerm))
        )) {
          return true;
        }

        // 搜索所有版本中图片的 Prompt
        if (model.modelVersions?.some(version =>
          version.images?.some(image => {
            const meta = image.meta;
            if (!meta) return false;
            
            // 搜索正面提示词
            if (meta.prompt?.toLowerCase().includes(searchTerm)) {
              return true;
            }
            
            // 搜索负面提示词
            if (meta.negativePrompt?.toLowerCase().includes(searchTerm)) {
              return true;
            }
            
            // 搜索资源信息（如LoRA名称）
            if (meta.resources?.some(resource => 
              resource.name?.toLowerCase().includes(searchTerm)
            )) {
              return true;
            }
            
            return false;
          })
        )) {
          return true;
        }

        return false;
      });
      
      console.log(`搜索完成: 关键词 "${query}" 找到 ${results.length} 个匹配的模型`);
      console.log(`匹配的模型:`, results.map((m: LoraModel) => ({ id: m.id, name: m.name })));
      
      return results;
    } catch (error) {
      console.error('搜索模型失败:', error);
      return [];
    }
  }

  /**
   * 高级搜索模型（搜索所有历史数据）
   * 支持多种搜索条件组合
   */
  static advancedSearchModels(options: {
    name?: string;
    description?: string;
    note?: string;
    trainedWords?: string[];
    prompt?: string;
    negativePrompt?: string;
    tags?: string[];
    creatorUsername?: string;
  }): LoraModel[] {
    try {
      // 使用所有历史模型进行搜索
      const models = this.getAllHistoricalModels();
      if (!models || models.length === 0) {
        return [];
      }

      return models.filter(model => {
        // 按名称过滤
        if (options.name && !model.name?.toLowerCase().includes(options.name.toLowerCase())) {
          return false;
        }

        // 按描述过滤
        if (options.description && !model.description?.toLowerCase().includes(options.description.toLowerCase())) {
          return false;
        }

        // 按备注过滤
        if (options.note && !model.note?.toLowerCase().includes(options.note.toLowerCase())) {
          return false;
        }

        // 按创建者过滤
        if (options.creatorUsername && !model.creator?.username.toLowerCase().includes(options.creatorUsername.toLowerCase())) {
          return false;
        }

        // 按标签过滤
        if (options.tags && options.tags.length > 0) {
          const hasMatchingTag = options.tags.some(searchTag => 
            model.tags?.some(modelTag => modelTag.toLowerCase().includes(searchTag.toLowerCase()))
          );
          if (!hasMatchingTag) {
            return false;
          }
        }

        // 按训练词过滤
        if (options.trainedWords && options.trainedWords.length > 0) {
          const hasMatchingTrainedWord = options.trainedWords.some(searchWord =>
            model.modelVersions?.some(version =>
              version.trainedWords?.some(word => word.toLowerCase().includes(searchWord.toLowerCase()))
            )
          );
          if (!hasMatchingTrainedWord) {
            return false;
          }
        }

        // 按Prompt过滤
        if (options.prompt || options.negativePrompt) {
          const hasMatchingPrompt = model.modelVersions?.some(version =>
            version.images?.some(image => {
              const meta = image.meta;
              if (!meta) return false;

              if (options.prompt && !meta.prompt?.toLowerCase().includes(options.prompt.toLowerCase())) {
                return false;
              }

              if (options.negativePrompt && !meta.negativePrompt?.toLowerCase().includes(options.negativePrompt.toLowerCase())) {
                return false;
              }

              return true;
            })
          );
          if (!hasMatchingPrompt) {
            return false;
          }
        }

        return true;
      });
    } catch (error) {
      console.error('高级搜索模型失败:', error);
      return [];
    }
  }

  /**
   * 获取所有唯一的训练词
   */
  static getAllTrainedWords(): string[] {
    try {
      const models = this.loadFromLocalStorage();
      if (!models) return [];

      const allWords = new Set<string>();
      
      models.forEach(model => {
        model.modelVersions?.forEach(version => {
          version.trainedWords?.forEach(word => {
            allWords.add(word);
          });
        });
      });

      return Array.from(allWords).sort();
    } catch (error) {
      console.error('获取训练词失败:', error);
      return [];
    }
  }

  /**
   * 获取所有唯一的标签
   */
  static getAllTags(): string[] {
    try {
      const models = this.loadFromLocalStorage();
      if (!models) return [];

      const allTags = new Set<string>();
      
      models.forEach(model => {
        model.tags?.forEach(tag => {
          allTags.add(tag);
        });
      });

      return Array.from(allTags).sort();
    } catch (error) {
      console.error('获取标签失败:', error);
      return [];
    }
  }

  /**
   * 获取搜索建议（基于所有历史数据）
   */
  static getSearchSuggestions(query: string, limit: number = 10): string[] {
    try {
      if (!query || query.trim().length < 2) return [];

      const searchTerm = query.toLowerCase().trim();
      const suggestions = new Set<string>();

      // 使用所有历史模型生成建议
      const models = this.getAllHistoricalModels();
      if (!models) return [];

      models.forEach(model => {
        // 模型名称建议
        if (model.name?.toLowerCase().includes(searchTerm)) {
          suggestions.add(model.name);
        }

        // 训练词建议
        model.modelVersions?.forEach(version => {
          version.trainedWords?.forEach(word => {
            if (word.toLowerCase().includes(searchTerm)) {
              suggestions.add(word);
            }
          });
        });

        // 标签建议
        model.tags?.forEach(tag => {
          if (tag.toLowerCase().includes(searchTerm)) {
            suggestions.add(tag);
          }
        });
      });

      return Array.from(suggestions).slice(0, limit);
    } catch (error) {
      console.error('获取搜索建议失败:', error);
      return [];
    }
  }

  /**
   * 更新模型备注
   */
  static updateModelNote(modelId: number, note: string): boolean {
    try {
      const cacheData = this.getCacheDataFromStorage();
      if (!cacheData) {
        console.error('无法加载缓存数据');
        return false;
      }

      // 查找并更新模型
      const model = cacheData.models.find(m => m.id === modelId);
      if (!model) {
        console.error(`未找到ID为 ${modelId} 的模型`);
        return false;
      }

      // 更新备注和时间戳
      model.note = note.trim();
      model.noteTimestamp = Date.now();

      // 更新缓存元数据
      cacheData.timestamp = Date.now();
      cacheData.metadata.exportDate = new Date().toLocaleString('zh-CN');

      // 保存到本地存储
      const jsonString = JSON.stringify(cacheData);
      localStorage.setItem(this.STORAGE_KEY, jsonString);

      console.log(`已更新模型 ${model.name} 的备注: ${note}`);
      return true;
    } catch (error) {
      console.error('更新模型备注失败:', error);
      return false;
    }
  }

  /**
   * 获取模型备注
   */
  static getModelNote(modelId: number): string | null {
    try {
      const cacheData = this.getCacheDataFromStorage();
      if (!cacheData) return null;

      const model = cacheData.models.find(m => m.id === modelId);
      return model?.note || null;
    } catch (error) {
      console.error('获取模型备注失败:', error);
      return null;
    }
  }
}
