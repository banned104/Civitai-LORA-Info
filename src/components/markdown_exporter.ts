import type { LoraModel, LoraModelVersion } from './lora_api_types';

/**
 * 将 LoRA 模型信息导出为 Markdown 格式
 */
export class MarkdownExporter {
  /**
   * 导出完整的模型信息为 Markdown
   */
  static exportModel(model: LoraModel, selectedVersion?: LoraModelVersion): string {
    const lines: string[] = [];
    
    // 标题
    lines.push(`# ${model.name}`);
    lines.push('');
    
    // 作者信息
    lines.push(`**作者**: ${model.creator.username}`);
    lines.push('');
    
    // 模型 ID
    lines.push(`**模型 ID**: ${model.id}`);
    lines.push('');
    
    // 描述
    if (model.description) {
      lines.push('## 描述');
      lines.push('');
      lines.push(this.cleanHtmlContent(model.description));
      lines.push('');
    }
    
    // 版本信息
    if (model.modelVersions.length > 0) {
      lines.push('## 版本信息');
      lines.push('');
      
      if (selectedVersion) {
        lines.push('### 当前选择版本');
        lines.push('');
        lines.push(...this.formatVersion(selectedVersion));
        lines.push('');
      }
      
      if (model.modelVersions.length > 1) {
        lines.push('### 所有版本');
        lines.push('');
        model.modelVersions.forEach((version, index) => {
          lines.push(`#### ${index + 1}. ${version.name}`);
          lines.push('');
          lines.push(...this.formatVersion(version));
          lines.push('');
        });
      }
    }
    
    return lines.join('\n');
  }
  
  /**
   * 格式化单个版本信息
   */
  private static formatVersion(version: LoraModelVersion): string[] {
    const lines: string[] = [];
    
    lines.push(`**版本名称**: ${version.name}`);
    lines.push(`**创建时间**: ${new Date(version.createdAt).toLocaleString('zh-CN')}`);
    lines.push('');
    
    // 下载文件
    if (version.files.length > 0) {
      lines.push('**下载文件**:');
      lines.push('');
      version.files.forEach(file => {
        lines.push(`- [${file.name}](${file.downloadUrl})`);
      });
      lines.push('');
    }
    
    // 示例图片
    if (version.images.length > 0) {
      lines.push('**示例图片**:');
      lines.push('');
      version.images.forEach((image, index) => {
        lines.push(`![示例图片 ${index + 1}](${image.url})`);
      });
      lines.push('');
    }
    
    return lines;
  }
  
  /**
   * 清理 HTML 内容，转换为纯文本
   */
  private static cleanHtmlContent(html: string): string {
    // 简单的 HTML 标签清理
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<p[^>]*>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<[^>]*>/g, '')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }
  
  /**
   * 下载 Markdown 文件
   */
  static downloadMarkdown(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
  
  /**
   * 复制到剪贴板
   */
  static async copyToClipboard(content: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(content);
      return true;
    } catch (error) {
      console.error('复制到剪贴板失败:', error);
      return false;
    }
  }
}