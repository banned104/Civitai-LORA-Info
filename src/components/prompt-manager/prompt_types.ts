/**
 * 图片信息接口
 */
export interface PromptImage {
  id: string; // 图片唯一标识
  name: string; // 原始文件名
  type: string; // MIME类型 (image/jpeg, image/png, etc.)
  size: number; // 文件大小（字节）
  dataUrl: string; // base64数据URL
  localPath?: string; // Tauri环境下的本地路径
  thumbnail?: string; // 缩略图（可选）
  createdAt: number; // 添加时间
}

/**
 * Prompt条目接口
 */
export interface PromptEntry {
  id: string;
  title?: string; // 可选的标题/注释
  prompt: string; // 主要的Prompt内容
  images?: PromptImage[]; // 关联的图片
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
