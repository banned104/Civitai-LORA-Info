import type { PromptEntry, DailyPromptRecord, PromptCacheData, PromptImage } from './prompt_types';

/**
 * Prompt缓存管理器 - 负责Prompt数据的缓存、导出和导入
 */
export class PromptCacheManager {
  private static readonly CACHE_VERSION = '1.0.0';
  private static readonly STORAGE_KEY = 'prompt_manager_cache';
  
  /**
   * 将Prompt数据保存到本地存储
   */
  static saveToLocalStorage(prompts: PromptEntry[]): boolean {
    try {
      const cacheData: PromptCacheData = this.createCacheData(prompts);
      const jsonString = JSON.stringify(cacheData);
      localStorage.setItem(this.STORAGE_KEY, jsonString);
      return true;
    } catch (error) {
      console.error('保存Prompt到本地存储失败:', error);
      return false;
    }
  }

  /**
   * 从本地存储加载Prompt数据
   */
  static loadFromLocalStorage(): PromptEntry[] | null {
    try {
      const jsonString = localStorage.getItem(this.STORAGE_KEY);
      if (!jsonString) return null;

      const cacheData: PromptCacheData = JSON.parse(jsonString);
      
      // 验证缓存数据的有效性
      if (!this.validateCacheData(cacheData)) {
        console.warn('Prompt缓存数据无效，已清除');
        this.clearLocalStorage();
        return null;
      }

      return cacheData.prompts;
    } catch (error) {
      console.error('从本地存储加载Prompt失败:', error);
      this.clearLocalStorage();
      return null;
    }
  }

