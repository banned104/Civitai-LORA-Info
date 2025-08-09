import type { CalendarDay, MonthInfo, CalendarConfig } from './calendar_types';
import type { DailySaveRecord } from './cache_manager';

/**
 * 日历工具类 - 提供日历相关的计算和格式化功能
 */
export class CalendarUtils {
  /**
   * 默认配置
   */
  private static readonly DEFAULT_CONFIG: CalendarConfig = {
    maxTitleDisplay: 6,
    locale: 'zh-CN',
    firstDayOfWeek: 1 // 周一为一周的第一天
  };

  /**
   * 获取月份信息
   */
  static getMonthInfo(year: number, month: number): MonthInfo {
    const date = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfWeek = date.getDay();
    
    return {
      year,
      month,
      monthName: date.toLocaleDateString('zh-CN', { month: 'long' }),
      daysInMonth,
      firstDayOfWeek
    };
  }

  /**
   * 生成日历网格数据
   */
  static generateCalendarGrid(
    year: number, 
    month: number, 
    records: DailySaveRecord[],
    config: Partial<CalendarConfig> = {}
  ): CalendarDay[] {
    const fullConfig = { ...this.DEFAULT_CONFIG, ...config };
    const monthInfo = this.getMonthInfo(year, month);
    const today = new Date().toISOString().split('T')[0];
    const calendar: CalendarDay[] = [];
    
    // 计算日历网格的开始日期（包含上个月的一些天）
    const startDate = new Date(year, month - 1, 1);
    const startDayOffset = (startDate.getDay() - fullConfig.firstDayOfWeek + 7) % 7;
    startDate.setDate(startDate.getDate() - startDayOffset);
    
    // 生成6周的日历网格（42天）
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dateStr = this.formatDate(currentDate);
      const dayRecord = records.find(r => r.date === dateStr);
      const isCurrentMonth = currentDate.getMonth() === month - 1;
      const totalModelCount = dayRecord?.modelTitles.length || 0;
      
      calendar.push({
        date: dateStr,
        day: currentDate.getDate(),
        hasRecord: !!dayRecord,
        modelTitles: dayRecord?.modelTitles.slice(0, fullConfig.maxTitleDisplay) || [],
        totalModelCount: totalModelCount,
        isCurrentMonth,
        isToday: dateStr === today
      });
    }
    
    return calendar;
  }

  /**
   * 格式化日期为 YYYY-MM-DD
   */
  static formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 解析日期字符串
   */
  static parseDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  /**
   * 获取相对月份
   */
  static getRelativeMonth(year: number, month: number, offset: number): { year: number; month: number } {
    const date = new Date(year, month - 1 + offset, 1);
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1
    };
  }

  /**
   * 获取当前年月
   */
  static getCurrentYearMonth(): { year: number; month: number } {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1
    };
  }

  /**
   * 验证年月是否有效
   */
  static isValidYearMonth(year: number, month: number): boolean {
    return year >= 1970 && year <= 3000 && month >= 1 && month <= 12;
  }

  /**
   * 格式化月份显示文本
   */
  static formatMonthDisplay(year: number, month: number): string {
    return `${year}年${month}月`;
  }

  /**
   * 获取周天名称
   */
  static getWeekDayNames(firstDayOfWeek: number = 1): string[] {
    const names = ['日', '一', '二', '三', '四', '五', '六'];
    
    if (firstDayOfWeek === 0) {
      return names; // 周日开始
    } else {
      // 周一开始，调整顺序
      return [...names.slice(1), names[0]];
    }
  }

  /**
   * 计算强度等级（用于颜色显示）
   */
  static getIntensityLevel(recordCount: number): number {
    if (recordCount === 0) return 0;
    if (recordCount === 1) return 1;
    if (recordCount <= 3) return 2;
    if (recordCount <= 6) return 3;
    return 4;
  }
}
