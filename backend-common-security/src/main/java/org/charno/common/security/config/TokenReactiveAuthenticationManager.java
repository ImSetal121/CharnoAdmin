package org.charno.common.security.config;

import org.springframework.security.authentication.ReactiveAuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * Token响应式认证管理器
 * 
 * 由于AuthenticationFilter已经验证了Token并添加了用户信息到请求头，
 * TokenAuthenticationConverter已经创建了Authentication对象，
 * 这里只需要直接返回认证对象即可（无需再次验证）
 */
@Component
public class TokenReactiveAuthenticationManager implements ReactiveAuthenticationManager {

    @Override
    public Mono<Authentication> authenticate(Authentication authentication) {
        // 如果已经是TokenAuthenticationToken类型，说明已经通过验证，直接返回
        if (authentication instanceof TokenAuthenticationToken && authentication.isAuthenticated()) {
            return Mono.just(authentication);
        }
        
        // 其他情况返回空（未认证）
        return Mono.empty();
    }
}

