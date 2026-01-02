package org.charno.common.websocket.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.charno.common.websocket.manager.WebSocketConnectionManager;
import org.charno.common.websocket.model.WebSocketMessage;
import org.charno.common.websocket.model.WebSocketMessageType;
import org.charno.common.websocket.service.WebSocketPushService;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketSession;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.time.OffsetDateTime;

/**
 * 基础 WebSocket 处理器
 * 下游模块继承此类，实现业务特定的消息处理逻辑
 * 
 * 功能：
 * 1. Token 认证
 * 2. 连接管理
 * 3. 消息处理（订阅/取消订阅/心跳/业务消息）
 * 4. 断开连接处理
 */
@Slf4j
public abstract class BaseWebSocketHandler implements WebSocketHandler {
    
    protected final WebSocketPushService pushService;
    protected final WebSocketConnectionManager connectionManager;
    protected final ObjectMapper objectMapper;
    
    /**
     * 是否启用心跳机制
     * 子类可以通过重写此方法或提供配置来控制
     */
    protected boolean enableHeartbeat() {
        return true;
    }
    
    public BaseWebSocketHandler(
            WebSocketPushService pushService,
            WebSocketConnectionManager connectionManager,
            ObjectMapper objectMapper) {
        this.pushService = pushService;
        this.connectionManager = connectionManager;
        this.objectMapper = objectMapper;
    }
    
    @Override
    public Mono<Void> handle(WebSocketSession session) {
        log.info("WebSocket connection established: sessionId={}, uri={}", 
                session.getId(), session.getHandshakeInfo().getUri());
        
        // 1. 验证 Token
        return authenticate(session)
                .flatMap(userId -> {
                    if (userId == null || userId.isEmpty()) {
                        log.warn("Authentication failed for session: {}", session.getId());
                        return sendError(session, "Authentication failed")
                                .then(session.close());
                    }
                    
                    log.info("User {} authenticated, sessionId={}", userId, session.getId());
                    
                    // 2. 注册连接
                    return connectionManager.registerConnection(userId, session)
                            .then(handleConnection(session, userId));
                })
                .doOnError(error -> {
                    log.error("Error handling WebSocket session: {}", session.getId(), error);
                })
                .doFinally(signalType -> {
                    // 5. 断开连接处理
                    handleDisconnect(session);
                });
    }
    
    /**
     * 处理连接建立后的逻辑
     */
    private Mono<Void> handleConnection(WebSocketSession session, String userId) {
        return session.receive()
                .flatMap(message -> {
                    try {
                        return handleMessage(session, userId, message);
                    } catch (Exception e) {
                        log.error("Error handling message from user {}: {}", userId, e.getMessage(), e);
                        return sendError(session, "Error processing message: " + e.getMessage());
                    }
                })
                .then();
    }
    
    /**
     * 处理接收到的消息
     */
    private Mono<Void> handleMessage(WebSocketSession session, String userId, org.springframework.web.reactive.socket.WebSocketMessage message) {
        if (message.getType() != org.springframework.web.reactive.socket.WebSocketMessage.Type.TEXT) {
            log.warn("Received non-text message from user {}, ignoring", userId);
            return Mono.empty();
        }
        
        String payload = message.getPayloadAsText();
        log.debug("Received message from user {}: {}", userId, payload);
        
        try {
            // 解析消息
            WebSocketMessage wsMessage =
                    objectMapper.readValue(payload, WebSocketMessage.class);
            
            if (wsMessage.getType() == null) {
                return sendError(session, "Message type is required");
            }
            
            // 根据消息类型处理
            return switch (wsMessage.getType()) {
                case SUBSCRIBE -> handleSubscribeMessage(session, userId, wsMessage);
                case UNSUBSCRIBE -> handleUnsubscribeMessage(userId, wsMessage);
                case PING -> handlePing(session);
                case PONG -> handlePong(session);
                case MESSAGE -> handleBusinessMessage(session, userId, wsMessage);
                case ERROR -> {
                    log.warn("Received error message from user {}: {}", userId, wsMessage.getError());
                    yield Mono.empty();
                }
            };
        } catch (Exception e) {
            log.error("Failed to parse message from user {}: {}", userId, e.getMessage(), e);
            return sendError(session, "Invalid message format: " + e.getMessage());
        }
    }
    
    /**
     * 处理订阅消息
     */
    private Mono<Void> handleSubscribeMessage(WebSocketSession session, String userId, WebSocketMessage message) {
        String subscriptionKey = message.getKey();
        if (subscriptionKey == null || subscriptionKey.isEmpty()) {
            log.warn("WebSocket订阅失败: 用户 {} 订阅请求缺少订阅键", userId);
            return sendError(session, "Subscription key is required");
        }
        
        log.info("WebSocket订阅请求: 用户 {} 请求订阅 {}", userId, subscriptionKey);
        return handleSubscribe(userId, subscriptionKey, session)
                .then(sendSuccess(session, "Subscribed to " + subscriptionKey))
                .doOnSuccess(v -> log.info("WebSocket订阅成功: 用户 {} 已成功订阅 {}", userId, subscriptionKey))
                .doOnError(e -> log.error("WebSocket订阅失败: 用户 {} 订阅 {} 时发生错误", userId, subscriptionKey, e));
    }
    
