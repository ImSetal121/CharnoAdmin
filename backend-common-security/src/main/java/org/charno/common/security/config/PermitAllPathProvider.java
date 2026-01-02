package org.charno.common.security.config;

import java.util.List;

/**
 * 允许匿名访问的路径提供者接口
 * 定制模块可以实现此接口，注册需要放行的路径
 * 
 * 使用方式：
 * @Component
 * public class CustomSecurityPathProvider implements PermitAllPathProvider {
 *     @Override
 *     public List<String> getPermitAllPaths() {
 *         return Arrays.asList(
 *             "/api/custom/callback",
 *             "/api/custom/**"
 *         );
 *     }
 * }
 * 
 * Spring 会自动收集所有实现此接口的 Bean，并在 SecurityConfig 中注册为放行路径。
 * 
 * @author CharnoAdmin
 * @since 1.0.0
 */
public interface PermitAllPathProvider {
    
    /**
     * 获取需要放行的路径列表
     * 支持精确路径（如 "/api/wechat/callback"）和通配符路径（如 "/api/wechat/**"）
     * 
     * 路径格式说明：
     * - 精确路径："/api/custom/callback"
     * - 通配符路径："/api/custom/**"
     * - Ant 风格路径："/api/custom/{星号}/callback"（星号表示单个路径段）
     * 
     * 注意事项：
     * - 返回的列表不能为 null，如果不需要注册路径，返回空列表
     * - 多个模块可能注册相同路径，SecurityConfig 会自动去重
     * - 通配符路径应放在精确路径之后，以确保匹配顺序正确
     * - 应谨慎注册路径，避免暴露敏感接口
     * 
     * @return 路径列表，不能为 null
     */
    List<String> getPermitAllPaths();
}

