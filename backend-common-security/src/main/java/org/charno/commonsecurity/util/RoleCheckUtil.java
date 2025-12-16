package org.charno.commonsecurity.util;

import org.charno.commonsecurity.annotation.RequiresRole;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.reactive.HandlerMapping;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.List;

/**
 * 角色校验工具类
 * 提供获取Controller方法、检查注解、校验角色等方法
 */
public class RoleCheckUtil {

    /**
     * 从ServerWebExchange获取HandlerMethod
     * 
     * @param exchange ServerWebExchange
     * @return Mono<HandlerMethod>，如果无法获取则返回空
     */
    public static Mono<HandlerMethod> getHandlerMethod(ServerWebExchange exchange) {
        Object handler = exchange.getAttribute(HandlerMapping.BEST_MATCHING_HANDLER_ATTRIBUTE);
        if (handler instanceof HandlerMethod) {
            return Mono.just((HandlerMethod) handler);
        }
        return Mono.empty();
    }

    /**
     * 检查方法或类上是否有@RequiresRole注解
     * 优先检查方法上的注解，如果方法上没有，则检查类上的注解
     * 
     * @param handlerMethod HandlerMethod
     * @return RequiresRole注解，如果没有则返回null
     */
    public static RequiresRole getRequiresRoleAnnotation(HandlerMethod handlerMethod) {
        if (handlerMethod == null) {
            return null;
        }

        Method method = handlerMethod.getMethod();
        Class<?> beanType = handlerMethod.getBeanType();

        // 优先检查方法上的注解
        RequiresRole annotation = AnnotatedElementUtils.findMergedAnnotation(method, RequiresRole.class);
        if (annotation != null) {
            return annotation;
        }

        // 如果方法上没有，检查类上的注解
        return AnnotatedElementUtils.findMergedAnnotation(beanType, RequiresRole.class);
    }

    /**
     * 校验角色code是否匹配
     * 支持OR关系：如果用户角色code在requiredRoles数组中，则匹配成功
     * 
     * @param userRoleCode 用户的角色code
     * @param requiredRoles 需要的角色code数组
     * @return true表示匹配成功，false表示匹配失败
     */
    public static boolean isRoleMatched(String userRoleCode, String[] requiredRoles) {
        if (userRoleCode == null || requiredRoles == null || requiredRoles.length == 0) {
            return false;
        }

        List<String> requiredRolesList = Arrays.asList(requiredRoles);
        return requiredRolesList.contains(userRoleCode);
    }

    /**
     * 校验角色code是否匹配（重载方法，支持List）
     * 
     * @param userRoleCode 用户的角色code
     * @param requiredRoles 需要的角色code列表
     * @return true表示匹配成功，false表示匹配失败
     */
    public static boolean isRoleMatched(String userRoleCode, List<String> requiredRoles) {
        if (userRoleCode == null || requiredRoles == null || requiredRoles.isEmpty()) {
            return false;
        }

        return requiredRoles.contains(userRoleCode);
    }
}

