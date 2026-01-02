package org.charno.commonwebsocket.handler;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;

import java.util.HashMap;
import java.util.Map;

/**
 * WebSocket 处理器注册表
 * 管理所有注册的 WebSocket 处理器
 * 
 * 在应用启动时自动收集所有带 @WebSocketHandler 注解的处理器
 */
@Slf4j
@Component
@Order(1)  // 确保先执行，注册处理器
public class WebSocketHandlerRegistry implements ApplicationListener<ContextRefreshedEvent> {
    
    /**
     * 存储处理器：key = path, value = WebSocketHandler
     */
    private final Map<String, WebSocketHandler> handlers = new HashMap<>();
    
    private ApplicationContext applicationContext;
    
    @Override
    public void onApplicationEvent(ContextRefreshedEvent event) {
        // 只处理根上下文的事件，避免在父子上下文场景下重复处理
        if (event.getApplicationContext().getParent() == null) {
            this.applicationContext = event.getApplicationContext();
            registerHandlers();
        }
    }
    
    /**
     * 注册所有带 @WebSocketHandler 注解的处理器
     */
    private void registerHandlers() {
        if (applicationContext == null) {
            return;
        }
        
        // 获取所有带 @WebSocketHandler 注解的 Bean
        // 使用完全限定名避免与 Spring 的 WebSocketHandler 接口冲突
        applicationContext.getBeansWithAnnotation(org.charno.commonwebsocket.annotation.WebSocketHandler.class)
                .forEach((beanName, bean) -> {
                    if (bean instanceof WebSocketHandler handler) {
                        org.charno.commonwebsocket.annotation.WebSocketHandler annotation = 
                                bean.getClass().getAnnotation(org.charno.commonwebsocket.annotation.WebSocketHandler.class);
                        if (annotation != null) {
                            String path = annotation.path();
                            registerHandler(path, handler);
                            log.info("Registered WebSocket handler: {} -> {}", path, beanName);
                        }
                    }
                });
    }
    
    /**
     * 注册处理器
     * 
     * @param path WebSocket 路径
     * @param handler WebSocket 处理器
     */
    public void registerHandler(String path, WebSocketHandler handler) {
        if (handlers.containsKey(path)) {
            log.warn("WebSocket handler for path {} already exists, will be replaced", path);
        }
        handlers.put(path, handler);
    }
    
    /**
     * 获取所有处理器
     * 
     * @return 处理器映射（path -> handler）
     */
    public Map<String, WebSocketHandler> getHandlers() {
        return new HashMap<>(handlers);
    }
    
    /**
     * 获取指定路径的处理器
     * 
     * @param path WebSocket 路径
     * @return WebSocket 处理器，如果不存在返回 null
     */
    public WebSocketHandler getHandler(String path) {
        return handlers.get(path);
    }
}

