import type { LoraModel } from './lora_api_types';
import type { DailySaveRecord } from './cache_manager';
import { CacheManager } from './cache_manager';

// 翻译辅助类型
type TranslationFunction = (key: string, params?: Record<string, string>) => string;

// 静态翻译映射 - 用于export_manager中的字符串国际化
const translations = {
  zh: {
    statisticsTitle: '📊 统计信息',
    averagePerDay: '平均每天保存',
    modelsUnit: '个模型',
    maxPerDay: '单日最多保存',
    minPerDay: '单日最少保存',
    topAuthors: '👤 热门作者 (Top 10)',
    authorHeader: '作者',
    modelCountHeader: '模型数量',
    fileDescription: '📁 文件说明',
    zipContents: '本ZIP包含以下文件:',
    summaryFile: '本汇总文件',
    detailedModelInfo: '的详细模型信息'
  },
  en: {
    statisticsTitle: '📊 Statistics',
    averagePerDay: 'Average saved per day',
    modelsUnit: 'models',
    maxPerDay: 'Maximum saved in a day',
    minPerDay: 'Minimum saved in a day',
    topAuthors: '👤 Top Authors (Top 10)',
    authorHeader: 'Author',
    modelCountHeader: 'Model Count',
    fileDescription: '📁 File Description',
    zipContents: 'This ZIP contains the following files:',
    summaryFile: 'This summary file',
    detailedModelInfo: 'detailed model information'
  }
};

// 简单的翻译函数
function getTranslation(key: string, language: 'zh' | 'en' = 'zh'): string {
  return translations[language][key as keyof typeof translations.zh] || key;
}

/**
 * 导出类型枚举
 */
export enum ExportType {
  CURRENT_MODELS = 'current_models',
  ALL_CACHE = 'all_cache', 
  DAILY_JSON = 'daily_json',
  DAILY_MARKDOWN = 'daily_markdown'
}

/**
 * 导出配置接口
 */
export interface ExportConfig {
  type: ExportType;
  filename?: string;
  includeMetadata?: boolean;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

/**
 * 导出结果接口
 */
export interface ExportResult {
  success: boolean;
  message: string;
  filename?: string;
  fileCount?: number;
}

/**
 * 导出管理器 - 统一管理各种导出功能
 */
export class ExportManager {
  
  /**
   * 统一导出入口
   */
  static async export(models: LoraModel[], config: ExportConfig): Promise<ExportResult> {
    try {
      switch (config.type) {
        case ExportType.CURRENT_MODELS:
          return await this.exportCurrentModels(models, config);
        
        case ExportType.ALL_CACHE:
          return await this.exportAllCache(config);
        
        case ExportType.DAILY_JSON:
          return await this.exportDailyJson(config);
        
        case ExportType.DAILY_MARKDOWN:
          return await this.exportDailyMarkdown(config);
        
        default:
          throw new Error(`不支持的导出类型: ${config.type}`);
      }
    } catch (error) {
      console.error('导出失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '导出过程中发生未知错误'
      };
    }
  }

  /**
   * 导出当前显示的模型
   */
  private static async exportCurrentModels(models: LoraModel[], config: ExportConfig): Promise<ExportResult> {
    if (models.length === 0) {
      throw new Error('没有模型可以导出');
    }

    const filename = config.filename || `current_models_${new Date().toISOString().split('T')[0]}.json`;
    CacheManager.exportToJson(models, filename);
    
    return {
      success: true,
      message: `成功导出 ${models.length} 个当前显示的模型`,
      filename,
      fileCount: 1
    };
  }

  /**
   * 导出所有缓存数据
   */
  private static async exportAllCache(config: ExportConfig): Promise<ExportResult> {
    const allModels = CacheManager.loadFromLocalStorage();
    if (!allModels || allModels.length === 0) {
      throw new Error('缓存中没有模型数据');
    }

    const filename = config.filename || `all_cache_${new Date().toISOString().split('T')[0]}.json`;
    CacheManager.exportToJson(allModels, filename);
    
    return {
      success: true,
      message: `成功导出缓存中的 ${allModels.length} 个模型`,
      filename,
      fileCount: 1
    };
  }

