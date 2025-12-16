package org.charno.commonsecurity.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 角色校验注解
 * 用于在Controller类或方法上标注需要的角色权限
 * 
 * 支持单个角色：@RequiresRole("ADMIN")
 * 支持多个角色（OR关系）：@RequiresRole({"ADMIN", "MANAGER"})
 * 
 * 使用示例：
 * <pre>
 * @RequiresRole("ADMIN")
 * @DeleteMapping("/{id}")
 * public Mono<ApiResponse<Void>> delete(@PathVariable UUID id) {
 *     // 只有ADMIN角色可以访问
 * }
 * </pre>
 */
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequiresRole {
    
    /**
     * 需要的角色code数组
     * 如果指定多个角色，使用OR关系（满足任意一个即可）
     * 
     * @return 角色code数组
     */
    String[] value();
}

