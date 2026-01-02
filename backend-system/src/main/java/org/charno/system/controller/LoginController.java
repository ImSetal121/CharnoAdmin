package org.charno.system.controller;

import org.charno.common.web.response.ApiResponse;
import org.charno.systementity.entity.SysUser;
import org.charno.system.service.LoginService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * 登录控制器
 * 面向业务的控制类，实现登录相关的业务功能
 */
@RestController
@RequestMapping("/api/login")
public class LoginController {

    private final LoginService loginService;

    public LoginController(LoginService loginService) {
        this.loginService = loginService;
    }

    /**
     * 用户名密码登录
     * 账号类型固定为 USERNAME
     * 
     * @param requestBody 请求体，包含 username、password
     * @param exchange ServerWebExchange，用于获取客户端IP
     * @return 响应结果，包含用户信息和accessToken
     */
    @PostMapping
    public Mono<ApiResponse<Map<String, Object>>> login(
            @RequestBody Map<String, String> requestBody,
            ServerWebExchange exchange) {
        
        String username = requestBody.get("username");
        String password = requestBody.get("password");
        
        // 参数验证
        if (username == null || username.isEmpty()) {
            return Mono.just(ApiResponse.fail("用户名不能为空"));
        }
        if (password == null || password.isEmpty()) {
            return Mono.just(ApiResponse.fail("密码不能为空"));
        }
        
        // 获取客户端IP地址
        String clientIp = getClientIp(exchange);
        
        return loginService.login(username, password, clientIp)
                .map(result -> {
                    // 清除敏感信息（密码哈希）
                    SysUser user = (SysUser) result.get("user");
                    if (user != null) {
                        user.setPasswordHash(null);
                    }
                    return ApiResponse.success(result);
                })
                .onErrorResume(e -> Mono.just(ApiResponse.fail(e.getMessage())));
    }

    // TODO: 第三方登录接口（暂未实现）
    // 每个登录方法对应一种账户类型
    
    // /**
    //  * Google登录
    //  * 账号类型固定为 GOOGLE
    //  * 
    //  * @param requestBody 请求体，包含 googleId
    //  * @param exchange ServerWebExchange，用于获取客户端IP
    //  * @return 响应结果
    //  */
    // @PostMapping("/google")
    // public Mono<ApiResponse<SysUser>> loginByGoogle(
    //         @RequestBody Map<String, String> requestBody,
    //         ServerWebExchange exchange) {
    //     // TODO: 实现Google登录接口
    //     return Mono.just(ApiResponse.fail("功能暂未实现"));
    // }
    
    // /**
    //  * 微信登录
    //  * 账号类型固定为 WECHAT
    //  * 
    //  * @param requestBody 请求体，包含 wechatOpenId
    //  * @param exchange ServerWebExchange，用于获取客户端IP
    //  * @return 响应结果
    //  */
    // @PostMapping("/wechat")
    // public Mono<ApiResponse<SysUser>> loginByWechat(
    //         @RequestBody Map<String, String> requestBody,
    //         ServerWebExchange exchange) {
    //     // TODO: 实现微信登录接口
    //     return Mono.just(ApiResponse.fail("功能暂未实现"));
    // }

    /**
     * 获取客户端IP地址
     * 优先从X-Forwarded-For头获取（适用于反向代理场景），否则从请求中获取
     */
    private String getClientIp(ServerWebExchange exchange) {
        String xForwardedFor = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // X-Forwarded-For可能包含多个IP，取第一个
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = exchange.getRequest().getHeaders().getFirst("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        // 从远程地址获取
        if (exchange.getRequest().getRemoteAddress() != null) {
            return exchange.getRequest().getRemoteAddress().getAddress().getHostAddress();
        }
        
        return "unknown";
    }
}

