/**
 * 简化的时间管理系统 - 专注于跨天刷新机制
 * 
 * 主要功能：
 * 1. 检测日期变化并触发跨天刷新
 * 2. 提供日期工具函数
 * 3. 非侵入式的定时检查
 * 4. 简单可靠的跨天处理
 */

export interface DateChangeEvent {
  previousDate: string;
  currentDate: string;
  timestamp: number;
}

/**
 * 简化的时间管理器类
 */
export class SimpleTimeManager {
  private static instance: SimpleTimeManager | null = null;
  private currentDate: string;
  private dateChangeCallbacks: ((event: DateChangeEvent) => void)[] = [];
  private checkTimer: number | null = null;
  private isDestroyed: boolean = false;
  
  // 私有构造函数，实现单例模式
  private constructor() {
    this.currentDate = SimpleTimeManager.getCurrentDate();
    this.startDateMonitoring();
    console.log(`📅 时间管理器已启动，当前日期: ${this.currentDate}`);
  }

  /**
   * 获取时间管理器实例（单例）
   */
  static getInstance(): SimpleTimeManager {
    if (!SimpleTimeManager.instance) {
      SimpleTimeManager.instance = new SimpleTimeManager();
    }
    return SimpleTimeManager.instance;
  }

  /**
   * 获取当前日期字符串 (YYYY-MM-DD)
   */
  static getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * 获取当前时间戳
   */
  static getCurrentTimestamp(): number {
    return Date.now();
  }

  /**
   * 检查是否为今天
   */
  static isToday(date: string): boolean {
    return date === this.getCurrentDate();
  }

  /**
   * 检查日期是否在指定天数范围内
   */
  static isWithinDays(date: string, days: number): boolean {
    const targetDate = new Date(date + 'T00:00:00');
    const today = new Date(this.getCurrentDate() + 'T00:00:00');
    const diffTime = today.getTime() - targetDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= days;
  }

  /**
   * 计算两个日期之间的天数差
   */
  static getDaysDifference(date1: string, date2: string): number {
    const d1 = new Date(date1 + 'T00:00:00');
    const d2 = new Date(date2 + 'T00:00:00');
    const diffTime = d2.getTime() - d1.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * 格式化日期显示
   */
  static formatDateDisplay(date: string): string {
    const diffDays = this.getDaysDifference(date, this.getCurrentDate());

    if (diffDays === 0) {
      return `${date} (今天)`;
    } else if (diffDays === -1) {
      return `${date} (昨天)`;
    } else if (diffDays === 1) {
      return `${date} (明天)`;
    } else if (diffDays > 0 && diffDays <= 7) {
      return `${date} (${diffDays}天后)`;
    } else if (diffDays < 0 && diffDays >= -7) {
      return `${date} (${Math.abs(diffDays)}天前)`;
    }
    
    return date;
  }

  /**
   * 获取本地化的时间字符串
   */
  static getLocalizedTimeString(timestamp: number): string {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * 获取本地化的日期字符串
   */
  static getLocalizedDateString(date: string): string {
    const dateObj = new Date(date + 'T00:00:00');
    return dateObj.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  }

  /**
   * 开始日期监控
   */
  private startDateMonitoring(): void {
    // 每30秒检查一次日期变化
    this.checkTimer = window.setInterval(() => {
      if (!this.isDestroyed) {
        this.checkDateChange();
      }
    }, 30000); // 30秒检查一次，比之前更频繁但不会过载

    // 页面可见性变化时立即检查
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !this.isDestroyed) {
        this.checkDateChange();
      }
    });

    // 窗口获得焦点时立即检查
    window.addEventListener('focus', () => {
      if (!this.isDestroyed) {
        this.checkDateChange();
      }
    });

    console.log('📅 日期监控已启动 (30秒检查间隔)');
  }

  /**
   * 检查日期变化
   */
  private checkDateChange(): void {
    const newDate = SimpleTimeManager.getCurrentDate();
    
    if (newDate !== this.currentDate) {
      const previousDate = this.currentDate;
      this.currentDate = newDate;
      
      console.log(`🚨 检测到日期变化: ${previousDate} -> ${newDate}`);
      
      const event: DateChangeEvent = {
        previousDate: previousDate,
        currentDate: newDate,
        timestamp: SimpleTimeManager.getCurrentTimestamp()
      };

      // 触发所有注册的回调
      this.dateChangeCallbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('日期变化回调执行失败:', error);
        }
      });
    }
  }

  /**
   * 添加日期变化回调
   */
  onDateChanged(callback: (event: DateChangeEvent) => void): void {
    this.dateChangeCallbacks.push(callback);
    console.log(`📋 已添加日期变化回调，总计: ${this.dateChangeCallbacks.length}`);
  }

  /**
   * 移除日期变化回调
   */
  removeDateChangedCallback(callback: (event: DateChangeEvent) => void): void {
    const index = this.dateChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this.dateChangeCallbacks.splice(index, 1);
      console.log(`🗑️  已移除日期变化回调，剩余: ${this.dateChangeCallbacks.length}`);
    }
  }

  /**
   * 获取当前日期
   */
  getCurrentDateString(): string {
    return this.currentDate;
  }

  /**
   * 手动触发日期检查（用于测试）
   */
  forceCheckDate(): void {
    this.checkDateChange();
  }

  /**
   * 销毁时间管理器
   */
  destroy(): void {
    this.isDestroyed = true;
    
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
    
    this.dateChangeCallbacks = [];
    SimpleTimeManager.instance = null;
    
    console.log('🔥 时间管理器已销毁');
  }
}

// 导出单例实例的快捷访问方法
export const simpleTimeManager = SimpleTimeManager.getInstance();

// 导出常用的静态方法
export const {
  getCurrentDate,
  getCurrentTimestamp,
  isToday,
  isWithinDays,
  getDaysDifference,
  formatDateDisplay,
  getLocalizedTimeString,
  getLocalizedDateString
} = SimpleTimeManager;
