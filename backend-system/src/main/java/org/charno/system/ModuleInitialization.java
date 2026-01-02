package org.charno.system;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.charno.common.security.config.PermitAllPathProvider;
import org.charno.common.security.util.PasswordUtil;
import org.charno.systementity.entity.SysRole;
import org.charno.systementity.entity.SysUser;
import org.charno.systementity.repository.SysRoleRepository;
import org.charno.systementity.repository.SysUserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.data.relational.core.query.Criteria;
import org.springframework.data.relational.core.query.Query;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * 系统模块初始化
 * 负责系统模块的启动时初始化工作，包括：
 * 1. 检查并创建 ADMIN 角色
 * 2. 检查并创建 root 用户
 * 3. 注册系统模块需要放行的路径
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ModuleInitialization implements ApplicationRunner, PermitAllPathProvider {

    private final SysRoleRepository roleRepository;
    private final SysUserRepository userRepository;
    private final R2dbcEntityTemplate template;
    private final PasswordUtil passwordUtil;

    @Override
    public void run(ApplicationArguments args) {
        log.info("开始初始化系统模块...");

        initializeAdminRole()
            .then(initializeRootUser())
            .doOnSuccess(v -> log.info("系统模块初始化完成"))
            .doOnError(e -> log.error("系统模块初始化失败", e))
            .subscribe();
    }
    
    /**
     * 初始化 ADMIN 角色
     * 检查是否存在 code 为 "ADMIN" 的角色，如果不存在则创建
     * 
     * 注意：SysRole 使用业务主键（code），需要使用 template.insert() 强制插入
     * 
     * @return Mono<Void>
     */
    private Mono<Void> initializeAdminRole() {
        return roleRepository.existsById("ADMIN")
            .flatMap(exists -> {
                if (exists) {
                    log.debug("ADMIN 角色已存在");
                    return Mono.empty();
                } else {
                    log.info("创建 ADMIN 角色...");
                    SysRole role = new SysRole();
                    role.setCode("ADMIN");
                    role.setName("管理员");
                    role.setDescription("系统管理员");
                    role.setCreatedAt(OffsetDateTime.now());
                    
                    // 使用 insert() 方法强制插入新记录，避免 save() 尝试更新
                    return template.insert(role)
                        .doOnSuccess(v -> log.info("成功创建 ADMIN 角色"))
                        .doOnError(e -> log.error("创建 ADMIN 角色失败", e))
                        .then();
                }
            });
    }

    /**
     * 初始化 root 用户
     * 检查是否存在 role_code 为 "ADMIN" 且 account_identifier 为 "root" 的用户
     * 如果不存在则创建，密码随机生成并在控制台输出
     * 
     * @return Mono<Void>
     */
    private Mono<Void> initializeRootUser() {
        // 查询是否存在 root 用户（role_code=ADMIN, accountType=USERNAME, accountIdentifier=root）
        Criteria criteria = Criteria.where("role_code").is("ADMIN")
                .and(Criteria.where("accountType").is("USERNAME"))
                .and(Criteria.where("accountIdentifier").is("root"));
        
        return template.select(SysUser.class)
            .matching(Query.query(criteria))
            .one()
            .flatMap(existingUser -> {
                // 用户已存在
                log.debug("root 用户已存在");
                return Mono.just(existingUser);
            })
            .switchIfEmpty(
                // 用户不存在，创建新用户
                Mono.fromCallable(() -> {
                    // 生成随机密码（使用 UUID 去掉连字符，取前16位）
                    return UUID.randomUUID().toString().replace("-", "").substring(0, 16);
                })
                .flatMap(rawPassword -> {
                    // 创建用户对象
                    SysUser user = new SysUser();
                    user.setId(UUID.randomUUID());
                    user.setStatus("ENABLED");
                    user.setAccountType("USERNAME");
                    user.setAccountIdentifier("root");
                    user.setRoleCode("ADMIN");
                    
                    // 加密密码
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
                    
                    // 保存用户
                    return userRepository.save(user)
                        .doOnSuccess(savedUser -> {
                            // 在控制台输出 root 密码
                            System.out.println("========================================");
                            System.out.println("root 用户已创建");
                            System.out.println("用户名: root");
                            System.out.println("密码: " + rawPassword);
                            System.out.println("请妥善保管此密码，首次登录后请及时修改！");
                            System.out.println("========================================");
                            log.info("root 用户已创建，密码: {}", rawPassword);
                        })
                        .doOnError(e -> log.error("创建 root 用户失败", e));
                })
            )
            .then();
    }

    /**
     * 获取系统模块需要放行的路径
     * 包括登录和注册接口
     * 
     * @return 路径列表
     */
    @Override
    public List<String> getPermitAllPaths() {
        return Arrays.asList(
                "/api/login",       // 登录接口
                "/api/register"     // 注册接口
        );
    }
}
