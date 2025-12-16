package org.charno.commonsecurity.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

/**
 * Spring Security 配置类
 * 适用于 Spring WebFlux 响应式应用
 */
@Configuration
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
public class SecurityConfig {

    /**
     * 配置安全过滤器链
     * 定义哪些路径需要认证，哪些路径可以匿名访问
     *
     * @param http ServerHttpSecurity 实例
     * @return SecurityWebFilterChain
     */
    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
                // 禁用 CSRF（跨站请求伪造）保护
                // 注意：在生产环境中，如果使用 JWT 等 token 认证，可以考虑禁用 CSRF
                // 如果使用 session 认证，建议启用 CSRF 保护
                .csrf(csrf -> csrf.disable())
                
                // 启用 CORS 支持
                // 配合 backend-common-web 模块中的 CorsConfig 使用
                // Spring Security 会自动使用容器中的 CorsWebFilter
                .cors(cors -> {})
                
                // 配置请求授权规则
                .authorizeExchange(exchanges -> exchanges
                        // 允许匿名访问的路径
                        .pathMatchers(
                                "/api/test/**",      // 测试接口
                                "/actuator/health",  // 健康检查
                                "/error"            // 错误页面
                        ).permitAll()
                        
                        // 其他所有请求都需要认证
                        .anyExchange().authenticated()
                )
                
                // 构建安全过滤器链
                .build();
    }
}

