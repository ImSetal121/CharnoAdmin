package org.charno.system.controller;

import org.charno.common.web.response.ApiResponse;
import org.charno.system.service.LogoutService;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * 登出控制器
 * 面向业务的控制类，实现登出相关的业务功能
 */
@RestController
@RequestMapping("/api/logout")
public class LogoutController {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final LogoutService logoutService;

    public LogoutController(LogoutService logoutService) {
        this.logoutService = logoutService;
    }

    /**
     * 用户登出
     * 从请求头提取Token并删除Redis中的Token
     * 
     * @param exchange ServerWebExchange，用于获取请求头
     * @return 响应结果
     */
    @PostMapping
    public Mono<ApiResponse<Void>> logout(ServerWebExchange exchange) {
        ServerHttpRequest request = exchange.getRequest();
        
        // 从请求头中提取Token
        String token = extractToken(request);
        
        // 调用业务层处理登出逻辑
        return logoutService.logout(token)
                .then(Mono.just(ApiResponse.<Void>success()))
                .onErrorResume(e -> Mono.just(ApiResponse.<Void>success()));
    }

    /**
     * 从请求头中提取Token
     * 支持两种格式：
     * 1. Authorization: Bearer {token}
     * 2. Authorization: {token}
     * 
     * @param request ServerHttpRequest
     * @return Token字符串，如果不存在则返回null
     */
    private String extractToken(ServerHttpRequest request) {
        String authorization = request.getHeaders().getFirst(AUTHORIZATION_HEADER);
        if (authorization == null || authorization.isEmpty()) {
            return null;
        }

        // 移除Bearer前缀（如果存在）
        if (authorization.startsWith(BEARER_PREFIX)) {
            return authorization.substring(BEARER_PREFIX.length()).trim();
        }

        return authorization.trim();
    }
}

