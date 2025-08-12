/**
 * 图片管理工具类
 * 支持Web和Tauri环境下的图片处理
 */

import type { PromptImage } from './prompt_types';

// 声明Tauri全局类型
declare global {
  interface Window {
    __TAURI__?: any;
  }
}

export class ImageManager {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly SUPPORTED_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp'
  ];

  /**
   * 检查是否在Tauri环境中
   */
  private static isTauriEnv(): boolean {
    return typeof window !== 'undefined' && 
           window.__TAURI__ !== undefined;
  }

  /**
   * 动态导入Tauri模块（避免编译时错误）
   */
  private static async importTauriModule(moduleName: string): Promise<any> {
    try {
      // 使用eval来避免TypeScript编译时检查
      const moduleImport = new Function('moduleName', `
        return import(moduleName).catch(() => null);
      `);
      return await moduleImport(moduleName);
    } catch {
      return null;
    }
  }

  /**
   * 验证文件类型和大小
   */
  private static validateFile(file: File): void {
    if (!this.SUPPORTED_TYPES.includes(file.type)) {
      throw new Error(`不支持的图片格式: ${file.type}。支持的格式: ${this.SUPPORTED_TYPES.join(', ')}`);
    }
    
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`文件过大: ${(file.size / 1024 / 1024).toFixed(2)}MB。最大支持: ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }
  }

  /**
   * 从File对象创建PromptImage
   */
  static async createImageFromFile(file: File): Promise<PromptImage> {
    this.validateFile(file);
    
    const dataUrl = await this.fileToDataUrl(file);
    const imageId = this.generateImageId();
    
    const promptImage: PromptImage = {
      id: imageId,
      name: file.name,
      type: file.type,
      size: file.size,
      dataUrl: dataUrl,
      createdAt: Date.now()
    };

    // 在Tauri环境下保存到本地
    if (this.isTauriEnv()) {
      try {
        const localPath = await this.saveImageToLocal(imageId, dataUrl, file.name);
        promptImage.localPath = localPath;
      } catch (error) {
        console.warn('保存图片到本地失败，使用内存存储:', error);
      }
    }

    return promptImage;
  }

  /**
   * 从剪贴板创建图片
   */
  static async createImageFromClipboard(): Promise<PromptImage | null> {
    try {
      const clipboardItems = await navigator.clipboard.read();
      
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);
            const file = new File([blob], `clipboard_${Date.now()}.${this.getExtensionFromType(type)}`, { type });
            return await this.createImageFromFile(file);
          }
        }
      }
      
      return null;
    } catch (error) {
      console.warn('从剪贴板读取图片失败:', error);
      return null;
    }
  }

  /**
   * 处理拖拽文件
   */
  static async handleDroppedFiles(files: FileList): Promise<PromptImage[]> {
    const images: PromptImage[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        try {
          const image = await this.createImageFromFile(file);
          images.push(image);
        } catch (error) {
          console.error(`处理图片 ${file.name} 失败:`, error);
          throw error;
        }
      }
    }
    
    return images;
  }

  /**
   * 生成缩略图
   */
  static async generateThumbnail(dataUrl: string, maxWidth: number = 200, maxHeight: number = 200): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('无法创建Canvas上下文'));
          return;
        }

        // 计算缩略图尺寸
        const { width, height } = this.calculateThumbnailSize(img.width, img.height, maxWidth, maxHeight);
        
        canvas.width = width;
        canvas.height = height;
        
        // 绘制缩略图
        ctx.drawImage(img, 0, 0, width, height);
        
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = dataUrl;
    });
  }

  /**
   * 计算缩略图尺寸
   */
  private static calculateThumbnailSize(originalWidth: number, originalHeight: number, maxWidth: number, maxHeight: number) {
    let width = originalWidth;
    let height = originalHeight;

    if (width > height) {
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
    } else {
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  /**
   * File转DataURL
   */
  private static fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  /**
   * 生成图片ID
   */
  private static generateImageId(): string {
    return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 根据MIME类型获取文件扩展名
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
   * 在Tauri环境下保存图片到本地
   */
  private static async saveImageToLocal(imageId: string, dataUrl: string, originalName: string): Promise<string> {
    if (!this.isTauriEnv()) {
      throw new Error('不在Tauri环境中');
    }

    try {
      // 动态导入Tauri API，在Web环境下不会执行
      const [pathApi, fsApi] = await Promise.all([
        this.importTauriModule('@tauri-apps/api/path'),
        this.importTauriModule('@tauri-apps/api/fs')
      ]);

      if (!pathApi || !fsApi) {
        throw new Error('Tauri API不可用');
      }

      const { appDataDir, join } = pathApi;
      const { createDir, writeBinaryFile } = fsApi;
      
      // 获取应用数据目录
      const appDir = await appDataDir();
      const userImageDir = await join(appDir, 'user_images');
      
      // 确保目录存在
      await createDir(userImageDir, { recursive: true });
      
      // 生成文件名
      const extension = this.getExtensionFromType(this.getTypeFromDataUrl(dataUrl));
      const fileName = `${imageId}.${extension}`;
      const filePath = await join(userImageDir, fileName);
      
      // 将DataURL转换为二进制数据
      const base64Data = dataUrl.split(',')[1];
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      // 写入文件
      await writeBinaryFile(filePath, binaryData);
      
      console.log(`图片已保存到本地: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error('保存图片到本地失败:', error);
      throw error;
    }
  }

  /**
   * 从DataURL获取MIME类型
   */
  private static getTypeFromDataUrl(dataUrl: string): string {
    const match = dataUrl.match(/^data:([^;]+);base64,/);
    return match ? match[1] : 'image/jpeg';
  }

  /**
   * 删除本地图片文件
   */
  static async deleteLocalImage(localPath?: string): Promise<void> {
    if (!localPath || !this.isTauriEnv()) {
      return;
    }

    try {
      const fsApi = await this.importTauriModule('@tauri-apps/api/fs');
      if (!fsApi) {
        throw new Error('Tauri FS API不可用');
      }
      
      const { removeFile } = fsApi;
      await removeFile(localPath);
      console.log(`本地图片已删除: ${localPath}`);
    } catch (error) {
      console.warn('删除本地图片失败:', error);
    }
  }

  /**
   * 批量删除图片
   */
  static async deleteImages(images: PromptImage[]): Promise<void> {
    for (const image of images) {
      if (image.localPath) {
        await this.deleteLocalImage(image.localPath);
      }
    }
  }

  /**
   * 获取图片显示URL（优先使用本地路径）
   */
  static getImageDisplayUrl(image: PromptImage): string {
    // 在Tauri环境下，如果有本地路径，尝试使用本地路径
    if (this.isTauriEnv() && image.localPath) {
      // Tauri可以直接使用文件路径
      return `asset://localhost/${image.localPath}`;
    }
    
    // 否则使用DataURL
    return image.dataUrl;
  }

  /**
   * 压缩图片（如果需要）
   */
  static async compressImage(dataUrl: string, quality: number = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('无法创建Canvas上下文'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = dataUrl;
    });
  }
}
