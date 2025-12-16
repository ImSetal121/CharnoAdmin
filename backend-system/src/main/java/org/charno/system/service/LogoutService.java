package org.charno.system.service;

import org.charno.commonsecurity.util.TokenUtil;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

/**
 * 登出业务服务
 * 面向业务的业务服务，实现登出相关的业务逻辑
 */
@Service
public class LogoutService {

    private final TokenUtil tokenUtil;

    public LogoutService(TokenUtil tokenUtil) {
        this.tokenUtil = tokenUtil;
    }

    // ==================== 业务逻辑 ====================

    /**
     * 用户登出
     * 删除Redis中的Token
     * 
     * @param token Token字符串
     * @return Mono<Void> 登出操作的结果
     */
    public Mono<Void> logout(String token) {
        // 如果没有Token，直接返回成功（避免信息泄露）
        if (token == null || token.isEmpty()) {
            return Mono.empty();
        }
        
        // 删除Token（无论删除是否成功，都返回成功，避免信息泄露）
        return tokenUtil.deleteToken(token)
                .then()
                .onErrorResume(e -> Mono.empty());
    }
}

