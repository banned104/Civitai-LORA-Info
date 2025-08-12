/**
 * ZIP导出管理器 - 处理带图片的Prompt数据导出和导入
 */

import JSZip from 'jszip';
import type { PromptEntry, PromptImage } from './prompt_types';

export class ZipExportManager {
  /**
   * 导出Prompt数据为ZIP文件
   */
  static async exportToZip(prompts: PromptEntry[], filename: string = 'prompts_with_images'): Promise<void> {
    try {
      const zip = new JSZip();
      
      // 创建图片文件夹
      const imagesFolder = zip.folder('images');
      if (!imagesFolder) {
        throw new Error('无法创建图片文件夹');
      }
      
      // 处理Prompt数据，分离图片
      const exportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        prompts: [] as any[]
      };
      
      for (const prompt of prompts) {
        const exportPrompt: any = {
          id: prompt.id,
          title: prompt.title,
          prompt: prompt.prompt,
          createdAt: prompt.createdAt,
          updatedAt: prompt.updatedAt,
          images: []
        };
        
        // 处理图片
        if (prompt.images && prompt.images.length > 0) {
          for (const image of prompt.images) {
            const imageFilename = `${image.id}.${this.getExtensionFromType(image.type)}`;
            
            // 将DataURL转换为二进制数据并添加到ZIP
            const base64Data = image.dataUrl.split(',')[1];
            imagesFolder.file(imageFilename, base64Data, { base64: true });
            
            // 在导出数据中记录图片信息（不包含DataURL）
            exportPrompt.images.push({
              id: image.id,
              name: image.name,
              type: image.type,
              size: image.size,
              filename: imageFilename,
              createdAt: image.createdAt
            });
          }
        }
        
        exportData.prompts.push(exportPrompt);
      }
      
      // 添加JSON数据文件
      zip.file('prompts.json', JSON.stringify(exportData, null, 2));
      
      // 生成ZIP文件并下载
      const content = await zip.generateAsync({ type: 'blob' });
      this.downloadBlob(content, `${filename}.zip`);
      
      console.log(`成功导出 ${prompts.length} 个Prompt到ZIP文件`);
    } catch (error) {
      console.error('导出ZIP文件失败:', error);
      throw new Error(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  /**
   * 从ZIP文件导入Prompt数据
   */
  static async importFromZip(file: File): Promise<PromptEntry[]> {
    try {
      console.log('开始导入ZIP文件:', file.name);
      
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);
      
      // 读取JSON数据文件
      const jsonFile = zipContent.file('prompts.json');
      if (!jsonFile) {
        throw new Error('ZIP文件中未找到prompts.json文件');
      }
      
      const jsonContent = await jsonFile.async('text');
      const importData = JSON.parse(jsonContent);
      
      if (!importData.prompts || !Array.isArray(importData.prompts)) {
        throw new Error('无效的数据格式');
      }
      
      console.log(`找到 ${importData.prompts.length} 个Prompt`);
      
      // 处理每个Prompt
      const importedPrompts: PromptEntry[] = [];
      
      for (const promptData of importData.prompts) {
        const prompt: PromptEntry = {
          id: this.generateNewId(), // 生成新ID避免冲突
          title: promptData.title,
          prompt: promptData.prompt,
          createdAt: Date.now(), // 使用当前时间
          updatedAt: Date.now()
        };
        
        // 处理图片
        if (promptData.images && promptData.images.length > 0) {
          const images: PromptImage[] = [];
          
          for (const imageInfo of promptData.images) {
            try {
              // 从ZIP中读取图片文件
              const imageFile = zipContent.file(`images/${imageInfo.filename}`);
              if (!imageFile) {
                console.warn(`图片文件未找到: ${imageInfo.filename}`);
                continue;
              }
              
              const imageData = await imageFile.async('base64');
              const dataUrl = `data:${imageInfo.type};base64,${imageData}`;
              
              const image: PromptImage = {
                id: this.generateNewId(), // 生成新的图片ID
                name: imageInfo.name,
                type: imageInfo.type,
                size: imageInfo.size,
                dataUrl: dataUrl,
                createdAt: Date.now()
              };
              
              images.push(image);
            } catch (error) {
              console.warn(`处理图片 ${imageInfo.filename} 失败:`, error);
            }
          }
          
          if (images.length > 0) {
            prompt.images = images;
          }
        }
        
        importedPrompts.push(prompt);
      }
      
      console.log(`成功导入 ${importedPrompts.length} 个Prompt`);
      return importedPrompts;
    } catch (error) {
      console.error('导入ZIP文件失败:', error);
      throw new Error(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  /**
   * 验证ZIP文件格式
   */
  static async validateZipFile(file: File): Promise<boolean> {
    try {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);
      
      // 检查是否有必要的文件
      const hasJsonFile = zipContent.file('prompts.json') !== null;
      const hasImagesFolder = zipContent.folder('images') !== null;
      
      return hasJsonFile;
    } catch (error) {
      console.warn('验证ZIP文件失败:', error);
      return false;
    }
  }
  
  /**
   * 获取文件扩展名
   */
  private static getExtensionFromType(type: string): string {
    const typeMap: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/bmp': 'bmp'
    };
    return typeMap[type] || 'jpg';
  }
  
  /**
   * 生成新ID
   */
  private static generateNewId(): string {
    return `imp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * 下载文件
   */
  private static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