  /**
   * 按日期导出JSON文件
   */
  private static async exportDailyJson(config: ExportConfig): Promise<ExportResult> {
    let dailyRecords = CacheManager.getDailyRecords();
    
    // 如果指定了日期范围，进行过滤
    if (config.dateRange) {
      dailyRecords = this.filterRecordsByDateRange(dailyRecords, config.dateRange);
    }
    
    if (dailyRecords.length === 0) {
      throw new Error('指定时间范围内没有找到任何记录');
    }

    const filename = config.filename || `daily_models_${new Date().toISOString().split('T')[0]}.zip`;
    await CacheManager.exportDailyJsonAsZip(filename);
    
    return {
      success: true,
      message: `成功导出 ${dailyRecords.length} 天的记录为ZIP文件`,
      filename,
      fileCount: dailyRecords.length + 2 // 每日文件 + summary.json + README.md
    };
  }

  /**
   * 按日期导出Markdown文件
   */
  private static async exportDailyMarkdown(config: ExportConfig): Promise<ExportResult> {
    let dailyRecords = CacheManager.getDailyRecords();
    
    if (config.dateRange) {
      dailyRecords = this.filterRecordsByDateRange(dailyRecords, config.dateRange);
    }
    
    if (dailyRecords.length === 0) {
      throw new Error('指定时间范围内没有找到任何记录');
    }

    const filename = config.filename || `daily_markdown_${new Date().toISOString().split('T')[0]}.zip`;
    await this.exportDailyMarkdownAsZip(dailyRecords, filename, 'zh'); // 暂时默认使用中文
    
    return {
      success: true,
      message: `成功导出 ${dailyRecords.length} 天的Markdown记录`,
      filename,
      fileCount: dailyRecords.length + 1 // 每日Markdown + 汇总文件
    };
  }

  /**
   * 按日期范围过滤记录
   */
  private static filterRecordsByDateRange(
    records: DailySaveRecord[], 
    dateRange: { startDate: string; endDate: string }
  ): DailySaveRecord[] {
    const { startDate, endDate } = dateRange;
    return records.filter(record => 
      record.date >= startDate && record.date <= endDate
    );
  }

  /**
   * 导出按日期分组的Markdown文件为ZIP
   */
  private static async exportDailyMarkdownAsZip(dailyRecords: DailySaveRecord[], filename: string, language: 'zh' | 'en' = 'zh'): Promise<void> {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const allModels = CacheManager.loadFromLocalStorage() || [];
      
      // 按日期生成Markdown文件
      for (const record of dailyRecords) {
        const dayModels = allModels.filter(model => record.modelIds.includes(model.id));
        
        if (dayModels.length > 0) {
          const markdownContent = this.generateDayMarkdown(record, dayModels);
          const fileName = `models_${record.date}.md`;
          zip.file(fileName, markdownContent);
        }
      }

      // 生成汇总Markdown
      const summaryMarkdown = this.generateSummaryMarkdown(dailyRecords, allModels, language);
      zip.file('summary.md', summaryMarkdown);

      // 生成并下载ZIP
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('导出Markdown ZIP失败:', error);
      throw new Error('导出Markdown失败，请重试');
    }
  }

