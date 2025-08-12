/**
 * 时间管理系统 - 解决跨天数据叠加问题
 * 
 * 主要功能：
 * 1. 检测日期边界变化
 * 2. 管理每日模型记录
 * 3. 防止跨天数据污染
 * 4. 提供统一的时间操作接口
 */

export interface DayBoundaryEvent {
  previousDate: string;
  currentDate: string;
  timestamp: number;
}

export interface DailySession {
  date: string;
  startTime: number;
  lastActivity: number;
  newModelsCount: number;
  newModelIds: Set<number>;
}

/**
 * 时间管理器类
 */
export class TimeManager {
  private static instance: TimeManager | null = null;
  private currentSession: DailySession | null = null;
  private dayBoundaryCallbacks: ((event: DayBoundaryEvent) => void)[] = [];
  private checkInterval: number | null = null;
  
  // 私有构造函数，实现单例模式
  private constructor() {
    this.initializeSession();
    this.startDateCheck();
  }

  /**
   * 获取时间管理器实例（单例）
   */
  static getInstance(): TimeManager {
    if (!TimeManager.instance) {
      TimeManager.instance = new TimeManager();
    }
    return TimeManager.instance;
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
    const dateObj = new Date(date + 'T00:00:00');
    const today = new Date(this.getCurrentDate() + 'T00:00:00');
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
   * 初始化会话
   */
  private initializeSession(): void {
    const currentDate = TimeManager.getCurrentDate();
    const now = TimeManager.getCurrentTimestamp();
    
    this.currentSession = {
      date: currentDate,
      startTime: now,
      lastActivity: now,
      newModelsCount: 0,
      newModelIds: new Set<number>()
    };

    console.log(`时间管理器已初始化，当前会话日期: ${currentDate}`);
  }

  /**
   * 开始日期检查定时器
   */
  private startDateCheck(): void {
    // 每分钟检查一次日期变化
    this.checkInterval = window.setInterval(() => {
      this.checkDateBoundary();
    }, 60000); // 60秒检查一次

    // 页面可见性变化时也检查
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkDateBoundary();
      }
    });

    // 窗口获得焦点时检查
    window.addEventListener('focus', () => {
      this.checkDateBoundary();
    });
  }

  /**
   * 检查日期边界变化
   */
  private checkDateBoundary(): void {
    if (!this.currentSession) return;

    const currentDate = TimeManager.getCurrentDate();
    const sessionDate = this.currentSession.date;

    if (currentDate !== sessionDate) {
      console.log(`🚨 检测到日期边界变化: ${sessionDate} -> ${currentDate}`);
      
      const event: DayBoundaryEvent = {
        previousDate: sessionDate,
        currentDate: currentDate,
        timestamp: TimeManager.getCurrentTimestamp()
      };

      // 触发日期边界事件
      this.dayBoundaryCallbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('日期边界回调执行失败:', error);
        }
      });

      // 重置会话
      this.resetSession(currentDate);
    }
  }

  /**
   * 重置会话到新日期
   */
  private resetSession(newDate: string): void {
    const now = TimeManager.getCurrentTimestamp();
    
    this.currentSession = {
      date: newDate,
      startTime: now,
      lastActivity: now,
      newModelsCount: 0,
      newModelIds: new Set<number>()
    };

    console.log(`会话已重置到新日期: ${newDate}`);
  }

  /**
   * 添加日期边界变化回调
   */
  onDayBoundaryChanged(callback: (event: DayBoundaryEvent) => void): void {
    this.dayBoundaryCallbacks.push(callback);
  }

  /**
   * 移除日期边界变化回调
   */
  removeDayBoundaryCallback(callback: (event: DayBoundaryEvent) => void): void {
    const index = this.dayBoundaryCallbacks.indexOf(callback);
    if (index > -1) {
      this.dayBoundaryCallbacks.splice(index, 1);
    }
  }

  /**
   * 记录新模型添加
   */
  recordNewModel(modelId: number, modelName: string): void {
    if (!this.currentSession) return;

    // 确保是当天的会话
    const currentDate = TimeManager.getCurrentDate();
    if (this.currentSession.date !== currentDate) {
      this.checkDateBoundary();
    }

    if (this.currentSession && !this.currentSession.newModelIds.has(modelId)) {
      this.currentSession.newModelIds.add(modelId);
      this.currentSession.newModelsCount++;
      this.currentSession.lastActivity = TimeManager.getCurrentTimestamp();
      
      console.log(`✅ 记录新模型到当天会话: ${modelName} (ID: ${modelId})`);
      console.log(`当天新增模型总数: ${this.currentSession.newModelsCount}`);
    } else {
      console.log(`⚠️  模型已存在于当天会话中: ${modelName} (ID: ${modelId})`);
    }
  }

  /**
   * 获取当前会话信息
   */
  getCurrentSession(): DailySession | null {
    // 确保会话是最新的
    if (this.currentSession) {
      const currentDate = TimeManager.getCurrentDate();
      if (this.currentSession.date !== currentDate) {
        this.checkDateBoundary();
      }
    }
    
    return this.currentSession ? { ...this.currentSession } : null;
  }

  /**
   * 获取今天新增的模型ID列表
   */
  getTodayNewModelIds(): number[] {
    const session = this.getCurrentSession();
    return session ? Array.from(session.newModelIds) : [];
  }

  /**
   * 获取今天新增模型数量
   */
  getTodayNewModelsCount(): number {
    const session = this.getCurrentSession();
    return session ? session.newModelsCount : 0;
  }

  /**
   * 检查模型是否是今天新增的
   */
  isModelAddedToday(modelId: number): boolean {
    const session = this.getCurrentSession();
    return session ? session.newModelIds.has(modelId) : false;
  }

  /**
   * 更新活动时间
   */
  updateActivity(): void {
    if (this.currentSession) {
      this.currentSession.lastActivity = TimeManager.getCurrentTimestamp();
    }
  }

  /**
   * 获取会话持续时间（分钟）
   */
  getSessionDuration(): number {
    if (!this.currentSession) return 0;
    
    const now = TimeManager.getCurrentTimestamp();
    const duration = now - this.currentSession.startTime;
    return Math.floor(duration / (1000 * 60)); // 转换为分钟
  }

  /**
   * 销毁时间管理器
   */
  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    this.dayBoundaryCallbacks = [];
    this.currentSession = null;
    TimeManager.instance = null;
    
    console.log('时间管理器已销毁');
  }

  /**
   * 手动强制检查日期边界（用于测试）
   */
  forceCheckDateBoundary(): void {
    this.checkDateBoundary();
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
}

// 导出单例实例的快捷访问方法
export const timeManager = TimeManager.getInstance();

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
} = TimeManager;
