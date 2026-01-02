package org.charno.commonwebsocket.config;

import lombok.extern.slf4j.Slf4j;
import org.charno.commonwebsocket.handler.WebSocketHandlerRegistry;
import org.springframework.context.ApplicationListener;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.web.reactive.HandlerMapping;
import org.springframework.web.reactive.handler.SimpleUrlHandlerMapping;
import org.springframework.web.reactive.socket.WebSocketHandler;

import java.util.HashMap;
import java.util.Map;

/**
 * WebSocket 配置类
 * 配置 WebSocket 处理器映射，注册所有 WebSocket 路径
 * 
 * 注意：由于处理器在 ContextRefreshedEvent 时才注册，需要监听该事件并更新映射
 */
@Slf4j
@Configuration
@DependsOn("webSocketHandlerRegistry")  // 确保在 WebSocketHandlerRegistry 之后创建
public class WebSocketConfig implements ApplicationListener<ContextRefreshedEvent> {
    
    private final WebSocketHandlerRegistry handlerRegistry;
    
    /**
     * 保存 HandlerMapping 引用，以便在 ContextRefreshedEvent 后更新
     */
    private SimpleUrlHandlerMapping handlerMapping;
    
    public WebSocketConfig(WebSocketHandlerRegistry handlerRegistry) {
        this.handlerRegistry = handlerRegistry;
    }
    
    /**
     * 配置 WebSocket 处理器映射
     * 初始时创建空的映射，在 ContextRefreshedEvent 后更新
     * 
     * @return HandlerMapping
     */
    @Bean
    public HandlerMapping webSocketHandlerMapping() {
        // 创建空的映射，稍后在 ContextRefreshedEvent 时更新
        SimpleUrlHandlerMapping mapping = new SimpleUrlHandlerMapping();
        mapping.setUrlMap(new HashMap<>());
        mapping.setOrder(-1);  // 确保在 HTTP 处理器之前匹配
        
        // 保存引用，以便后续更新
        this.handlerMapping = mapping;
        
        log.info("WebSocket HandlerMapping created (will be updated after ContextRefreshedEvent)");
        
        return mapping;
    }
    
    /**
     * 监听 ContextRefreshedEvent，在应用上下文刷新后更新处理器映射
     * 此时所有带 @WebSocketHandler 注解的处理器已经注册到 WebSocketHandlerRegistry
     * 
     * 注意：只处理根上下文的事件，避免在父子上下文场景下重复处理
     */
    @Override
    public void onApplicationEvent(ContextRefreshedEvent event) {
        // 只处理根上下文的事件，避免在父子上下文场景下重复处理
        if (event.getApplicationContext().getParent() == null && handlerMapping != null) {
            updateHandlerMapping();
        }
    }
    
    /**
     * 更新 HandlerMapping 的 urlMap
     * 从注册表中获取所有处理器并设置到映射中
     */
    private void updateHandlerMapping() {
        Map<String, WebSocketHandler> handlers = handlerRegistry.getHandlers();
        
        if (handlers.isEmpty()) {
            log.warn("No WebSocket handlers registered. If you have WebSocket handlers, ensure they are annotated with @WebSocketHandler and are Spring beans.");
        } else {
            log.info("Updating WebSocket HandlerMapping with {} handler(s)", handlers.size());
            
            Map<String, WebSocketHandler> urlMap = new HashMap<>();
            handlers.forEach((path, handler) -> {
                urlMap.put(path, handler);
                log.info("Registered WebSocket handler: {}", path);
            });
            
            // 更新映射并重新初始化
            handlerMapping.setUrlMap(urlMap);
            // 重新初始化 HandlerMapping 以确保映射生效
            try {
                handlerMapping.initApplicationContext();
                log.info("WebSocket HandlerMapping updated and reinitialized successfully");
            } catch (Exception e) {
                log.error("Failed to reinitialize WebSocket HandlerMapping", e);
            }
        }
    }
}

