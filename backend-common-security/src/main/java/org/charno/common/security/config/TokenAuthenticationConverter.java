package org.charno.common.security.config;

import org.springframework.security.core.Authentication;
import org.springframework.security.web.server.authentication.ServerAuthenticationConverter;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.UUID;

/**
 * Token认证转换器
 * 从请求头中提取用户信息并创建Authentication对象
 * 
 * 工作原理：
 * 1. AuthenticationFilter已经验证Token并将用户信息添加到请求头
 * 2. 此转换器从请求头中读取X-User-Id
 * 3. 如果存在X-User-Id，说明用户已认证，创建Authentication对象
 * 4. 如果不存在，返回空Mono（表示未认证）
 */
public class TokenAuthenticationConverter implements ServerAuthenticationConverter {

    private static final String USER_ID_HEADER = "X-User-Id";

    @Override
    public Mono<Authentication> convert(ServerWebExchange exchange) {
        String userId = exchange.getRequest().getHeaders().getFirst(USER_ID_HEADER);
        
        // 如果请求头中没有用户ID，说明未认证
        if (userId == null || userId.isEmpty()) {
            return Mono.empty();
        }

        try {
            // 解析用户ID
            UUID userUuid = UUID.fromString(userId);
            
            // 创建Authentication对象
            // 使用UsernamePasswordAuthenticationToken，用户名设置为用户ID的字符串形式
            // 可以添加角色权限，这里暂时使用空权限列表
            TokenAuthenticationToken authentication = new TokenAuthenticationToken(
                    userUuid.toString(),
                    null,
                    Collections.emptyList()
            );
            
            return Mono.just(authentication);
        } catch (IllegalArgumentException e) {
            // 用户ID格式无效
            return Mono.empty();
        }
    }
}

