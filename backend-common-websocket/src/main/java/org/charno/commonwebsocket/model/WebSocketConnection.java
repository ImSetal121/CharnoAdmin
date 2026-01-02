package org.charno.commonwebsocket.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

/**
 * WebSocket 连接信息
 * 用于存储和管理连接信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebSocketConnection {
    
    /**
     * 用户ID
     */
    private String userId;
    
    /**
     * 会话ID（WebSocket Session ID）
     */
    private String sessionId;
    
    /**
     * 连接时间
     */
    @Builder.Default
    private OffsetDateTime connectedAt = OffsetDateTime.now();
    
    /**
     * 最后活动时间
     */
    @Builder.Default
    private OffsetDateTime lastActiveAt = OffsetDateTime.now();
}

