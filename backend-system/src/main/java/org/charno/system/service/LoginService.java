package org.charno.system.service;

import org.charno.common.security.util.PasswordUtil;
import org.charno.common.security.util.TokenUtil;
import org.charno.systementity.entity.SysUser;
import org.charno.systementity.repository.SysUserRepository;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.data.relational.core.query.Criteria;
import org.springframework.data.relational.core.query.Query;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 登录业务服务
 * 面向业务的业务服务，实现登录相关的业务逻辑
 */
@Service
public class LoginService {

    private final SysUserRepository userRepository;
    private final R2dbcEntityTemplate template;
    private final PasswordUtil passwordUtil;
    private final TokenUtil tokenUtil;

    public LoginService(SysUserRepository userRepository, R2dbcEntityTemplate template, PasswordUtil passwordUtil, TokenUtil tokenUtil) {
        this.userRepository = userRepository;
        this.template = template;
        this.passwordUtil = passwordUtil;
        this.tokenUtil = tokenUtil;
    }

    // ==================== 业务逻辑 ====================

    /**
     * 用户名密码登录
     * 账号类型固定为 USERNAME
     * 
     * @param username 用户名
     * @param password 密码（明文）
     * @param loginIp 登录IP地址
     * @return 登录成功返回包含用户信息和Token的Map，失败返回错误
     */
    public Mono<Map<String, Object>> login(String username, String password, String loginIp) {
        // 1. 根据用户名查询用户（账号类型固定为 USERNAME）
        Criteria criteria = Criteria.where("accountType").is("USERNAME")
                .and(Criteria.where("accountIdentifier").is(username));
        
        return template.select(SysUser.class)
                .matching(Query.query(criteria))
                .one()
                .flatMap(user -> {
                    // 2. 检查用户状态
                    if (user.getStatus() == null || !"ENABLED".equals(user.getStatus())) {
                        return Mono.error(new RuntimeException("用户已被禁用或锁定"));
                    }
                    
                    // 3. 验证密码
                    if (user.getPasswordHash() == null || 
                        !passwordUtil.matches(password, user.getPasswordHash())) {
                        return Mono.error(new RuntimeException("账号或密码错误"));
                    }
                    
                    // 4. 更新登录时间和IP
                    user.setLastLoginAt(OffsetDateTime.now());
                    user.setLastLoginIp(loginIp);
                    
                    // 5. 保存用户信息
                    return userRepository.save(user)
                            .flatMap(savedUser -> {
                                // 6. 生成Token
                                String token = tokenUtil.generateToken();
                                
                                // 7. 保存Token和用户信息到Redis（优化：避免每次请求都查询数据库）
                                return tokenUtil.saveToken(token, savedUser)
                                        .then(Mono.fromCallable(() -> {
                                            // 8. 构建返回结果（不单独声明DTO，使用Map）
                                            Map<String, Object> result = new HashMap<>();
                                            result.put("user", savedUser);
                                            result.put("accessToken", token);
                                            return result;
                                        }));
                            });
                })
                .switchIfEmpty(Mono.error(new RuntimeException("账号或密码错误")));
    }

    // TODO: 第三方登录方法（暂未实现）
    // 每个登录方法对应一种账户类型
    
    // /**
    //  * Google登录
    //  * 账号类型固定为 GOOGLE
    //  * 
    //  * @param googleId Google账号ID
    //  * @param loginIp 登录IP地址
    //  * @return 登录成功返回用户信息，失败返回错误
    //  */
    // public Mono<SysUser> loginByGoogle(String googleId, String loginIp) {
    //     // TODO: 实现Google登录逻辑
    //     return Mono.empty();
    // }
    
    // /**
    //  * 微信登录
    //  * 账号类型固定为 WECHAT
    //  * 
    //  * @param wechatOpenId 微信OpenID
    //  * @param loginIp 登录IP地址
    //  * @return 登录成功返回用户信息，失败返回错误
    //  */
    // public Mono<SysUser> loginByWechat(String wechatOpenId, String loginIp) {
    //     // TODO: 实现微信登录逻辑
    //     return Mono.empty();
    // }
}

