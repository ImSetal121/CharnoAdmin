/**
 * WebSocket 工具类
 * 管理 WebSocket 连接、订阅、重连等功能
 */

export type WebSocketMessageType = 'SUBSCRIBE' | 'UNSUBSCRIBE' | 'PING' | 'PONG' | 'MESSAGE' | 'ERROR';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  key?: string;
  data?: unknown;
  timestamp?: string;
  error?: string;
}

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface WebSocketOptions {
  /** WebSocket URL */
  url: string;
  /** Token 用于认证 */
  token: string;
  /** 连接成功回调 */
  onOpen?: () => void;
  /** 连接关闭回调 */
  onClose?: () => void;
  /** 错误回调 */
  onError?: (error: Event) => void;
  /** 消息回调 */
  onMessage?: (message: WebSocketMessage) => void;
  /** 是否启用心跳（默认 true） */
  enableHeartbeat?: boolean;
  /** 心跳间隔（毫秒，默认 30000） */
  heartbeatInterval?: number;
  /** 重连间隔（毫秒，默认 3000） */
  reconnectInterval?: number;
  /** 最大重连次数（默认 5） */
  maxReconnectAttempts?: number;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private status: WebSocketStatus = 'disconnected';
  private heartbeatTimer: number | null = null;
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private subscriptions = new Set<string>();
  
  private options: Required<Pick<WebSocketOptions, 'enableHeartbeat' | 'heartbeatInterval' | 'reconnectInterval' | 'maxReconnectAttempts'>> & 
    Pick<WebSocketOptions, 'url' | 'token' | 'onOpen' | 'onClose' | 'onError' | 'onMessage'>;

  constructor(options: WebSocketOptions) {
    this.options = {
      enableHeartbeat: true,
      heartbeatInterval: 30000,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      ...options,
    };
  }

  /**
   * 连接 WebSocket
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    if (this.ws?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket is connecting...');
      return;
    }

    this.status = 'connecting';
    const url = `${this.options.url}?token=${encodeURIComponent(this.options.token)}`;
    
    try {
      this.ws = new WebSocket(url);
      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.status = 'error';
      this.options.onError?.(error as Event);
      this.scheduleReconnect();
    }
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.status = 'connected';
      this.reconnectAttempts = 0;
      this.options.onOpen?.();
      
      // 重新订阅之前的订阅
      this.resubscribe();
      
      // 启动心跳
      if (this.options.enableHeartbeat) {
        this.startHeartbeat();
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        // 处理心跳响应
        if (message.type === 'PONG') {
          return;
        }
        
        // 处理错误消息
        if (message.type === 'ERROR') {
          console.error('WebSocket error:', message.error);
          // 创建一个 Event 对象用于错误回调
          // 注意：WebSocket 的 onerror 回调接收的是 Event 类型
          const errorEvent = new Event('error');
          this.options.onError?.(errorEvent);
          return;
        }
        
        // 处理业务消息
        this.options.onMessage?.(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.status = 'disconnected';
      this.stopHeartbeat();
      this.options.onClose?.();
      
      // 尝试重连
      if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
        this.scheduleReconnect();
      } else {
        console.error('Max reconnect attempts reached');
        this.status = 'error';
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.status = 'error';
      this.options.onError?.(error);
    };
  }

  /**
   * 订阅
   */
  subscribe(key: string): void {
    if (!this.isConnected()) {
      console.warn('WebSocket not connected, subscription will be queued');
      this.subscriptions.add(key);
      return;
    }

    const message: WebSocketMessage = {
      type: 'SUBSCRIBE',
      key,
      timestamp: new Date().toISOString(),
    };

    this.send(message);
    this.subscriptions.add(key);
    console.log('Subscribed to:', key);
  }

  /**
   * 取消订阅
   */
  unsubscribe(key: string): void {
    if (!this.isConnected()) {
      this.subscriptions.delete(key);
      return;
    }

    const message: WebSocketMessage = {
      type: 'UNSUBSCRIBE',
      key,
      timestamp: new Date().toISOString(),
    };

    this.send(message);
    this.subscriptions.delete(key);
    console.log('Unsubscribed from:', key);
  }

  /**
   * 发送消息
   */
  private send(message: WebSocketMessage): void {
    if (!this.isConnected()) {
      console.warn('WebSocket not connected, cannot send message');
      return;
    }

    try {
      this.ws?.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
    }
  }

  /**
   * 重新订阅之前的订阅
   */
  private resubscribe(): void {
    this.subscriptions.forEach(key => {
      this.subscribe(key);
    });
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = window.setInterval(() => {
      if (this.isConnected()) {
        const message: WebSocketMessage = {
          type: 'PING',
          timestamp: new Date().toISOString(),
        };
        this.send(message);
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) {
      return;
    }

    this.reconnectAttempts++;
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts}...`);
    
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.options.reconnectInterval);
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.stopHeartbeat();
    
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.status = 'disconnected';
    this.subscriptions.clear();
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * 获取连接状态
   */
  getStatus(): WebSocketStatus {
    return this.status;
  }

  /**
   * 获取所有订阅
   */
  getSubscriptions(): string[] {
    return Array.from(this.subscriptions);
  }
}

