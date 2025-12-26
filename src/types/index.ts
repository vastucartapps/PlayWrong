// Type definitions for PlayWrong

import type { Browser, Page } from 'playwright';

export interface BrowserSession {
  id: string;
  browser: Browser;
  page: Page;
  createdAt: Date;
  lastUsedAt: Date;
}

export interface ScreenshotResult {
  imageBase64: string;
  dimensions: {
    width: number;
    height: number;
  };
  timestamp: string;
}

export interface ClickResult {
  success: boolean;
  message: string;
  elementFound: boolean;
}

export interface FillInputResult {
  success: boolean;
  message: string;
  fieldsFilled: number;
}

export interface NavigateResult {
  success: boolean;
  url: string;
  title: string;
  timestamp: string;
}

export interface ConsoleLogsResult {
  logs: Array<{
    type: 'log' | 'error' | 'warn' | 'info';
    message: string;
    timestamp: string;
  }>;
  totalCount: number;
}

export interface PageContentResult {
  html: string;
  text: string;
  title: string;
  url: string;
}

export interface WaitForResult {
  success: boolean;
  message: string;
  elementFound: boolean;
  waitTimeMs: number;
}

export interface MCPToolResponse {
  type: 'text';
  text: string;
}
