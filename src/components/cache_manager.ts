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
   * 从JSON文件导入模型数据
   */
  static async importFromJson(file: File): Promise<LoraModel[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const jsonString = event.target?.result as string;
          const cacheData: CacheData = JSON.parse(jsonString);
          
          // 验证导入的数据
          if (!this.validateCacheData(cacheData)) {
            reject(new Error('导入的文件格式无效或版本不兼容'));
            return;
          }

          resolve(cacheData.models);
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
   * 记录今日保存的模型
   */
  static recordDailySave(models: LoraModel[]): void {
    if (models.length === 0) return;

    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const existingData = this.getCacheDataFromStorage();
      
      if (!existingData) return;

      // 找到今日的记录或创建新记录
      const todayRecordIndex = existingData.dailyRecords.findIndex(record => record.date === today);
      
      const modelIds = models.map(m => m.id);
      const modelTitles = models.map(m => m.name);
      
      const newRecord: DailySaveRecord = {
        date: today,
        modelIds: modelIds,
        modelTitles: modelTitles,
        timestamp: Date.now()
      };

      if (todayRecordIndex >= 0) {
        // 更新现有记录，合并模型ID和标题
        const existingRecord = existingData.dailyRecords[todayRecordIndex];
        const combinedIds = [...new Set([...existingRecord.modelIds, ...modelIds])];
        const combinedTitles = [...new Set([...existingRecord.modelTitles, ...modelTitles])];
        
        existingData.dailyRecords[todayRecordIndex] = {
          ...newRecord,
          modelIds: combinedIds,
          modelTitles: combinedTitles
        };
      } else {
        // 添加新记录
        existingData.dailyRecords.push(newRecord);
      }

      // 保存更新的数据
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingData));
    } catch (error) {
      console.error('记录每日保存失败:', error);
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
}
