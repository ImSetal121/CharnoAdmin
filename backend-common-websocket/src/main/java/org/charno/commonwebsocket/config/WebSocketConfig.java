package org.charno.commonwebsocket.config;

import lombok.extern.slf4j.Slf4j;
import org.charno.commonwebsocket.handler.WebSocketHandlerRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.HandlerMapping;
import org.springframework.web.reactive.handler.SimpleUrlHandlerMapping;
import org.springframework.web.reactive.socket.WebSocketHandler;

import java.util.HashMap;
import java.util.Map;

/**
 * WebSocket 配置类
 * 配置 WebSocket 处理器映射，注册所有 WebSocket 路径
 */
@Slf4j
@Configuration
public class WebSocketConfig {
    
    private final WebSocketHandlerRegistry handlerRegistry;
    
    public WebSocketConfig(WebSocketHandlerRegistry handlerRegistry) {
        this.handlerRegistry = handlerRegistry;
    }
    
    /**
     * 配置 WebSocket 处理器映射
     * 从注册表中获取所有处理器，并映射到对应的路径
     * 
     * @return HandlerMapping
     */
    @Bean
    public HandlerMapping webSocketHandlerMapping() {
        Map<String, WebSocketHandler> map = new HashMap<>();
        
        // 从注册表获取所有处理器
        Map<String, WebSocketHandler> handlers = handlerRegistry.getHandlers();
        
        if (handlers.isEmpty()) {
            log.info("No WebSocket handlers registered");
        } else {
            log.info("Registering {} WebSocket handler(s)", handlers.size());
            handlers.forEach((path, handler) -> {
                map.put(path, handler);
                log.info("Registered WebSocket handler: {}", path);
            });
        }
        
        // 使用 SimpleUrlHandlerMapping 映射路径到处理器
        // order = -1 确保在 HTTP 处理器之前匹配
        SimpleUrlHandlerMapping mapping = new SimpleUrlHandlerMapping();
        mapping.setUrlMap(map);
        mapping.setOrder(-1);
        
        return mapping;
    }
}

