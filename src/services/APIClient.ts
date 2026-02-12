import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { config } from '../config/environment';

export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export interface APIClient {
  get<T>(url: string, config?: RequestConfig): Promise<T>;
  post<T>(url: string, data: any, config?: RequestConfig): Promise<T>;
}

export class BaseAPIClient implements APIClient {
  private axiosInstance: AxiosInstance;
  private defaultTimeout: number;

  constructor(baseURL?: string, timeout?: number) {
    this.defaultTimeout = timeout || config.apiTimeout;
    this.axiosInstance = axios.create({
      baseURL: baseURL || '',
      timeout: this.defaultTimeout,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add timestamp to track request duration
        config.headers.set('X-Request-Start-Time', Date.now().toString());
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log successful response
        const startTime = response.config.headers.get('X-Request-Start-Time');
        if (startTime) {
          const duration = Date.now() - parseInt(startTime as string, 10);
          console.log(`Request to ${response.config.url} completed in ${duration}ms`);
        }
        return response;
      },
      (error) => {
        // Log error response
        if (error.response) {
          console.error(`API Error: ${error.response.status} - ${error.response.statusText}`);
        } else if (error.request) {
          console.error('API Error: No response received');
        } else {
          console.error(`API Error: ${error.message}`);
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    const axiosConfig: AxiosRequestConfig = {
      headers: config?.headers,
      timeout: config?.timeout || this.defaultTimeout,
    };

    const response = await this.axiosInstance.get<T>(url, axiosConfig);
    return response.data;
  }

  async post<T>(url: string, data: any, config?: RequestConfig): Promise<T> {
    const axiosConfig: AxiosRequestConfig = {
      headers: config?.headers,
      timeout: config?.timeout || this.defaultTimeout,
    };

    const response = await this.axiosInstance.post<T>(url, data, axiosConfig);
    return response.data;
  }
}
