package org.charno.common.security.config;

import lombok.extern.slf4j.Slf4j;
import org.charno.common.web.response.ApiResponse;
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
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Spring Security 配置类
 * 适用于 Spring WebFlux 响应式应用
 * 
 * <p>支持定制模块通过实现 {@link PermitAllPathProvider} 接口注册需要放行的路径</p>
 */
@Slf4j
@Configuration
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
public class SecurityConfig {

    private final TokenReactiveAuthenticationManager authenticationManager;
    private final TokenAuthenticationConverter authenticationConverter;
    private final List<PermitAllPathProvider> permitAllPathProviders;

    public SecurityConfig(
            TokenReactiveAuthenticationManager authenticationManager,
            List<PermitAllPathProvider> permitAllPathProviders) {
        this.authenticationManager = authenticationManager;
        this.authenticationConverter = new TokenAuthenticationConverter();
        // 如果定制模块没有实现 PermitAllPathProvider，Spring 会注入空列表
        this.permitAllPathProviders = permitAllPathProviders != null ? permitAllPathProviders : new ArrayList<>();
    }

    /**
     * 配置安全过滤器链
     * 定义哪些路径需要认证，哪些路径可以匿名访问
     * 
     * 路径收集逻辑：
     * - 系统模块路径：通过 backend-system 模块的 ModuleInitialization 实现 PermitAllPathProvider 注册
     * - 定制模块路径：通过定制模块实现 PermitAllPathProvider 接口注册
     * - 自动去重：多个模块注册相同路径时自动去重
     *
     * @param http ServerHttpSecurity 实例
     * @return SecurityWebFilterChain
     */
    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        // 创建认证Web过滤器
        AuthenticationWebFilter authenticationWebFilter = new AuthenticationWebFilter(authenticationManager);
        authenticationWebFilter.setServerAuthenticationConverter(authenticationConverter);

        // 收集所有需要放行的路径
        List<String> allPermitAllPaths = collectPermitAllPaths();
        
        // 记录所有注册的路径（用于调试）
        if (log.isInfoEnabled() && !allPermitAllPaths.isEmpty()) {
            log.info("注册的匿名访问路径: {}", allPermitAllPaths);
        }

        // 配置基础安全设置
        ServerHttpSecurity httpSecurity = http
                // 禁用 CSRF（跨站请求伪造）保护
                // 注意：在生产环境中，如果使用 JWT 等 token 认证，可以考虑禁用 CSRF
                // 如果使用 session 认证，建议启用 CSRF 保护
                .csrf(csrf -> csrf.disable())
                
                // 启用 CORS 支持
                // 配合 backend-common-web 模块中的 CorsConfig 使用
                // Spring Security 会自动使用容器中的 CorsWebFilter
                .cors(cors -> {})
                
                // 添加自定义认证过滤器
                // 注意：
                // 1. AuthenticationFilter（Order=-100）会先执行，添加用户信息到请求头
                // 2. RoleCheckWebFilter（Order=0）在HandlerMapping之后执行，校验角色权限
                // 3. 然后这个认证过滤器会从请求头读取用户信息并创建Authentication对象
                .addFilterAt(authenticationWebFilter, SecurityWebFiltersOrder.AUTHENTICATION)
                
                // 配置未认证和权限不足时的处理
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(authenticationEntryPoint())
                        // 注意：RoleCheckWebFilter已经处理了403错误，这里配置的accessDeniedHandler
                        // 主要用于Spring Security层面的权限校验失败（当前未使用）
                );
        
        // 配置请求授权规则
        // authorizeExchange 接受一个 Consumer，不需要返回值
        httpSecurity.authorizeExchange(exchanges -> {
            // 允许 OPTIONS 请求（CORS 预检请求）
            ServerHttpSecurity.AuthorizeExchangeSpec spec = exchanges
                    .pathMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll();
            
            // 配置所有模块注册的路径（系统模块和定制模块）
            if (!allPermitAllPaths.isEmpty()) {
                spec = spec.pathMatchers(allPermitAllPaths.toArray(new String[0])).permitAll();
            }
            
            // 其他所有请求都需要认证
            spec.anyExchange().authenticated();
        });
        
        return httpSecurity.build();
    }
    
    /**
     * 收集所有需要放行的路径
     * 从所有 PermitAllPathProvider 实现中收集路径（包括系统模块和定制模块）
     * 
     * @return 去重后的路径列表
     */
    private List<String> collectPermitAllPaths() {
        // 收集所有模块（系统模块和定制模块）注册的路径
        List<String> allPaths = permitAllPathProviders.stream()
                .flatMap(provider -> {
                    try {
                        List<String> paths = provider.getPermitAllPaths();
                        if (paths == null) {
                            log.warn("PermitAllPathProvider {} 返回了 null，已忽略", provider.getClass().getName());
                            return java.util.stream.Stream.<String>empty();
                        }
                        return paths.stream();
                    } catch (Exception e) {
                        log.error("获取 PermitAllPathProvider {} 的路径时发生错误", provider.getClass().getName(), e);
                        return java.util.stream.Stream.<String>empty();
                    }
                })
                .distinct()  // 去重
                .collect(Collectors.toList());
        
        return allPaths;
    }

    /**
     * 配置未认证时的处理
     * 当请求需要认证但没有有效Token时，返回401错误
     */
    @Bean
    public ServerAuthenticationEntryPoint authenticationEntryPoint() {
        return (exchange, ex) -> {
            // 检查响应是否已提交，如果已提交则不再处理
            if (exchange.getResponse().isCommitted()) {
                return Mono.empty();
            }
            
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

