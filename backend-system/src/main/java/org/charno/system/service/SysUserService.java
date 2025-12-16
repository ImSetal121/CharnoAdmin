package org.charno.system.service;

import org.charno.system.entity.SysUser;
import org.charno.system.repository.SysUserRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.data.relational.core.query.Criteria;
import org.springframework.data.relational.core.query.Query;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * 系统用户业务服务
 */
@Service
public class SysUserService {

    private final R2dbcEntityTemplate template;
    private final SysUserRepository userRepository;

    public SysUserService(R2dbcEntityTemplate template, SysUserRepository userRepository) {
        this.template = template;
        this.userRepository = userRepository;
    }

    // ==================== 条件查询 ====================

    /**
     * 不分页条件查询用户
     * 
     * @param status 用户状态（可选）
     * @param roleId 角色ID（可选）
     * @param accountType 账号类型（可选）
     * @param accountIdentifier 账号标识符（可选，支持模糊查询）
     * @param nickname 昵称（可选，支持模糊查询）
     * @return Flux<SysUser> 用户列表
     */
    public Flux<SysUser> query(String status, Long roleId, String accountType, 
                               String accountIdentifier, String nickname) {
        Criteria criteria = buildCriteria(status, roleId, accountType, accountIdentifier, nickname);
        return template.select(SysUser.class)
            .matching(Query.query(criteria))
            .all();
    }

    /**
     * 分页条件查询用户
     * 
     * @param status 用户状态（可选）
     * @param roleId 角色ID（可选）
     * @param accountType 账号类型（可选）
     * @param accountIdentifier 账号标识符（可选，支持模糊查询）
     * @param nickname 昵称（可选，支持模糊查询）
     * @param pageable 分页参数
     * @return Flux<SysUser> 用户列表
     */
    public Flux<SysUser> queryWithPage(String status, Long roleId, String accountType,
                                       String accountIdentifier, String nickname, Pageable pageable) {
        Criteria criteria = buildCriteria(status, roleId, accountType, accountIdentifier, nickname);
        return template.select(SysUser.class)
            .matching(Query.query(criteria).with(pageable))
            .all();
    }

    /**
     * 构建查询条件
     */
    private Criteria buildCriteria(String status, Long roleId, String accountType,
                                   String accountIdentifier, String nickname) {
        Criteria criteria = Criteria.empty();

        if (status != null && !status.isEmpty()) {
            criteria = criteria.and(Criteria.where("status").is(status));
        }

        if (roleId != null) {
            criteria = criteria.and(Criteria.where("role_id").is(roleId));
        }

        if (accountType != null && !accountType.isEmpty()) {
            criteria = criteria.and(Criteria.where("accountType").is(accountType));
        }

        if (accountIdentifier != null && !accountIdentifier.isEmpty()) {
            criteria = criteria.and(Criteria.where("accountIdentifier").like("%" + accountIdentifier + "%"));
        }

        if (nickname != null && !nickname.isEmpty()) {
            criteria = criteria.and(Criteria.where("nickname").like("%" + nickname + "%"));
        }

        return criteria;
    }

    // ==================== 业务逻辑 ====================

    // TODO: 用户注册业务逻辑
    // TODO: 用户登录业务逻辑
    // TODO: 用户密码修改业务逻辑
    // TODO: 用户信息更新业务逻辑
    // TODO: 用户状态变更业务逻辑
    // TODO: 用户软删除业务逻辑
    // TODO: 用户权限验证业务逻辑

}

