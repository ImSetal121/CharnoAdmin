package org.charno.commonwebsocket.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

/**
 * WebSocket 消息基类
 * 定义标准消息结构，用于前后端通信
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class WebSocketMessage {
    
    /**
     * 消息类型
     */
    private WebSocketMessageType type;
    
    /**
     * 订阅键（用于订阅/取消订阅）
     * 格式：由业务模块定义，如 "userId_externalUserid"
     */
    private String key;
    
    /**
     * 消息数据（业务数据）
     */
    private Object data;
    
    /**
     * 消息时间戳
     */
    @Builder.Default
    private OffsetDateTime timestamp = OffsetDateTime.now();
    
    /**
     * 错误信息（当 type 为 ERROR 时使用）
     */
    private String error;
}

