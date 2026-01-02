package org.charno.system.service;

import org.charno.common.web.response.PageResult;
import org.charno.systementity.entity.SysRole;
import org.springframework.data.domain.Pageable;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.data.relational.core.query.Criteria;
import org.springframework.data.relational.core.query.Query;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * 系统角色管理业务服务
 * 面向管理的业务服务，提供条件查询功能
 */
@Service
public class AdminSysRoleService {

    private final R2dbcEntityTemplate template;

    public AdminSysRoleService(R2dbcEntityTemplate template) {
        this.template = template;
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
     * @return Mono<PageResult<SysRole>> 分页结果
     */
    public Mono<PageResult<SysRole>> queryWithPage(String code, String name, Pageable pageable) {
        Criteria criteria = buildCriteria(code, name);
        Query query = Query.query(criteria);
        
        // 获取总数
        Mono<Long> countMono = template.count(query, SysRole.class);
        
        // 获取分页数据
        Mono<java.util.List<SysRole>> dataMono = template.select(SysRole.class)
            .matching(query.with(pageable))
            .all()
            .collectList();
        
        // 组合成分页结果
        return Mono.zip(countMono, dataMono)
            .map(tuple -> PageResult.<SysRole>builder()
                .data(tuple.getT2())
                .total(tuple.getT1())
                .page(pageable.getPageNumber())
                .size(pageable.getPageSize())
                .build());
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
}

