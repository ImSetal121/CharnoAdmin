package org.charno.common.web.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.Collections;

/**
 * 跨域访问（CORS）配置类
 * 适用于 Spring WebFlux 响应式应用
 */
@Configuration
public class CorsConfig {

    /**
     * 配置 CORS 过滤器
     * 允许跨域请求访问后端 API
     *
     * @return CorsWebFilter
     */
    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfiguration = new CorsConfiguration();
        
        // 允许的源（域名）
        // 开发环境：允许所有源（*）
        // 生产环境：建议配置具体的域名，如：Arrays.asList("https://example.com", "https://www.example.com")
        corsConfiguration.setAllowedOriginPatterns(Collections.singletonList("*"));
        
        // 允许的请求方法
        corsConfiguration.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
        ));
        
        // 允许的请求头
        corsConfiguration.setAllowedHeaders(Collections.singletonList("*"));
        
        // 允许发送凭证（Cookie、Authorization 等）
        corsConfiguration.setAllowCredentials(true);
        
        // 允许暴露的响应头
        corsConfiguration.setExposedHeaders(Arrays.asList(
                "Content-Type",
                "Authorization",
                "X-Total-Count",
                "Access-Control-Allow-Origin",
                "Access-Control-Allow-Credentials"
        ));
        
        // 预检请求的缓存时间（秒）
        // 浏览器在发送实际请求前会先发送 OPTIONS 预检请求
        // 设置此值后，浏览器会缓存预检请求结果，在指定时间内不再发送预检请求
        corsConfiguration.setMaxAge(3600L);
        
        // 配置 URL 路径映射
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // 对所有路径应用 CORS 配置
        source.registerCorsConfiguration("/**", corsConfiguration);
        
        return new CorsWebFilter(source);
    }
}

