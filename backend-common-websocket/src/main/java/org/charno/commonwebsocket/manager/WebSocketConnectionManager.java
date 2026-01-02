package org.charno.commonwebsocket.manager;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketSession;
import reactor.core.publisher.Mono;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket 连接管理器
 * 管理所有 WebSocket 连接和订阅关系
 * 
 * 线程安全：使用 ConcurrentHashMap 保证线程安全
 */
@Slf4j
@Component
public class WebSocketConnectionManager {
    
    /**
     * 存储连接：key = userId, value = WebSocketSession
     */
    private final ConcurrentHashMap<String, WebSocketSession> connections = new ConcurrentHashMap<>();
    
    /**
     * 存储 sessionId -> userId 映射，用于断开连接时查找用户
     */
    private final ConcurrentHashMap<String, String> sessionToUser = new ConcurrentHashMap<>();
    
    /**
     * 存储订阅关系：key = subscriptionKey (如: userId_externalUserid), value = Set<userId>
     */
    private final ConcurrentHashMap<String, Set<String>> subscriptions = new ConcurrentHashMap<>();
    
    /**
     * 注册连接
     * 
     * @param userId 用户ID
     * @param session WebSocket 会话
     * @return Mono<Void>
     */
    public Mono<Void> registerConnection(String userId, WebSocketSession session) {
        // 如果用户已有连接，先关闭旧连接
        WebSocketSession oldSession = connections.get(userId);
        if (oldSession != null && oldSession.isOpen()) {
            log.warn("User {} already has an active connection, closing old connection", userId);
            String oldSessionId = oldSession.getId();
            sessionToUser.remove(oldSessionId);
            oldSession.close().subscribe();
        }
        
        connections.put(userId, session);
        sessionToUser.put(session.getId(), userId);
        log.debug("Registered WebSocket connection for user: {}, sessionId: {}", userId, session.getId());
        return Mono.empty();
    }
    
    /**
     * 取消注册连接
     * 
     * @param userId 用户ID
     * @return Mono<Void>
     */
    public Mono<Void> unregisterConnection(String userId) {
        WebSocketSession session = connections.remove(userId);
        if (session != null) {
            sessionToUser.remove(session.getId());
            log.debug("Unregistered WebSocket connection for user: {}", userId);
        }
        
        // 清理该用户的所有订阅
        subscriptions.values().forEach(subscribers -> subscribers.remove(userId));
        
        // 清理空的订阅关系
        subscriptions.entrySet().removeIf(entry -> entry.getValue().isEmpty());
        
        return Mono.empty();
    }
    
    /**
     * 根据 sessionId 取消注册连接
     * 
     * @param sessionId 会话ID
     * @return Mono<Void>
     */
    public Mono<Void> unregisterConnectionBySessionId(String sessionId) {
        String userId = sessionToUser.remove(sessionId);
        if (userId != null) {
            connections.remove(userId);
            log.debug("Unregistered WebSocket connection by sessionId: {}, userId: {}", sessionId, userId);
            
            // 清理该用户的所有订阅
            subscriptions.values().forEach(subscribers -> subscribers.remove(userId));
            
            // 清理空的订阅关系
            subscriptions.entrySet().removeIf(entry -> entry.getValue().isEmpty());
        }
        return Mono.empty();
    }
    
    /**
     * 根据 sessionId 获取 userId
     * 
     * @param sessionId 会话ID
     * @return 用户ID，如果不存在返回 null
     */
    public String getUserIdBySessionId(String sessionId) {
        return sessionToUser.get(sessionId);
    }
    
    /**
     * 订阅
     * 
     * @param userId 用户ID
     * @param subscriptionKey 订阅键
     * @return Mono<Void>
     */
    public Mono<Void> subscribe(String userId, String subscriptionKey) {
        Set<String> subscribers = subscriptions.computeIfAbsent(subscriptionKey, k -> ConcurrentHashMap.newKeySet());
        boolean isNewSubscription = subscribers.add(userId);
        
        if (isNewSubscription) {
            log.info("WebSocket订阅: 用户 {} 订阅了 {}", userId, subscriptionKey);
        } else {
            log.debug("WebSocket订阅: 用户 {} 已订阅 {} (重复订阅)", userId, subscriptionKey);
        }
        
        return Mono.empty();
    }
    
    /**
     * 取消订阅
     * 
     * @param userId 用户ID
     * @param subscriptionKey 订阅键
     * @return Mono<Void>
     */
    public Mono<Void> unsubscribe(String userId, String subscriptionKey) {
        Set<String> subscribers = subscriptions.get(subscriptionKey);
        if (subscribers != null && subscribers.remove(userId)) {
            log.info("WebSocket取消订阅: 用户 {} 取消订阅 {}", userId, subscriptionKey);
            if (subscribers.isEmpty()) {
                subscriptions.remove(subscriptionKey);
                log.debug("WebSocket订阅: 订阅键 {} 已无订阅者，已清理", subscriptionKey);
            }
        } else {
            log.debug("WebSocket取消订阅: 用户 {} 未订阅 {} (无需取消)", userId, subscriptionKey);
        }
        return Mono.empty();
    }
    
    /**
     * 获取订阅者
     * 
     * @param subscriptionKey 订阅键
     * @return 订阅者用户ID集合
     */
    public Set<String> getSubscribers(String subscriptionKey) {
        return subscriptions.getOrDefault(subscriptionKey, Set.of());
    }
    
    /**
     * 发送消息给订阅者
     * 
     * @param subscriptionKey 订阅键
     * @param message 消息内容（JSON 字符串）
     * @return Mono<Void>
     */
    public Mono<Void> sendToSubscribers(String subscriptionKey, String message) {
        Set<String> subscribers = getSubscribers(subscriptionKey);
        
        if (subscribers.isEmpty()) {
            log.debug("No subscribers for subscription key: {}", subscriptionKey);
            return Mono.empty();
        }
        
        return Mono.fromRunnable(() -> {
            subscribers.forEach(userId -> {
                WebSocketSession session = connections.get(userId);
                if (session != null && session.isOpen()) {
                    session.send(Mono.just(session.textMessage(message)))
                           .doOnError(error -> log.error("Failed to send message to user {}: {}", userId, error.getMessage()))
                           .subscribe();
                } else {
                    log.warn("Session not found or closed for user: {}", userId);
                    // 清理无效连接
                    if (session == null || !session.isOpen()) {
                        connections.remove(userId);
                        subscriptions.values().forEach(sub -> sub.remove(userId));
                    }
                }
            });
        });
    }
    
    /**
     * 检查用户是否已连接
     * 
     * @param userId 用户ID
     * @return true 如果用户已连接
     */
    public boolean isConnected(String userId) {
        WebSocketSession session = connections.get(userId);
        return session != null && session.isOpen();
    }
    
    /**
     * 获取连接数
     * 
     * @return 当前连接数
     */
    public int getConnectionCount() {
        return connections.size();
    }
    
    /**
     * 获取订阅数
     * 
     * @return 当前订阅数
     */
    public int getSubscriptionCount() {
        return subscriptions.size();
    }
}

