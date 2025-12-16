package org.charno.commonsecurity.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * 密码编码器配置类
 * 使用 Spring Security 自带的 BCryptPasswordEncoder 实现密码加密
 */
@Configuration
public class PasswordEncoderConfig {

    /**
     * 配置密码编码器
     * BCryptPasswordEncoder 是 Spring Security 推荐的密码加密方式
     * 使用 BCrypt 算法进行单向哈希加密，每次加密结果都不同，但可以验证
     *
     * @return PasswordEncoder 实例
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        // BCryptPasswordEncoder 的强度参数默认为 10
        // 强度越高，加密时间越长，安全性越高（范围：4-31，推荐：10-12）
        return new BCryptPasswordEncoder(12);
    }
}

