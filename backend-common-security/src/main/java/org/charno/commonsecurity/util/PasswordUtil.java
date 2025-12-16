package org.charno.commonsecurity.util;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * 密码工具类
 * 提供密码加密和验证的便捷方法
 */
@Component
public class PasswordUtil {

    private final PasswordEncoder passwordEncoder;

    public PasswordUtil(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * 加密密码
     *
     * @param rawPassword 原始密码（明文）
     * @return 加密后的密码（密文）
     */
    public String encode(String rawPassword) {
        return passwordEncoder.encode(rawPassword);
    }

    /**
     * 验证密码
     *
     * @param rawPassword     原始密码（明文）
     * @param encodedPassword 加密后的密码（密文）
     * @return true 如果密码匹配，false 否则
     */
    public boolean matches(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }

    /**
     * 检查密码是否需要重新加密
     * 当密码编码器升级时，可以使用此方法判断是否需要更新已存储的密码
     *
     * @param encodedPassword 加密后的密码
     * @return true 如果需要重新加密，false 否则
     */
    public boolean upgradeEncoding(String encodedPassword) {
        return passwordEncoder.upgradeEncoding(encodedPassword);
    }
}

