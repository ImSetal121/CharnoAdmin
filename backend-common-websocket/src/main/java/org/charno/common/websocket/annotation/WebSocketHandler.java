package org.charno.common.websocket.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * WebSocket 处理器注册注解
 * 用于标记 WebSocket 处理器，指定 WebSocket 路径
 * 
 * 使用方式：
 * @WebSocketHandler(path = "/ws/wechat/messages")
 * @Component
 * public class WechatMessageWebSocketHandler extends BaseWebSocketHandler {
 *     // ...
 * }
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface WebSocketHandler {
    
    /**
     * WebSocket 路径
     * 例如："/ws/wechat/messages"
     * 
     * @return WebSocket 路径
     */
    String path();
}

