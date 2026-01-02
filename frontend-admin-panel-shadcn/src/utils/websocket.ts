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
  /** 是否自动重新订阅（默认 true，连接建立时自动重新订阅之前的订阅） */
  autoResubscribe?: boolean;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private status: WebSocketStatus = 'disconnected';
  private heartbeatTimer: number | null = null;
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private subscriptions = new Set<string>();
  private errorHandled = false; // 标记错误是否已处理，避免重复处理
  
  private options: Required<Pick<WebSocketOptions, 'enableHeartbeat' | 'heartbeatInterval' | 'reconnectInterval' | 'maxReconnectAttempts' | 'autoResubscribe'>> & 
    Pick<WebSocketOptions, 'url' | 'token' | 'onOpen' | 'onClose' | 'onError' | 'onMessage'>;

  constructor(options: WebSocketOptions) {
    this.options = {
      enableHeartbeat: true,
      heartbeatInterval: 30000,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      autoResubscribe: true,
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

    // 清理之前的连接
    if (this.ws) {
      try {
        this.ws.onerror = null;
        this.ws.onclose = null;
        this.ws.onopen = null;
        this.ws.onmessage = null;
        if (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN) {
          this.ws.close();
        }
      } catch {
        // 忽略清理错误
      }
      this.ws = null;
    }

    this.status = 'connecting';
    this.errorHandled = false; // 重置错误处理标记
    const url = `${this.options.url}?token=${encodeURIComponent(this.options.token)}`;
    
    try {
      this.ws = new WebSocket(url);
      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.status = 'error';
      this.errorHandled = true;
      this.options.onError?.(error as Event);
      // 只有在启用了自动重连时才尝试重连
      if (this.options.maxReconnectAttempts > 0) {
        this.scheduleReconnect();
      }
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
      this.errorHandled = false; // 重置错误处理标记
      
      // 如果启用了自动重新订阅，先重新订阅之前的订阅
      if (this.options.autoResubscribe) {
        this.resubscribe();
      }
      
      // 启动心跳
      if (this.options.enableHeartbeat) {
        this.startHeartbeat();
      }
      
      // 调用 onOpen 回调（在重新订阅之后，这样用户可以在回调中手动订阅）
      this.options.onOpen?.();
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

    this.ws.onclose = (event) => {
      const wasConnected = this.status === 'connected';
      console.log('WebSocket disconnected', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        wasConnected
      });
      
      this.status = 'disconnected';
      this.stopHeartbeat();
      this.errorHandled = false; // 重置错误处理标记
      
      // 只有在之前已连接的情况下才调用 onClose
      // 如果从未连接成功，说明是连接失败，不应该触发 onClose
      if (wasConnected) {
        this.options.onClose?.();
      }
      
      // 尝试重连（不清空订阅记录，保留以便重连后重新订阅）
      if (this.options.maxReconnectAttempts > 0 && this.reconnectAttempts < this.options.maxReconnectAttempts) {
        // 不清空订阅记录，保留以便重连后重新订阅
        this.scheduleReconnect();
      } else if (this.options.maxReconnectAttempts > 0) {
        // 只有在启用了自动重连且达到最大重连次数时才显示错误
        console.error('Max reconnect attempts reached');
        this.status = 'error';
        // 达到最大重连次数后，清空订阅记录
        this.subscriptions.clear();
      }
      // 如果 maxReconnectAttempts 为 0，不进行任何重连操作，也不显示错误
    };

    this.ws.onerror = (error) => {
      // 避免重复处理错误（onerror 可能在 onclose 之前或之后触发）
      if (this.errorHandled) {
        return;
      }
      
      // 检查连接状态，如果已经断开，错误可能已经在 onclose 中处理
      if (this.ws?.readyState === WebSocket.CLOSED || this.ws?.readyState === WebSocket.CLOSING) {
        // 连接已关闭或正在关闭，错误会在 onclose 中处理
        return;
      }
      
      this.errorHandled = true;
      
      // 只在开发环境或连接状态为 CONNECTING 时记录详细错误
      // 如果是已连接状态下的错误，通常会在 onclose 中处理
      if (this.ws?.readyState === WebSocket.CONNECTING) {
        console.warn('WebSocket connection error (during connection):', {
          readyState: this.ws?.readyState,
          url: this.ws?.url
        });
      } else {
        // 已连接状态下的错误，通常会在 onclose 中处理，这里只记录警告
        console.warn('WebSocket error (will be handled in onclose):', {
          readyState: this.ws?.readyState
        });
      }
      
      // 只有在连接失败时才设置错误状态
      // 如果已经连接，错误状态会在 onclose 中设置
      if (this.ws?.readyState === WebSocket.CONNECTING || this.ws?.readyState === WebSocket.CLOSED) {
        this.status = 'error';
        // 只在连接失败时触发错误回调，避免重复触发
        if (this.ws?.readyState === WebSocket.CONNECTING) {
          this.options.onError?.(error);
        }
      }
    };
  }

  /**
   * 订阅
   */
  subscribe(key: string): void {
    if (!this.isConnected()) {
      console.warn('WebSocket not connected, subscription will be queued:', key);
      this.subscriptions.add(key);
      return;
    }

    // 检查是否已经订阅过，避免重复订阅
    if (this.subscriptions.has(key)) {
      console.log('Already subscribed to:', key, ', skipping duplicate subscription');
      return;
    }

    const message: WebSocketMessage = {
      type: 'SUBSCRIBE',
      key,
      timestamp: new Date().toISOString(),
    };

    try {
      this.send(message);
      this.subscriptions.add(key);
      console.log('Subscribed to:', key, 'message sent successfully');
    } catch (error) {
      console.error('Failed to subscribe to:', key, error);
      // 即使发送失败，也记录订阅意图，以便重连后重新订阅
      this.subscriptions.add(key);
    }
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
   * 重连后需要重新订阅，所以先清空订阅记录再重新订阅
   */
  private resubscribe(): void {
    // 保存需要重新订阅的键
    const keysToResubscribe = Array.from(this.subscriptions);
    // 清空订阅记录，以便重新订阅（因为连接已断开，需要重新发送订阅消息）
    this.subscriptions.clear();
    // 重新订阅
    keysToResubscribe.forEach(key => {
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
   * @param clearSubscriptions 是否清空订阅记录（默认 true，手动断开时清空，自动重连时不清空）
   */
  disconnect(clearSubscriptions: boolean = true): void {
    this.stopHeartbeat();
    this.errorHandled = false; // 重置错误处理标记
    
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // 在断开连接前，先取消所有订阅（如果连接仍然打开）
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const subscriptionsToUnsubscribe = Array.from(this.subscriptions);
      subscriptionsToUnsubscribe.forEach(key => {
        const message: WebSocketMessage = {
          type: 'UNSUBSCRIBE',
          key,
          timestamp: new Date().toISOString(),
        };
        try {
          this.ws?.send(JSON.stringify(message));
        } catch (error) {
          console.warn('Failed to send unsubscribe message:', error);
        }
      });
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.status = 'disconnected';
    
    // 只有在手动断开时才清空订阅记录（自动重连时需要保留订阅记录以便重新订阅）
    if (clearSubscriptions) {
      this.subscriptions.clear();
    }
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

  /**
   * 切换订阅（取消旧订阅，订阅新订阅）
   * 用于切换用户等场景，避免重复订阅
   */
  switchSubscription(oldKey: string | null, newKey: string): void {
    // 如果旧订阅存在且已连接，先取消旧订阅
    if (oldKey && this.isConnected() && this.subscriptions.has(oldKey)) {
      this.unsubscribe(oldKey);
    }
    
    // 如果新订阅不存在，则订阅
    if (!this.subscriptions.has(newKey)) {
      this.subscribe(newKey);
    }
  }

  /**
   * 取消所有订阅并清空订阅记录
   */
  unsubscribeAll(): void {
    const subscriptionsToUnsubscribe = Array.from(this.subscriptions);
    subscriptionsToUnsubscribe.forEach(key => {
      this.unsubscribe(key);
    });
    this.subscriptions.clear();
  }
}

/**
 * WebSocket 连接管理器
 * 封装连接、订阅、切换等高级操作
 */
export interface WebSocketConnectionManagerOptions {
  /** WebSocket 基础 URL */
  baseUrl?: string;
  /** 获取 Token 的函数 */
  getToken: () => string | null;
  /** 连接成功回调 */
  onOpen?: () => void;
  /** 连接关闭回调 */
  onClose?: () => void;
  /** 错误回调 */
  onError?: (error: Event) => void;
  /** 消息回调 */
  onMessage?: (message: WebSocketMessage) => void;
}

export class WebSocketConnectionManager {
  private client: WebSocketClient | null = null;
  private currentSubscription: string | null = null;
  private options: WebSocketConnectionManagerOptions;
  private wsPath: string;
  private connectionAttempts = 0;
  private maxConnectionAttempts = 3;
  private isDisconnecting = false; // 标记是否正在主动断开连接
  private connectionCheckTimer: number | null = null; // 连接健康检查定时器
  private readonly CONNECTION_CHECK_INTERVAL = 30000; // 30秒检查一次连接状态

  constructor(options: WebSocketConnectionManagerOptions, wsPath: string = '/ws/wechat/messages') {
    this.options = options;
    this.wsPath = wsPath;
  }

  /**
   * 获取 WebSocket URL
   */
  private getWebSocketUrl(): string {
    const baseUrl = this.options.baseUrl || 
      (import.meta.env.VITE_WS_BASE_URL || 
        (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080')
          .replace('http://', 'ws://')
          .replace('https://', 'wss://'));
    return `${baseUrl}${this.wsPath}`;
  }

  /**
   * 连接到指定订阅
   * 如果已有连接，会先取消旧订阅，再订阅新订阅
   */
  async connectToSubscription(subscriptionKey: string): Promise<void> {
    const token = this.options.getToken();
    if (!token) {
      console.warn('No token available, cannot connect to WebSocket');
      return;
    }

    // 如果已有连接且订阅相同且已连接，不需要重新连接
    if (this.client && this.currentSubscription === subscriptionKey && this.client.isConnected()) {
      console.log('Already connected to subscription:', subscriptionKey);
      return;
    }

    // 如果连接正在建立中，等待完成
    if (this.client && this.client.getStatus() === 'connecting') {
      console.log('WebSocket is connecting, waiting...');
      // 等待最多2秒
      for (let i = 0; i < 20; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const status = this.client?.getStatus();
        if (status === 'connected' || status === 'disconnected' || status === 'error') {
          break;
        }
      }
      // 如果等待后连接成功且订阅相同，直接返回
      if (this.client && this.currentSubscription === subscriptionKey && this.client.isConnected()) {
        console.log('Already connected to subscription after waiting:', subscriptionKey);
        return;
      }
    }

    // 如果已有连接，先取消旧订阅并断开
    if (this.client) {
      this.isDisconnecting = true; // 标记正在主动断开
      const oldSubscription = this.currentSubscription;
      if (oldSubscription && oldSubscription !== subscriptionKey && this.client.isConnected()) {
        // 取消旧订阅
        this.client.unsubscribe(oldSubscription);
        // 等待一小段时间，确保取消订阅消息已发送
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      // 断开连接（禁用自动重连）
      this.client.disconnect();
      this.client = null;
      this.currentSubscription = null;
      // 再等待一小段时间，确保后端已处理
      await new Promise(resolve => setTimeout(resolve, 100));
      this.isDisconnecting = false; // 断开完成
    }

    // 创建新连接
    const wsUrl = this.getWebSocketUrl();
    this.connectionAttempts = 0; // 重置连接尝试次数
    
    const createConnection = (): void => {
      this.connectionAttempts++;
      
      this.client = new WebSocketClient({
        url: wsUrl,
        token,
        onOpen: () => {
          console.log('WebSocket connected');
          this.connectionAttempts = 0; // 连接成功，重置尝试次数
          this.currentSubscription = subscriptionKey;
          
          // 启动连接健康检查
          this.startConnectionCheck();
          
          // 订阅新订阅（不通过 resubscribe，避免重复订阅）
          // 使用 setTimeout 确保连接状态完全就绪后再订阅
          if (subscriptionKey && this.client) {
            setTimeout(() => {
              if (this.client && this.client.isConnected()) {
                this.client.subscribe(subscriptionKey);
                console.log('Subscribed to:', subscriptionKey);
              } else {
                console.warn('WebSocket not connected when trying to subscribe, retrying...');
                // 如果连接未就绪，稍后重试
                setTimeout(() => {
                  if (this.client && this.client.isConnected() && this.currentSubscription === subscriptionKey) {
                    this.client.subscribe(subscriptionKey);
                    console.log('Subscribed to (retry):', subscriptionKey);
                  }
                }, 200);
              }
            }, 100);
          }
          
          this.options.onOpen?.();
        },
        onClose: () => {
          console.log('WebSocket disconnected');
          // 停止连接健康检查
          this.stopConnectionCheck();
          
          // 如果连接意外断开且不是手动断开，尝试重新连接
          // 检查：1. 不是主动断开 2. 当前订阅仍然是这个订阅 3. 还有重试次数
          if (!this.isDisconnecting && 
              this.currentSubscription === subscriptionKey) {
            // 重置连接尝试次数，允许无限重试（只要订阅还在）
            if (this.connectionAttempts >= this.maxConnectionAttempts) {
              console.log('Resetting connection attempts for persistent reconnection');
              this.connectionAttempts = 0;
            }
            
            if (this.connectionAttempts < this.maxConnectionAttempts) {
              console.log(`Connection lost, attempting to reconnect (${this.connectionAttempts}/${this.maxConnectionAttempts})...`);
              setTimeout(() => {
                // 再次检查：确保订阅没有改变，且没有新的客户端
                if (!this.isDisconnecting && 
                    this.currentSubscription === subscriptionKey && 
                    !this.client) {
                  createConnection();
                }
              }, 1000);
            } else {
              // 如果达到最大重试次数，等待更长时间后重试
              console.log('Max reconnection attempts reached, will retry after longer interval');
              setTimeout(() => {
                if (!this.isDisconnecting && 
                    this.currentSubscription === subscriptionKey && 
                    !this.client) {
                  this.connectionAttempts = 0; // 重置尝试次数
                  createConnection();
                }
              }, 10000); // 等待10秒后重试
            }
          } else {
            // 注意：不要在这里清空 currentSubscription，因为可能是手动断开
            // currentSubscription 的清空应该在 disconnect() 方法中处理
            this.options.onClose?.();
          }
        },
        onError: (error) => {
          console.error('WebSocket error:', error);
          this.options.onError?.(error);
          // 如果连接失败且还有重试次数，尝试重新连接
          // 检查：1. 不是主动断开 2. 当前订阅仍然是这个订阅或没有订阅 3. 还有重试次数
          if (!this.isDisconnecting && 
              this.connectionAttempts < this.maxConnectionAttempts &&
              (this.currentSubscription === subscriptionKey || !this.currentSubscription)) {
            console.log(`Connection error, attempting to reconnect (${this.connectionAttempts}/${this.maxConnectionAttempts})...`);
            setTimeout(() => {
              // 再次检查：确保订阅没有改变，且没有新的客户端
              if (!this.isDisconnecting && 
                  (this.currentSubscription === subscriptionKey || !this.currentSubscription) &&
                  !this.client) {
                createConnection();
              }
            }, 1000);
          }
        },
        onMessage: (message) => {
          this.options.onMessage?.(message);
        },
        // 禁用自动重新订阅，避免重复订阅
        autoResubscribe: false,
        // 禁用自动重连，由 WebSocketConnectionManager 手动管理
        maxReconnectAttempts: 0,
        enableHeartbeat: true,
      });

      this.client.connect();
    };
    
    createConnection();
  }

  /**
   * 启动连接健康检查
   * 定期检查连接状态，如果断开则自动重连
   */
  private startConnectionCheck(): void {
    this.stopConnectionCheck();
    
    this.connectionCheckTimer = window.setInterval(() => {
      // 如果有当前订阅但连接已断开，尝试重连
      if (this.currentSubscription && 
          (!this.client || !this.client.isConnected()) && 
          !this.isDisconnecting) {
        console.log('Connection check: connection lost, attempting to reconnect...');
        const subscriptionKey = this.currentSubscription;
        // 重置连接尝试次数，允许重连
        this.connectionAttempts = 0;
        this.connectToSubscription(subscriptionKey);
      }
    }, this.CONNECTION_CHECK_INTERVAL);
  }

  /**
   * 停止连接健康检查
   */
  private stopConnectionCheck(): void {
    if (this.connectionCheckTimer !== null) {
      clearInterval(this.connectionCheckTimer);
      this.connectionCheckTimer = null;
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.isDisconnecting = true;
    this.stopConnectionCheck(); // 标记正在主动断开
    if (this.client) {
      this.client.disconnect();
      this.client = null;
    }
    this.currentSubscription = null;
    this.isDisconnecting = false; // 断开完成
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.client?.isConnected() ?? false;
  }

  /**
   * 获取当前订阅
   */
  getCurrentSubscription(): string | null {
    return this.currentSubscription;
  }

  /**
   * 确保连接和订阅
   * 如果连接断开或未订阅，自动重连并订阅
   */
  ensureConnected(subscriptionKey: string): void {
    if (!subscriptionKey) {
      console.warn('ensureConnected: subscriptionKey is required');
      return;
    }

    // 如果没有连接或连接已断开，重新连接
    if (!this.client || !this.client.isConnected()) {
      console.log('ensureConnected: connection lost, reconnecting...');
      this.connectionAttempts = 0; // 重置尝试次数
      this.connectToSubscription(subscriptionKey);
      return;
    }

    // 如果订阅不匹配，重新订阅
    if (this.currentSubscription !== subscriptionKey) {
      console.log(`ensureConnected: subscription mismatch (current: ${this.currentSubscription}, expected: ${subscriptionKey}), resubscribing...`);
      this.currentSubscription = subscriptionKey;
      if (this.client) {
        this.client.subscribe(subscriptionKey);
      }
      return;
    }

    // 检查是否已订阅
    // 注意：WebSocketClient 的订阅状态是内部的，我们只能通过尝试订阅来确保
    if (this.client) {
      this.client.subscribe(subscriptionKey);
    }
  }

  /**
   * 获取 WebSocket 客户端（用于高级操作）
   */
  getClient(): WebSocketClient | null {
    return this.client;
  }
}

