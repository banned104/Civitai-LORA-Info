/**
 * Prompt条目接口
 */
export interface PromptEntry {
  id: string;
  title?: string; // 可选的标题/注释
  prompt: string; // 主要的Prompt内容
  createdAt: number; // 创建时间戳
  updatedAt: number; // 更新时间戳
}

/**
 * 每日Prompt记录
 */
export interface DailyPromptRecord {
  date: string; // YYYY-MM-DD 格式
  promptIds: string[];
  promptTitles: string[];
  timestamp: number;
}

/**
 * Prompt缓存数据结构
 */
export interface PromptCacheData {
  version: string;
  timestamp: number;
  prompts: PromptEntry[];
  dailyRecords: DailyPromptRecord[];
  metadata: {
    exportDate: string;
    totalPrompts: number;
    appVersion: string;
  };
}
