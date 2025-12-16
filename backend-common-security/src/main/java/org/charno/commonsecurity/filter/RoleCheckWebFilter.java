package org.charno.commonsecurity.filter;

import org.charno.commonsecurity.annotation.RequiresRole;
import org.charno.commonsecurity.util.RoleCheckUtil;
import org.charno.commonweb.response.ApiResponse;
import org.charno.systementity.entity.SysRole;
import org.charno.systementity.repository.SysRoleRepository;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.reactive.HandlerMapping;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

/**
 * 角色校验过滤器
 * 检查Controller方法上的@RequiresRole注解，校验当前用户的角色权限
 * 
 * 执行顺序：Order(0)，在HandlerMapping之后执行，以便获取HandlerMethod
 * 
 * 工作流程：
 * 1. 检查请求对应的Controller方法是否有@RequiresRole注解
 * 2. 如果没有注解，直接放行
 * 3. 如果有注解，从请求头获取X-User-Role-Id
 * 4. 根据roleId查询角色信息
 * 5. 校验用户的角色code是否匹配注解中要求的角色
 * 6. 如果匹配，放行；如果不匹配，返回403 Forbidden
 */
@Component
@Order(0) // 在HandlerMapping之后执行，以便获取HandlerMethod
public class RoleCheckWebFilter implements WebFilter {

    private static final String USER_ROLE_ID_HEADER = "X-User-Role-Id";

    private final SysRoleRepository roleRepository;

    public RoleCheckWebFilter(SysRoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        // 获取HandlerMethod
        return RoleCheckUtil.getHandlerMethod(exchange)
                .flatMap(handlerMethod -> {
                    // 检查是否有@RequiresRole注解
                    RequiresRole annotation = RoleCheckUtil.getRequiresRoleAnnotation(handlerMethod);
                    if (annotation == null) {
                        // 没有注解，直接放行
                        return chain.filter(exchange);
                    }

                    // 有注解，需要校验角色
                    String[] requiredRoles = annotation.value();
                    if (requiredRoles == null || requiredRoles.length == 0) {
                        // 注解中没有指定角色，直接放行
                        return chain.filter(exchange);
                    }

                    // 从请求头获取roleId
                    String roleIdStr = exchange.getRequest().getHeaders().getFirst(USER_ROLE_ID_HEADER);
                    if (roleIdStr == null || roleIdStr.isEmpty()) {
                        // 没有roleId，返回403（用户可能未认证，但由Spring Security处理401）
                        // 这里返回403是因为方法需要角色权限，但用户没有角色信息
                        return handleForbidden(exchange);
                    }

                    try {
                        Long roleId = Long.parseLong(roleIdStr);
                        
                        // 查询角色信息
                        return roleRepository.findById(roleId)
                                .flatMap(role -> {
                                    // 校验角色code是否匹配
                                    if (RoleCheckUtil.isRoleMatched(role.getCode(), requiredRoles)) {
                                        // 角色匹配，放行
                                        return chain.filter(exchange);
                                    } else {
                                        // 角色不匹配，返回403
                                        return handleForbidden(exchange);
                                    }
                                })
                                .switchIfEmpty(handleForbidden(exchange)); // 角色不存在，返回403
                    } catch (NumberFormatException e) {
                        // roleId格式错误，返回403
                        return handleForbidden(exchange);
                    }
                })
                // 无法获取HandlerMethod，可能是静态资源或其他非Controller请求，直接放行
                .switchIfEmpty(chain.filter(exchange));
    }

    /**
     * 处理403 Forbidden响应
     * 
     * @param exchange ServerWebExchange
     * @return Mono<Void>
     */
    private Mono<Void> handleForbidden(ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);

        ApiResponse<Void> errorResponse = ApiResponse.fail(403, "禁止访问：需要角色权限");
        String errorBody = String.format(
                "{\"code\":%d,\"message\":\"%s\",\"timestamp\":\"%s\"}",
                errorResponse.getCode(),
                errorResponse.getMessage(),
                errorResponse.getTimestamp()
        );

        DataBufferFactory bufferFactory = exchange.getResponse().bufferFactory();
        DataBuffer buffer = bufferFactory.wrap(errorBody.getBytes(StandardCharsets.UTF_8));

        return exchange.getResponse().writeWith(Mono.just(buffer));
    }
}