    /**
     * 处理取消订阅消息
     */
    private Mono<Void> handleUnsubscribeMessage(String userId, WebSocketMessage message) {
        String subscriptionKey = message.getKey();
        if (subscriptionKey == null || subscriptionKey.isEmpty()) {
            log.warn("WebSocket取消订阅: 用户 {} 取消订阅请求缺少订阅键", userId);
            return Mono.empty();
        }
        
        log.info("WebSocket取消订阅请求: 用户 {} 请求取消订阅 {}", userId, subscriptionKey);
        return handleUnsubscribe(userId, subscriptionKey)
                .doOnSuccess(v -> log.info("WebSocket取消订阅成功: 用户 {} 已成功取消订阅 {}", userId, subscriptionKey))
                .doOnError(e -> log.error("WebSocket取消订阅失败: 用户 {} 取消订阅 {} 时发生错误", userId, subscriptionKey, e));
    }
    
    /**
     * 处理心跳请求（Ping）
     */
    private Mono<Void> handlePing(WebSocketSession session) {
        if (!enableHeartbeat()) {
            return Mono.empty();
        }
        
        WebSocketMessage pongMessage =
                WebSocketMessage.builder()
                .type(WebSocketMessageType.PONG)
                .timestamp(OffsetDateTime.now())
                .build();
        
        return sendMessage(session, pongMessage);
    }
    
    /**
     * 处理心跳响应（Pong）
     */
    private Mono<Void> handlePong(WebSocketSession session) {
        // Pong 消息通常不需要特殊处理
        log.debug("Received Pong from session: {}", session.getId());
        return Mono.empty();
    }
    
    /**
     * 处理业务消息
     * 子类可以重写此方法实现自定义业务消息处理
     */
    protected Mono<Void> handleBusinessMessage(WebSocketSession session, String userId, WebSocketMessage message) {
        log.debug("Received business message from user {}: {}", userId, message.getData());
        return Mono.empty();
    }
    
    /**
     * 处理断开连接
     */
    private void handleDisconnect(WebSocketSession session) {
        String sessionId = session.getId();
        String userId = connectionManager.getUserIdBySessionId(sessionId);
        
        if (userId != null) {
            connectionManager.unregisterConnectionBySessionId(sessionId)
                    .doOnSuccess(v -> log.info("WebSocket connection closed: sessionId={}, userId={}", sessionId, userId))
                    .doOnError(error -> log.error("Error unregistering connection: sessionId={}, userId={}", sessionId, userId, error))
                    .subscribe();
        } else {
            log.info("WebSocket connection closed: sessionId={} (user not found)", sessionId);
        }
    }
    
    /**
     * 发送消息
     */
    protected Mono<Void> sendMessage(WebSocketSession session, WebSocketMessage message) {
        try {
            String json = objectMapper.writeValueAsString(message);
            return session.send(Mono.just(session.textMessage(json)));
        } catch (Exception e) {
            log.error("Failed to send message: {}", e.getMessage(), e);
            return Mono.empty();
        }
    }
    
    /**
     * 发送成功消息
     */
    protected Mono<Void> sendSuccess(WebSocketSession session, String message) {
        WebSocketMessage successMessage =
                WebSocketMessage.builder()
                .type(WebSocketMessageType.MESSAGE)
                .data(message)
                .timestamp(OffsetDateTime.now())
                .build();
        return sendMessage(session, successMessage);
    }
    
    /**
     * 发送错误消息
     */
    protected Mono<Void> sendError(WebSocketSession session, String error) {
        WebSocketMessage errorMessage =
                WebSocketMessage.builder()
                .type(WebSocketMessageType.ERROR)
                .error(error)
                .timestamp(OffsetDateTime.now())
                .build();
        return sendMessage(session, errorMessage);
    }
    
    /**
     * 从 URL 查询参数中提取 Token
     */
    protected String extractTokenFromUri(URI uri) {
        String query = uri.getQuery();
        if (query == null || query.isEmpty()) {
            return null;
        }
        
        String[] params = query.split("&");
        for (String param : params) {
            if (param.startsWith("token=")) {
                return param.substring(6);
            }
        }
        return null;
    }
    
    // ==================== 抽象方法 ====================
    
    /**
     * 验证 Token
     * 子类实现此方法，定义认证逻辑
     * 
     * @param session WebSocket 会话
     * @return Mono<String> 用户ID，如果认证失败返回空 Mono
     */
    protected abstract Mono<String> authenticate(WebSocketSession session);
    
    /**
     * 处理订阅
     * 子类实现此方法，定义订阅逻辑
     * 
     * @param userId 用户ID
     * @param subscriptionKey 订阅键
     * @param session WebSocket 会话
     * @return Mono<Void>
     */
    protected abstract Mono<Void> handleSubscribe(String userId, String subscriptionKey, WebSocketSession session);
    
    /**
     * 处理取消订阅
     * 子类实现此方法，定义取消订阅逻辑
     * 
     * @param userId 用户ID
     * @param subscriptionKey 订阅键
     * @return Mono<Void>
     */
    protected abstract Mono<Void> handleUnsubscribe(String userId, String subscriptionKey);
}