  /**
   * 清除本地存储
   */
  static clearLocalStorage(): boolean {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('清除Prompt本地存储失败:', error);
      return false;
    }
  }

  /**
   * 创建缓存数据结构
   */
  private static createCacheData(prompts: PromptEntry[]): PromptCacheData {
    const existingData = this.getCacheDataFromStorage();
    const dailyRecords = existingData?.dailyRecords || [];

    return {
      version: this.CACHE_VERSION,
      timestamp: Date.now(),
      prompts: prompts,
      dailyRecords: dailyRecords,
      metadata: {
        exportDate: new Date().toLocaleString('zh-CN'),
        totalPrompts: prompts.length,
        appVersion: this.CACHE_VERSION
      }
    };
  }

  /**
   * 获取原始缓存数据
   */
  private static getCacheDataFromStorage(): PromptCacheData | null {
    try {
      const jsonString = localStorage.getItem(this.STORAGE_KEY);
      if (!jsonString) return null;
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('获取Prompt缓存数据失败:', error);
      return null;
    }
  }

  /**
   * 验证缓存数据有效性
   */
  private static validateCacheData(data: any): data is PromptCacheData {
    return data && 
           typeof data === 'object' &&
           typeof data.version === 'string' &&
           typeof data.timestamp === 'number' &&
           Array.isArray(data.prompts) &&
           Array.isArray(data.dailyRecords);
  }

  /**
   * 记录今日的Prompt保存
   */
  static recordDailySave(prompts: PromptEntry[]): boolean {
    try {
      const today = new Date().toISOString().split('T')[0];
      const cacheData = this.getCacheDataFromStorage();
      
      if (!cacheData) {
        console.warn('无法获取缓存数据进行日期记录');
        return false;
      }

      // 检查今天是否已有记录
      let todayRecord = cacheData.dailyRecords.find(record => record.date === today);
      
      if (todayRecord) {
        // 更新今日记录
        todayRecord.promptIds = prompts.map(p => p.id);
        todayRecord.promptTitles = prompts.map(p => p.title || '无标题');
        todayRecord.timestamp = Date.now();
      } else {
        // 创建新的今日记录
        todayRecord = {
          date: today,
          promptIds: prompts.map(p => p.id),
          promptTitles: prompts.map(p => p.title || '无标题'),
          timestamp: Date.now()
        };
        cacheData.dailyRecords.push(todayRecord);
      }

      // 更新缓存
      cacheData.prompts = prompts;
      cacheData.timestamp = Date.now();
      cacheData.metadata.totalPrompts = prompts.length;
      cacheData.metadata.exportDate = new Date().toLocaleString('zh-CN');

      const jsonString = JSON.stringify(cacheData);
      localStorage.setItem(this.STORAGE_KEY, jsonString);
      
      console.log(`已记录 ${today} 的 ${prompts.length} 个Prompt`);
      return true;
    } catch (error) {
      console.error('记录每日Prompt保存失败:', error);
      return false;
    }
  }

  /**
   * 获取所有日期记录
   */
  static getDailyRecords(): DailyPromptRecord[] {
    try {
      const cacheData = this.getCacheDataFromStorage();
      return cacheData?.dailyRecords || [];
    } catch (error) {
      console.error('获取每日Prompt记录失败:', error);
      return [];
    }
  }

  /**
   * 获取指定日期的Prompt
   */
  static getPromptsForDate(date: string): PromptEntry[] {
    try {
      const cacheData = this.getCacheDataFromStorage();
      if (!cacheData) return [];

      const dateRecord = cacheData.dailyRecords.find(record => record.date === date);
      if (!dateRecord) return [];

      // 根据ID查找对应的Prompt
      const prompts = dateRecord.promptIds.map(id => 
        cacheData.prompts.find(prompt => prompt.id === id)
      ).filter(prompt => prompt !== undefined) as PromptEntry[];

      return prompts;
    } catch (error) {
      console.error('获取指定日期Prompt失败:', error);
      return [];
    }
  }

  /**
   * 获取所有历史Prompt数据
   */
  static getAllHistoricalPrompts(): PromptEntry[] {
    try {
      const cacheData = this.getCacheDataFromStorage();
      return cacheData?.prompts || [];
    } catch (error) {
      console.error('获取所有历史Prompt失败:', error);
      return [];
    }
  }

  /**
   * 搜索Prompt
   */
  static searchPrompts(query: string): PromptEntry[] {
    try {
      const prompts = this.getAllHistoricalPrompts();
      console.log(`执行Prompt搜索: 在 ${prompts.length} 个Prompt中搜索关键词 "${query}"`);
      
      if (!prompts || prompts.length === 0) {
        console.log('搜索中止: 没有可搜索的Prompt');
        return [];
      }

      if (!query || query.trim() === '') {
        console.log('搜索中止: 搜索关键词为空，返回所有Prompt');
        return prompts;
      }

      const searchTerm = query.toLowerCase().trim();
      
      const results = prompts.filter(prompt => {
        // 搜索标题
        if (prompt.title?.toLowerCase().includes(searchTerm)) {
          return true;
        }

        // 搜索Prompt内容
        if (prompt.prompt?.toLowerCase().includes(searchTerm)) {
          return true;
        }

        return false;
      });
      
      console.log(`搜索完成: 关键词 "${query}" 找到 ${results.length} 个匹配的Prompt`);
      
      return results;
    } catch (error) {
      console.error('搜索Prompt失败:', error);
      return [];
    }
  }

  /**
   * 添加新的Prompt
   */
  static addPrompt(title: string, prompt: string, images?: PromptImage[]): PromptEntry {
    const newPrompt: PromptEntry = {
      id: this.generateId(),
      title: title.trim() || undefined,
      prompt: prompt.trim(),
      images: images && images.length > 0 ? [...images] : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const existingPrompts = this.loadFromLocalStorage() || [];
    existingPrompts.unshift(newPrompt);
    
    this.saveToLocalStorage(existingPrompts);
    this.recordDailySave(existingPrompts);

    return newPrompt;
  }

  /**
   * 删除Prompt
   */
  static deletePrompt(id: string): boolean {
    try {
      const existingPrompts = this.loadFromLocalStorage() || [];
      const filteredPrompts = existingPrompts.filter(prompt => prompt.id !== id);
      
      if (filteredPrompts.length === existingPrompts.length) {
        console.warn(`未找到ID为 ${id} 的Prompt`);
        return false;
      }

      this.saveToLocalStorage(filteredPrompts);
      this.recordDailySave(filteredPrompts);
      
      console.log(`已删除Prompt: ${id}`);
      return true;
    } catch (error) {
      console.error('删除Prompt失败:', error);
      return false;
    }
  }

  /**
   * 更新Prompt
   */
  static updatePrompt(id: string, title: string, prompt: string): boolean {
    try {
      const existingPrompts = this.loadFromLocalStorage() || [];
      const targetPrompt = existingPrompts.find(p => p.id === id);
      
      if (!targetPrompt) {
        console.error(`未找到ID为 ${id} 的Prompt`);
        return false;
      }

      targetPrompt.title = title.trim() || undefined;
      targetPrompt.prompt = prompt.trim();
      targetPrompt.updatedAt = Date.now();

      this.saveToLocalStorage(existingPrompts);
      this.recordDailySave(existingPrompts);
      
      console.log(`已更新Prompt: ${id}`);
      return true;
    } catch (error) {
      console.error('更新Prompt失败:', error);
      return false;
    }
  }

  /**
   * 生成唯一ID
   */
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
