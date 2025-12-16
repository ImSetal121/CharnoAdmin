package org.charno.start;

import org.charno.commonsecurity.util.PasswordUtil;
import org.charno.systementity.entity.SysRole;
import org.charno.systementity.entity.SysUser;
import org.charno.systementity.repository.SysUserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.data.relational.core.query.Criteria;
import org.springframework.data.relational.core.query.Query;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.OffsetDateTime;
import java.util.UUID;

@SpringBootTest(classes = BackendStartApplication.class)
class BackendStartApplicationTests {

    @Autowired
    private SysUserRepository userRepository;

    @Autowired
    private R2dbcEntityTemplate template;

    @Autowired
    private PasswordUtil passwordUtil;

    @Test
    void contextLoads() {
    }

    /**
     * 测试创建用户
     */
    @Test
    void testCreateUser() {
        // 查询已存在的 ADMIN 角色
        Mono<SysRole> roleMono = template.select(SysRole.class)
                .matching(Query.query(Criteria.where("code").is("ADMIN")))
                .one();

        // 创建用户对象
        Mono<SysUser> createUserMono = roleMono.flatMap(role -> {
            SysUser user = new SysUser();
            UUID userId = UUID.randomUUID();
            user.setId(userId);
            user.setStatus("ENABLED");
            user.setAccountType("USERNAME");
            user.setAccountIdentifier("root");
            
            // 设置角色代码
            user.setRoleCode(role.getCode());
            
            // 加密密码
            String rawPassword = "X83iXPrNw5pFd";
            String passwordHash = passwordUtil.encode(rawPassword);
            user.setPasswordHash(passwordHash);
            user.setPasswordAlgoVersion(1);
            user.setPasswordChangedAt(OffsetDateTime.now());
            
            // 设置用户基本信息
            user.setNickname("超级管理员");
            user.setGender("UNKNOWN");
            user.setLocale("zh-CN");
            user.setTimezone("Asia/Guangdong");
            
            // 设置时间戳
            OffsetDateTime now = OffsetDateTime.now();
            user.setCreatedAt(now);
            user.setUpdatedAt(now);

            // 保存用户（使用 Repository，它会正确处理 AggregateReference）
            return userRepository.save(user)
                    .flatMap(savedUser -> {
                        // 验证用户信息
                        boolean isValid = savedUser.getId() != null
                                && "ENABLED".equals(savedUser.getStatus())
                                && "USERNAME".equals(savedUser.getAccountType())
                                && "root".equals(savedUser.getAccountIdentifier())
                                && savedUser.getPasswordHash() != null
                                && "超级管理员".equals(savedUser.getNickname())
                                && savedUser.getRoleCode() != null;

                        if (!isValid) {
                            return Mono.error(new AssertionError("用户信息验证失败"));
                        }

                        // 验证密码是否正确
                        return userRepository.findById(savedUser.getId())
                                .map(u -> passwordUtil.matches(rawPassword, u.getPasswordHash()))
                                .flatMap(matches -> {
                                    if (!matches) {
                                        return Mono.error(new AssertionError("密码验证失败"));
                                    }
                                    return Mono.just(savedUser);
                                });
                    });
        });

        StepVerifier.create(createUserMono)
                .expectNextMatches(savedUser -> {
                    // 最终验证
                    return savedUser.getId() != null
                            && "ENABLED".equals(savedUser.getStatus())
                            && "USERNAME".equals(savedUser.getAccountType())
                            && "root".equals(savedUser.getAccountIdentifier())
                            && savedUser.getPasswordHash() != null
                            && "超级管理员".equals(savedUser.getNickname())
                            && savedUser.getRoleCode() != null;
                })
                .verifyComplete();
    }

}
