package org.charno.common.websocket.service;

import reactor.core.publisher.Mono;

/**
 * WebSocket 消息推送服务接口
 * 下游模块实现此接口，提供业务特定的消息推送逻辑
 */
public interface WebSocketPushService {
    
    /**
     * 推送消息给指定订阅者
     * 
     * @param subscriptionKey 订阅键（如：userId_externalUserid）
     * @param message 消息对象
     * @return Mono<Void>
     */
    Mono<Void> pushMessage(String subscriptionKey, Object message);
    
    /**
     * 获取消息类型
     * 用于区分不同类型的消息，前端可以根据类型处理
     * 
     * @return 消息类型标识
     */
    String getMessageType();
}

