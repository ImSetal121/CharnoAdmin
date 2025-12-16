package org.charno.system.service;

import org.charno.system.entity.SysRole;
import org.charno.system.repository.SysRoleRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.data.relational.core.query.Criteria;
import org.springframework.data.relational.core.query.Query;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

/**
 * 系统角色业务服务
 */
@Service
public class SysRoleService {

    private final R2dbcEntityTemplate template;
    private final SysRoleRepository roleRepository;

    public SysRoleService(R2dbcEntityTemplate template, SysRoleRepository roleRepository) {
        this.template = template;
        this.roleRepository = roleRepository;
    }

    // ==================== 条件查询 ====================

    /**
     * 不分页条件查询角色
     * 
     * @param code 角色代码（可选，支持模糊查询）
     * @param name 角色名称（可选，支持模糊查询）
     * @return Flux<SysRole> 角色列表
     */
    public Flux<SysRole> query(String code, String name) {
        Criteria criteria = buildCriteria(code, name);
        return template.select(SysRole.class)
            .matching(Query.query(criteria))
            .all();
    }

    /**
     * 分页条件查询角色
     * 
     * @param code 角色代码（可选，支持模糊查询）
     * @param name 角色名称（可选，支持模糊查询）
     * @param pageable 分页参数
     * @return Flux<SysRole> 角色列表
     */
    public Flux<SysRole> queryWithPage(String code, String name, Pageable pageable) {
        Criteria criteria = buildCriteria(code, name);
        return template.select(SysRole.class)
            .matching(Query.query(criteria).with(pageable))
            .all();
    }

    /**
     * 构建查询条件
     */
    private Criteria buildCriteria(String code, String name) {
        Criteria criteria = Criteria.empty();

        if (code != null && !code.isEmpty()) {
            criteria = criteria.and(Criteria.where("code").like("%" + code + "%"));
        }

        if (name != null && !name.isEmpty()) {
            criteria = criteria.and(Criteria.where("name").like("%" + name + "%"));
        }

        return criteria;
    }

    // ==================== 业务逻辑 ====================

    // TODO: 角色创建业务逻辑
    // TODO: 角色更新业务逻辑
    // TODO: 角色删除业务逻辑
    // TODO: 角色权限分配业务逻辑
    // TODO: 角色权限验证业务逻辑

}

