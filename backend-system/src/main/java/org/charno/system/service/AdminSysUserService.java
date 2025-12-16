package org.charno.system.service;

import org.charno.systementity.entity.SysUser;
import org.springframework.data.domain.Pageable;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.data.relational.core.query.Criteria;
import org.springframework.data.relational.core.query.Query;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

/**
 * 系统用户管理业务服务
 * 面向管理的业务服务，提供条件查询功能
 */
@Service
public class AdminSysUserService {

    private final R2dbcEntityTemplate template;

    public AdminSysUserService(R2dbcEntityTemplate template) {
        this.template = template;
    }

    // ==================== 条件查询 ====================

    /**
     * 不分页条件查询用户
     * 
     * @param status 用户状态（可选）
     * @param roleCode 角色代码（可选）
     * @param accountType 账号类型（可选）
     * @param accountIdentifier 账号标识符（可选，支持模糊查询）
     * @param nickname 昵称（可选，支持模糊查询）
     * @return Flux<SysUser> 用户列表
     */
    public Flux<SysUser> query(String status, String roleCode, String accountType, 
                               String accountIdentifier, String nickname) {
        Criteria criteria = buildCriteria(status, roleCode, accountType, accountIdentifier, nickname);
        return template.select(SysUser.class)
            .matching(Query.query(criteria))
            .all();
    }

    /**
     * 分页条件查询用户
     * 
     * @param status 用户状态（可选）
     * @param roleCode 角色代码（可选）
     * @param accountType 账号类型（可选）
     * @param accountIdentifier 账号标识符（可选，支持模糊查询）
     * @param nickname 昵称（可选，支持模糊查询）
     * @param pageable 分页参数
     * @return Flux<SysUser> 用户列表
     */
    public Flux<SysUser> queryWithPage(String status, String roleCode, String accountType,
                                       String accountIdentifier, String nickname, Pageable pageable) {
        Criteria criteria = buildCriteria(status, roleCode, accountType, accountIdentifier, nickname);
        return template.select(SysUser.class)
            .matching(Query.query(criteria).with(pageable))
            .all();
    }

    /**
     * 构建查询条件
     */
    private Criteria buildCriteria(String status, String roleCode, String accountType,
                                   String accountIdentifier, String nickname) {
        Criteria criteria = Criteria.empty();

        if (status != null && !status.isEmpty()) {
            criteria = criteria.and(Criteria.where("status").is(status));
        }

        if (roleCode != null && !roleCode.isEmpty()) {
            criteria = criteria.and(Criteria.where("role_code").is(roleCode));
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
}

