package org.charno.commonsecurity.util;

import org.charno.systementity.entity.SysUser;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.UUID;

/**
 * Token工具类
 * 提供Token生成、存储、查询、删除的便捷方法
 * 
 * 优化：将用户信息与Token一起存储到Redis，避免每次请求都访问PostgreSQL
 */
@Component
public class TokenUtil {

    private static final String TOKEN_PREFIX = "token:";
    private static final long TOKEN_EXPIRE_SECONDS = 604800L; // 7天

    private final ReactiveRedisTemplate<String, Object> redisTemplate;

    public TokenUtil(ReactiveRedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * 生成随机Token
     * 使用UUID生成随机字符串
     *
     * @return Token字符串
     */
    public String generateToken() {
        return UUID.randomUUID().toString();
    }

    /**
     * 保存Token到Redis
     * 将Token和用户信息（SysUser对象）存储到Redis，设置7天过期时间
     *
     * @param token Token字符串
     * @param user  用户对象
     * @return Mono<Void> 保存操作的结果
     */
    public Mono<Void> saveToken(String token, SysUser user) {
        String key = TOKEN_PREFIX + token;
        return redisTemplate.opsForValue()
                .set(key, user, Duration.ofSeconds(TOKEN_EXPIRE_SECONDS))
                .then();
    }

    /**
     * 根据Token获取用户信息
     * 从Redis直接获取用户对象，无需查询数据库
     *
     * @param token Token字符串
     * @return Mono<SysUser> 用户对象，如果Token不存在或已过期则返回空
     */
    public Mono<SysUser> getUserByToken(String token) {
        String key = TOKEN_PREFIX + token;
        return redisTemplate.opsForValue()
                .get(key)
                .cast(SysUser.class)
                .onErrorResume(e -> Mono.empty());
    }

    /**
     * 删除Token
     * 用于登出等场景
     *
     * @param token Token字符串
     * @return Mono<Long> 删除操作的结果（1表示删除成功，0表示Token不存在）
     */
    public Mono<Long> deleteToken(String token) {
        String key = TOKEN_PREFIX + token;
        return redisTemplate.delete(key);
    }
}

