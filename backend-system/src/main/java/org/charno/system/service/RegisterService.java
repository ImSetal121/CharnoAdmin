package org.charno.system.service;

import org.charno.common.security.util.PasswordUtil;
import org.charno.systementity.entity.SysUser;
import org.charno.systementity.repository.SysUserRepository;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.data.relational.core.query.Criteria;
import org.springframework.data.relational.core.query.Query;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * 注册业务服务
 * 面向业务的业务服务，实现注册相关的业务逻辑
 */
@Service
public class RegisterService {

    private final SysUserRepository userRepository;
    private final R2dbcEntityTemplate template;
    private final PasswordUtil passwordUtil;

    public RegisterService(SysUserRepository userRepository, R2dbcEntityTemplate template, PasswordUtil passwordUtil) {
        this.userRepository = userRepository;
        this.template = template;
        this.passwordUtil = passwordUtil;
    }

    // ==================== 业务逻辑 ====================

    /**
     * 用户名密码注册
     * 账号类型固定为 USERNAME
     * 
     * @param username 用户名
     * @param password 密码（明文）
     * @param nickname 昵称
     * @return 注册成功返回用户对象，失败返回错误
     */
    public Mono<SysUser> register(String username, String password, String nickname) {
        // 1. 检查用户名是否已存在（账号类型固定为 USERNAME）
        Criteria criteria = Criteria.where("accountType").is("USERNAME")
                .and(Criteria.where("accountIdentifier").is(username));
        
        return template.select(SysUser.class)
                .matching(Query.query(criteria))
                .one()
                .flatMap(existingUser -> 
                    // 用户名已存在，返回错误
                    Mono.<SysUser>error(new RuntimeException("用户名已存在"))
                )
                .switchIfEmpty(
                    // 用户名不存在，创建新用户
                    Mono.fromCallable(() -> {
                        // 2. 创建新的 SysUser 对象
                        SysUser user = new SysUser();
                        
                        // 3. 设置主键
                        user.setId(UUID.randomUUID());
                        
                        // 4. 设置必填字段
                        user.setAccountType("USERNAME");
                        user.setAccountIdentifier(username);
                        user.setNickname(nickname);
                        
                        // 5. 设置默认值
                        user.setStatus("ENABLED");
                        user.setRoleCode("USER");
                        
                        // 6. 加密密码
                        String passwordHash = passwordUtil.encode(password);
                        user.setPasswordHash(passwordHash);
                        user.setPasswordAlgoVersion(1);
                        
                        // 7. 设置时间戳
                        OffsetDateTime now = OffsetDateTime.now();
                        user.setCreatedAt(now);
                        user.setUpdatedAt(now);
                        user.setPasswordChangedAt(now);
                        
                        // 8. 返回用户对象
                        return user;
                    })
                    .flatMap(user -> userRepository.save(user))
                    .map(savedUser -> {
                        // 9. 清除敏感信息（密码哈希）
                        savedUser.setPasswordHash(null);
                        return savedUser;
                    })
                );
    }
}

