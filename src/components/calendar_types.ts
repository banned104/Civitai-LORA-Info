/**
 * Calendar组件相关的类型定义
 */

import type { LoraModel } from './lora_api_types';

/**
 * 日历日期信息
 */
export interface CalendarDay {
  date: string; // YYYY-MM-DD 格式
  day: number; // 月份中的第几天
  hasRecord: boolean; // 是否有保存记录
  modelTitles: string[]; // 该日保存的模型标题（最多显示maxTitleDisplay个）
  totalModelCount: number; // 该日保存的模型总数量
  isCurrentMonth: boolean; // 是否属于当前显示月份
  isToday: boolean; // 是否是今天
}

/**
 * 月份信息
 */
export interface MonthInfo {
  year: number;
  month: number; // 1-12
  monthName: string; // 月份名称
  daysInMonth: number; // 该月天数
  firstDayOfWeek: number; // 月首日是星期几 (0-6)
}

/**
 * 日历视图配置
 */
export interface CalendarConfig {
  maxTitleDisplay: number; // 最多显示的标题数量
  locale: string; // 语言环境
  firstDayOfWeek: number; // 一周的第一天 (0=周日, 1=周一)
}

/**
 * Calendar组件的Props
 */
export interface CalendarProps {
  currentYear?: number;
  currentMonth?: number;
  config?: Partial<CalendarConfig>;
}

/**
 * Calendar组件的Emits
 */
export interface CalendarEmits {
  monthChange: [year: number, month: number];
  dayClick: [date: string, models: LoraModel[]];
  dayContextMenu: [date: string, day: CalendarDay];
  loadDayCache: [date: string];
  clearDayCache: [date: string];
  importJsonToDate: [date: string];
}
