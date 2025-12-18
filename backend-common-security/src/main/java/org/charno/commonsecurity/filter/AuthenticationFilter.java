package org.charno.commonsecurity.filter;

import org.charno.commonsecurity.util.TokenUtil;
import org.charno.systementity.entity.SysUser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

/**
 * 身份认证过滤器
 * 验证Token并将用户信息添加到请求头
 * 
 * 过滤器职责：
 * 1. 从Authorization请求头提取Token（如果存在）
 * 2. 使用TokenUtil从Redis获取用户信息（优化：不再查询PostgreSQL）
 * 3. 验证用户状态
 * 4. 将用户信息添加到请求头，供后续Controller使用
 * 5. 如果没有Token或Token无效，不添加用户信息但继续放行（不拦截）
 * 
 * 注意：此过滤器不负责拦截请求，认证拦截由Spring Security处理
 */
@Component
@Order(-100) // 设置较高的优先级，在其他过滤器之前执行
public class AuthenticationFilter implements WebFilter {

    private static final Logger log = LoggerFactory.getLogger(AuthenticationFilter.class);

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    
    // 添加到请求头的用户信息字段
    private static final String USER_ID_HEADER = "X-User-Id";
    private static final String USER_STATUS_HEADER = "X-User-Status";
    private static final String USER_ACCOUNT_TYPE_HEADER = "X-User-Account-Type";
    private static final String USER_ACCOUNT_IDENTIFIER_HEADER = "X-User-Account-Identifier";
    private static final String USER_ROLE_CODE_HEADER = "X-User-Role-Code";

    private final TokenUtil tokenUtil;

    public AuthenticationFilter(TokenUtil tokenUtil) {
        this.tokenUtil = tokenUtil;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        // 从请求头中提取Token
        String token = extractToken(request);
        log.debug("Request method: {}, URI: {}, Has credentials: {}", request.getMethod(), request.getURI(), token != null && !token.isEmpty());

        // 如果没有Token，直接放行（不添加用户信息）
        if (token == null || token.isEmpty()) {
            return chain.filter(exchange);
        }

        // 验证Token并从Redis获取用户信息（优化：不再查询PostgreSQL）
        return tokenUtil.getUserByToken(token)
                .flatMap(user -> {
                    // 检查用户状态，只有ENABLED状态的用户才添加信息
                    if (user.getStatus() != null && "ENABLED".equals(user.getStatus())) {
                        // 将用户信息添加到请求头
                        ServerHttpRequest mutatedRequest = addUserInfoToHeaders(request, user);
                        // 继续过滤器链
                        return chain.filter(exchange.mutate().request(mutatedRequest).build());
                    } else {
                        // 用户状态异常，不添加用户信息但继续放行
                        log.warn("User status is not ENABLED: userId={}, status={}", user.getId(), user.getStatus());
                        return chain.filter(exchange);
                    }
                })
                // Token无效或用户不存在，不添加用户信息但继续放行
                .switchIfEmpty(chain.filter(exchange));
    }

    /**
     * 从请求头中提取Token
     * 支持两种格式：
     * 1. Authorization: Bearer {token}
     * 2. Authorization: {token}
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

    /**
     * 将用户信息添加到请求头
     * 
     * 添加的请求头：
     * - X-User-Id: 用户ID
     * - X-User-Status: 用户状态
     * - X-User-Account-Type: 账号类型
     * - X-User-Account-Identifier: 账号标识符
     * - X-User-Role-Code: 角色代码
     */
    private ServerHttpRequest addUserInfoToHeaders(ServerHttpRequest request, SysUser user) {
        return request.mutate()
                .header(USER_ID_HEADER, user.getId().toString())
                .header(USER_STATUS_HEADER, user.getStatus() != null ? user.getStatus() : "")
                .header(USER_ACCOUNT_TYPE_HEADER, user.getAccountType() != null ? user.getAccountType() : "")
                .header(USER_ACCOUNT_IDENTIFIER_HEADER, user.getAccountIdentifier() != null ? user.getAccountIdentifier() : "")
                .header(USER_ROLE_CODE_HEADER, user.getRoleCode() != null ? user.getRoleCode() : "")
                .build();
    }
}

