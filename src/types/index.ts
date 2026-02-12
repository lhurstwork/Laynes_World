import type React from 'react';

// Core Data Models

export interface Task {
  id: string;
  description: string;
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  category: NewsCategory;
  publishedAt: Date;
  summary: string;
  url: string;
  imageUrl?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  source: CalendarSource;
  description?: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  channelName: string;
  channelId: string;
  thumbnail: string;
  uploadDate: Date;
  url: string;
  type: VideoType;
}

export interface TechDeal {
  id: string;
  productName: string;
  discountPercentage: number;
  originalPrice: number;
  salePrice: number;
  source: string;
  url: string;
  expirationDate: Date;
  status: DealStatus;
  imageUrl?: string;
}

// Enum Types (using const objects for erasableSyntaxOnly compatibility)

export const NewsCategory = {
  BUSINESS: 'business',
  TECHNOLOGY: 'technology',
  ENTERTAINMENT: 'entertainment'
} as const;
export type NewsCategory = typeof NewsCategory[keyof typeof NewsCategory];

export const TaskFilter = {
  ALL: 'all',
  ACTIVE: 'active',
  COMPLETED: 'completed'
} as const;
export type TaskFilter = typeof TaskFilter[keyof typeof TaskFilter];

export const CalendarSource = {
  GOOGLE: 'google',
  OUTLOOK: 'outlook'
} as const;
export type CalendarSource = typeof CalendarSource[keyof typeof CalendarSource];

export const VideoType = {
  NEW_RELEASE: 'new_release',
  RECOMMENDED: 'recommended'
} as const;
export type VideoType = typeof VideoType[keyof typeof VideoType];

export const DealStatus = {
  CURRENT: 'current',
  UPCOMING: 'upcoming',
  EXPIRED: 'expired'
} as const;
export type DealStatus = typeof DealStatus[keyof typeof DealStatus];

export const WidgetType = {
  NEWS: 'news',
  TASKS: 'tasks',
  CALENDAR: 'calendar',
  YOUTUBE: 'youtube',
  DEALS: 'deals'
} as const;
export type WidgetType = typeof WidgetType[keyof typeof WidgetType];

// Component Interfaces

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  isLoading: boolean;
  error: Error | null;
  
  initialize(): Promise<void>;
  refresh(): Promise<void>;
  render(): React.ReactElement;
  handleError(error: Error): void;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  position: number;
  enabled: boolean;
}

export interface DashboardState {
  widgets: WidgetConfig[];
  layout: LayoutConfig;
  isLoading: boolean;
  error: Error | null;
}

export interface LayoutConfig {
  columns: number;
  gap: number;
  breakpoints: Breakpoints;
}

export interface Breakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
}

// Service Interfaces

export interface APIClient {
  get<T>(url: string, config?: RequestConfig): Promise<T>;
  post<T>(url: string, data: any, config?: RequestConfig): Promise<T>;
  handleError(error: Error): void;
  retry(request: () => Promise<any>, maxRetries: number): Promise<any>;
}

export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export interface StorageService {
  save<T>(key: string, value: T): void;
  load<T>(key: string): T | null;
  remove(key: string): void;
  clear(): void;
}

export interface AuthTokenStore {
  saveToken(service: string, token: string): void;
  getToken(service: string): string | null;
  removeToken(service: string): void;
  isTokenValid(service: string): boolean;
}

// Additional Helper Types

export interface DateRange {
  start: Date;
  end: Date;
}
