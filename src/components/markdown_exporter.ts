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
    
    // 用户备注
    if (model.note) {
      lines.push('## 我的备注');
      lines.push('');
      lines.push(model.note);
      if (model.noteTimestamp) {
        lines.push('');
        lines.push(`*备注时间: ${new Date(model.noteTimestamp).toLocaleString('zh-CN')}*`);
      }
      lines.push('');
    }
    
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
    
    // 训练词
    if (version.trainedWords && version.trainedWords.length > 0) {
      lines.push('**训练词 (Trained Words)**:');
      lines.push('');
      version.trainedWords.forEach(word => {
        lines.push(`- \`${word}\``);
      });
      lines.push('');
    }
    
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
        
        // 添加图片的元数据信息
        if (image.meta) {
          const meta = image.meta;
          lines.push('');
          lines.push('*图片参数:*');
          
          if (meta.prompt) {
            lines.push(`- **正面提示词**: ${meta.prompt}`);
          }
          if (meta.negativePrompt) {
            lines.push(`- **负面提示词**: ${meta.negativePrompt}`);
          }
          if (meta.sampler) {
            lines.push(`- **采样器**: ${meta.sampler}`);
          }
          if (meta.steps) {
            lines.push(`- **步数**: ${meta.steps}`);
          }
          if (meta.cfgScale) {
            lines.push(`- **CFG Scale**: ${meta.cfgScale}`);
          }
          if (meta.seed) {
            lines.push(`- **种子**: ${meta.seed}`);
          }
        }
        
        lines.push('');
      });
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

  /**
   * 批量导出多个模型为 ZIP 文件
   */
  static async exportMultipleModels(models: Array<{ model: LoraModel; filename: string; content: string }>): Promise<void> {
    // 如果只有一个模型，直接下载单个文件
    if (models.length === 1) {
      this.downloadMarkdown(models[0].content, models[0].filename);
      return;
    }

    // 动态导入 JSZip
    const JSZip = await import('jszip');
    const zip = new JSZip.default();

    // 创建总览文件
    const indexContent = this.generateIndexMarkdown(models.map(m => ({ 
      name: m.model.name, 
      filename: m.filename,
      id: m.model.id,
      creator: m.model.creator.username
    })));
    
    zip.file('README.md', indexContent);

    // 添加每个模型的 Markdown 文件
    models.forEach(({ content, filename }) => {
      zip.file(`${filename}.md`, content);
    });

    // 生成并下载 ZIP 文件
    try {
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `lora_models_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('生成 ZIP 文件失败:', error);
      alert('导出失败，请检查浏览器是否支持 ZIP 功能');
    }
  }

  /**
   * 生成总览 Markdown 文件
   */
  private static generateIndexMarkdown(models: Array<{ name: string; filename: string; id: number; creator: string }>): string {
    const lines: string[] = [];
    const currentDate = new Date().toLocaleString('zh-CN');
    
    lines.push('# LoRA 模型合集');
    lines.push('');
    lines.push(`**导出时间**: ${currentDate}`);
    lines.push(`**模型数量**: ${models.length}`);
    lines.push('');
    
    lines.push('## 模型列表');
    lines.push('');
    
    models.forEach((model, index) => {
      lines.push(`### ${index + 1}. ${model.name}`);
      lines.push('');
      lines.push(`- **作者**: ${model.creator}`);
      lines.push(`- **模型 ID**: ${model.id}`);
      lines.push(`- **详细信息**: [查看详情](${model.filename}.md)`);
      lines.push('');
    });
    
    lines.push('---');
    lines.push('');
    lines.push('*本文件由 LoRA 信息下载器自动生成*');
    
    return lines.join('\n');
  }
}