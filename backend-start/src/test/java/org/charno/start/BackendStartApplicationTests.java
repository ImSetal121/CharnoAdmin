package org.charno.start;

import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(classes = BackendStartApplication.class)
class BackendStartApplicationTests {

//    @Autowired
//    private SysUserRepository userRepository;
//
//    @Autowired
//    private R2dbcEntityTemplate template;
//
//    @Autowired
//    private PasswordUtil passwordUtil;
//
//    @Test
//    void contextLoads() {
//    }
//
//    /**
//     * 测试创建用户
//     */
//    @Test
//    void testCreateUser() {
//        // 查询已存在的 ADMIN 角色
//        Mono<SysRole> roleMono = template.select(SysRole.class)
//                .matching(Query.query(Criteria.where("code").is("ADMIN")))
//                .one();
//
//        // 创建用户对象
//        Mono<SysUser> createUserMono = roleMono.flatMap(role -> {
//            SysUser user = new SysUser();
//            UUID userId = UUID.randomUUID();
//            user.setId(userId);
//            user.setStatus("ENABLED");
//            user.setAccountType("USERNAME");
//            user.setAccountIdentifier("root");
//
//            // 设置角色代码
//            user.setRoleCode(role.getCode());
//
//            // 加密密码
//            String rawPassword = "X83iXPrNw5pFd";
//            String passwordHash = passwordUtil.encode(rawPassword);
//            user.setPasswordHash(passwordHash);
//            user.setPasswordAlgoVersion(1);
//            user.setPasswordChangedAt(OffsetDateTime.now());
//
//            // 设置用户基本信息
//            user.setNickname("超级管理员");
//            user.setGender("UNKNOWN");
//            user.setLocale("zh-CN");
//            user.setTimezone("Asia/Guangdong");
//
//            // 设置时间戳
//            OffsetDateTime now = OffsetDateTime.now();
//            user.setCreatedAt(now);
//            user.setUpdatedAt(now);
//
//            // 保存用户（使用 Repository，它会正确处理 AggregateReference）
//            return userRepository.save(user)
//                    .flatMap(savedUser -> {
//                        // 验证用户信息
//                        boolean isValid = savedUser.getId() != null
//                                && "ENABLED".equals(savedUser.getStatus())
//                                && "USERNAME".equals(savedUser.getAccountType())
//                                && "root".equals(savedUser.getAccountIdentifier())
//                                && savedUser.getPasswordHash() != null
//                                && "超级管理员".equals(savedUser.getNickname())
//                                && savedUser.getRoleCode() != null;
//
//                        if (!isValid) {
//                            return Mono.error(new AssertionError("用户信息验证失败"));
//                        }
//
//                        // 验证密码是否正确
//                        return userRepository.findById(savedUser.getId())
//                                .map(u -> passwordUtil.matches(rawPassword, u.getPasswordHash()))
//                                .flatMap(matches -> {
//                                    if (!matches) {
//                                        return Mono.error(new AssertionError("密码验证失败"));
//                                    }
//                                    return Mono.just(savedUser);
//                                });
//                    });
//        });
//
//        StepVerifier.create(createUserMono)
//                .expectNextMatches(savedUser -> {
//                    // 最终验证
//                    return savedUser.getId() != null
//                            && "ENABLED".equals(savedUser.getStatus())
//                            && "USERNAME".equals(savedUser.getAccountType())
//                            && "root".equals(savedUser.getAccountIdentifier())
//                            && savedUser.getPasswordHash() != null
//                            && "超级管理员".equals(savedUser.getNickname())
//                            && savedUser.getRoleCode() != null;
//                })
//                .verifyComplete();
//    }
//
//    /**
//     * 测试循环创建20个USER角色代码的用户
//     */
//    @Test
//    void testCreate20UsersWithUserRole() {
//        // 验证USER角色是否存在
//        Mono<SysRole> roleMono = template.select(SysRole.class)
//                .matching(Query.query(Criteria.where("code").is("USER")))
//                .one();
//
//        // 创建20个用户的Flux
//        Flux<SysUser> createUsersFlux = roleMono.flatMapMany(role -> {
//            // 使用Flux.range创建1到20的序列
//            return Flux.range(1, 20)
//                    .flatMap(index -> {
//                        // 创建用户对象
//                        SysUser user = new SysUser();
//                        UUID userId = UUID.randomUUID();
//                        user.setId(userId);
//                        user.setStatus("ENABLED");
//                        user.setAccountType("USERNAME");
//                        user.setAccountIdentifier("user" + index);
//
//                        // 设置角色代码为USER
//                        user.setRoleCode(role.getCode());
//
//                        // 加密密码（所有用户使用相同密码）
//                        String rawPassword = "123456";
//                        String passwordHash = passwordUtil.encode(rawPassword);
//                        user.setPasswordHash(passwordHash);
//                        user.setPasswordAlgoVersion(1);
//                        user.setPasswordChangedAt(OffsetDateTime.now());
//
//                        // 设置用户基本信息
//                        user.setNickname("用户" + index);
//                        user.setGender("UNKNOWN");
//                        user.setLocale("zh-CN");
//                        user.setTimezone("Asia/Shanghai");
//
//                        // 设置时间戳
//                        OffsetDateTime now = OffsetDateTime.now();
//                        user.setCreatedAt(now);
//                        user.setUpdatedAt(now);
//
//                        // 保存用户
//                        return userRepository.save(user);
//                    });
//        });
//
//        // 验证创建了20个用户，且每个用户的角色代码都是USER
//        StepVerifier.create(createUsersFlux)
//                .expectNextCount(20)
//                .verifyComplete();
//
//        // 验证所有用户都已正确创建
//        Flux<SysUser> verifyUsersFlux = template.select(SysUser.class)
//                .matching(Query.query(
//                        Criteria.where("accountType").is("USERNAME")
//                                .and(Criteria.where("accountIdentifier").like("user%"))
//                                .and(Criteria.where("roleCode").is("USER"))
//                ))
//                .all();
//
//        StepVerifier.create(verifyUsersFlux)
//                .expectNextCount(20)
//                .verifyComplete();
//    }

}
