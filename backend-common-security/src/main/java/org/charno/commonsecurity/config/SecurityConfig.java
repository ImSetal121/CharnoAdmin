package org.charno.commonsecurity.config;

import org.charno.commonweb.response.ApiResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.authentication.AuthenticationWebFilter;
import org.springframework.security.web.server.ServerAuthenticationEntryPoint;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

/**
 * Spring Security 配置类
 * 适用于 Spring WebFlux 响应式应用
 */
@Configuration
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
public class SecurityConfig {

    private final TokenReactiveAuthenticationManager authenticationManager;
    private final TokenAuthenticationConverter authenticationConverter;

    public SecurityConfig(TokenReactiveAuthenticationManager authenticationManager) {
        this.authenticationManager = authenticationManager;
        this.authenticationConverter = new TokenAuthenticationConverter();
    }

    /**
     * 配置安全过滤器链
     * 定义哪些路径需要认证，哪些路径可以匿名访问
     *
     * @param http ServerHttpSecurity 实例
     * @return SecurityWebFilterChain
     */
    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        // 创建认证Web过滤器
        AuthenticationWebFilter authenticationWebFilter = new AuthenticationWebFilter(authenticationManager);
        authenticationWebFilter.setServerAuthenticationConverter(authenticationConverter);

        return http
                // 禁用 CSRF（跨站请求伪造）保护
                // 注意：在生产环境中，如果使用 JWT 等 token 认证，可以考虑禁用 CSRF
                // 如果使用 session 认证，建议启用 CSRF 保护
                .csrf(csrf -> csrf.disable())
                
                // 启用 CORS 支持
                // 配合 backend-common-web 模块中的 CorsConfig 使用
                // Spring Security 会自动使用容器中的 CorsWebFilter
                .cors(cors -> {})
                
                // 添加自定义认证过滤器
                // 注意：AuthenticationFilter（Order=-100）会先执行，添加用户信息到请求头
                // 然后这个认证过滤器会从请求头读取用户信息并创建Authentication对象
                .addFilterAt(authenticationWebFilter, SecurityWebFiltersOrder.AUTHENTICATION)
                
                // 配置未认证时的处理
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(authenticationEntryPoint())
                )
                
                // 配置请求授权规则
                .authorizeExchange(exchanges -> exchanges
                        // 允许匿名访问的路径
                        .pathMatchers(
                                "/api/login"       // 登录接口
                        ).permitAll()
                        
                        // 其他所有请求都需要认证
                        .anyExchange().authenticated()
                )
                
                // 构建安全过滤器链
                .build();
    }

    /**
     * 配置未认证时的处理
     * 当请求需要认证但没有有效Token时，返回401错误
     */
    @Bean
    public ServerAuthenticationEntryPoint authenticationEntryPoint() {
        return (exchange, ex) -> {
            ServerWebExchange mutatedExchange = exchange.mutate().response(exchange.getResponse()).build();
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
            
            // 返回JSON格式的错误信息
            ApiResponse<Void> errorResponse = ApiResponse.fail(401, "未授权，请先登录");
            String errorBody = String.format(
                    "{\"code\":%d,\"message\":\"%s\",\"timestamp\":\"%s\"}",
                    errorResponse.getCode(),
                    errorResponse.getMessage(),
                    errorResponse.getTimestamp()
            );
            
            DataBufferFactory bufferFactory = exchange.getResponse().bufferFactory();
            DataBuffer buffer = bufferFactory.wrap(errorBody.getBytes(StandardCharsets.UTF_8));
            
            return exchange.getResponse().writeWith(Mono.just(buffer));
        };
    }
}