  /**
   * 生成单日Markdown内容
   */
  private static generateDayMarkdown(record: DailySaveRecord, models: LoraModel[]): string {
    const date = new Date(record.date);
    const formattedDate = date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    });

    let markdown = `# ${formattedDate} 保存的模型\n\n`;
    markdown += `**保存时间**: ${new Date(record.timestamp).toLocaleString('zh-CN')}\n`;
    markdown += `**模型数量**: ${models.length} 个\n\n`;
    markdown += `---\n\n`;

    models.forEach((model, index) => {
      markdown += `## ${index + 1}. ${model.name}\n\n`;
      markdown += `- **作者**: ${model.creator.username}\n`;
      markdown += `- **模型ID**: ${model.id}\n`;
      
      if (model.description) {
        markdown += `- **描述**: ${model.description}\n`;
      }
      
      if (model.tags && model.tags.length > 0) {
        markdown += `- **标签**: ${model.tags.join(', ')}\n`;
      }

      // 添加版本信息
      if (model.modelVersions && model.modelVersions.length > 0) {
        markdown += `- **版本数量**: ${model.modelVersions.length} 个\n`;
        
        model.modelVersions.forEach((version, vIndex) => {
          markdown += `\n### 版本 ${vIndex + 1}: ${version.name}\n`;
          
          if (version.trainedWords && version.trainedWords.length > 0) {
            markdown += `**训练词**: ${version.trainedWords.join(', ')}\n\n`;
          }
          
          if (version.files && version.files.length > 0) {
            markdown += `**下载文件**:\n`;
            version.files.forEach(file => {
              markdown += `- [${file.name}](${file.downloadUrl})\n`;
            });
            markdown += `\n`;
          }
        });
      }
      
      markdown += `\n---\n\n`;
    });

    markdown += `\n*导出时间: ${new Date().toLocaleString('zh-CN')}*\n`;
    
    return markdown;
  }

  /**
   * 生成汇总Markdown内容
   */
  private static generateSummaryMarkdown(dailyRecords: DailySaveRecord[], allModels: LoraModel[], language: 'zh' | 'en' = 'zh'): string {
    const exportDate = new Date().toLocaleString('zh-CN');
    
    let markdown = `# LORA模型保存汇总报告\n\n`;
    markdown += `**导出时间**: ${exportDate}\n`;
    markdown += `**记录天数**: ${dailyRecords.length} 天\n`;
    markdown += `**模型总数**: ${allModels.length} 个\n\n`;
    markdown += `---\n\n`;

    // 按日期统计
    markdown += `## 📅 按日期统计\n\n`;
    markdown += `| 日期 | 模型数量 | 保存时间 |\n`;
    markdown += `|------|----------|----------|\n`;
    
    dailyRecords
      .sort((a, b) => b.date.localeCompare(a.date)) // 按日期倒序
      .forEach(record => {
        const saveTime = new Date(record.timestamp).toLocaleString('zh-CN');
        markdown += `| ${record.date} | ${record.modelIds.length} | ${saveTime} |\n`;
      });

    markdown += `\n## ${getTranslation('statisticsTitle', language)}\n\n`;
    
    // 计算一些统计信息
    const totalDays = dailyRecords.length;
    const avgModelsPerDay = totalDays > 0 ? (allModels.length / totalDays).toFixed(1) : '0';
    const maxModelsInDay = Math.max(...dailyRecords.map(r => r.modelIds.length));
    const minModelsInDay = Math.min(...dailyRecords.map(r => r.modelIds.length));
    
    markdown += `- **${getTranslation('averagePerDay', language)}**: ${avgModelsPerDay} ${getTranslation('modelsUnit', language)}\n`;
    markdown += `- **${getTranslation('maxPerDay', language)}**: ${maxModelsInDay} ${getTranslation('modelsUnit', language)}\n`;
    markdown += `- **${getTranslation('minPerDay', language)}**: ${minModelsInDay} ${getTranslation('modelsUnit', language)}\n\n`;

    // 作者统计
    const authorStats = new Map<string, number>();
    allModels.forEach(model => {
      const author = model.creator.username;
      authorStats.set(author, (authorStats.get(author) || 0) + 1);
    });

    const topAuthors = Array.from(authorStats.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (topAuthors.length > 0) {
      markdown += `## ${getTranslation('topAuthors', language)}\n\n`;
      markdown += `| ${getTranslation('authorHeader', language)} | ${getTranslation('modelCountHeader', language)} |\n`;
      markdown += `|------|----------|\n`;
      topAuthors.forEach(([author, count]) => {
        markdown += `| ${author} | ${count} |\n`;
      });
      markdown += `\n`;
    }

    markdown += `## ${getTranslation('fileDescription', language)}\n\n`;
    markdown += `${getTranslation('zipContents', language)}\n\n`;
    dailyRecords.forEach(record => {
      markdown += `- \`models_${record.date}.md\` - ${record.date} ${getTranslation('detailedModelInfo', language)}\n`;
    });
    markdown += `- \`summary.md\` - ${getTranslation('summaryFile', language)}\n\n`;

    markdown += `---\n\n`;
    markdown += `*由 LORA Info Downloader 自动生成于 ${exportDate}*\n`;
    
    return markdown;
  }

  /**
   * 获取支持的导出类型列表
   */
  static getSupportedExportTypes(): Array<{type: ExportType, name: string, description: string}> {
    return [
      {
        type: ExportType.CURRENT_MODELS,
        name: '当前模型',
        description: '导出当前显示的模型为单个JSON文件'
      },
      {
        type: ExportType.ALL_CACHE,
        name: '全部缓存',
        description: '导出所有缓存的模型为单个JSON文件'
      },
      {
        type: ExportType.DAILY_JSON,
        name: '按日期分组JSON',
        description: '按保存日期分组导出为多个JSON文件，打包为ZIP'
      },
      {
        type: ExportType.DAILY_MARKDOWN,
        name: '按日期分组Markdown', 
        description: '按保存日期分组导出为多个Markdown文件，打包为ZIP'
      }
    ];
  }
}
