package org.charno.common.websocket.model;

/**
 * WebSocket 消息类型枚举
 * 定义标准消息类型，用于区分不同类型的消息
 */
public enum WebSocketMessageType {
    /**
     * 订阅消息
     */
    SUBSCRIBE,
    
    /**
     * 取消订阅消息
     */
    UNSUBSCRIBE,
    
    /**
     * 心跳请求（Ping）
     */
    PING,
    
    /**
     * 心跳响应（Pong）
     */
    PONG,
    
    /**
     * 业务消息
     */
    MESSAGE,
    
    /**
     * 错误消息
     */
    ERROR
}

