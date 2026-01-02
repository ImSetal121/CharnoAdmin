package org.charno.system.service;

import org.charno.common.web.response.PageResult;
import org.charno.systementity.entity.SysConfig;
import org.springframework.data.domain.Pageable;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.data.relational.core.query.Criteria;
import org.springframework.data.relational.core.query.Query;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * 系统配置管理业务服务
 * 面向管理的业务服务，提供条件查询功能
 */
@Service
public class AdminSysConfigService {

    private final R2dbcEntityTemplate template;

    public AdminSysConfigService(R2dbcEntityTemplate template) {
        this.template = template;
    }

    // ==================== 条件查询 ====================

    /**
     * 不分页条件查询配置
     * 
     * @param key 配置键（可选，支持模糊查询）
     * @param value 配置值（可选，支持模糊查询）
     * @return Flux<SysConfig> 配置列表
     */
    public Flux<SysConfig> query(String key, String value) {
        Criteria criteria = buildCriteria(key, value);
        return template.select(SysConfig.class)
            .matching(Query.query(criteria))
            .all();
    }

    /**
     * 分页条件查询配置
     * 
     * @param key 配置键（可选，支持模糊查询）
     * @param value 配置值（可选，支持模糊查询）
     * @param pageable 分页参数
     * @return Mono<PageResult<SysConfig>> 分页结果
     */
    public Mono<PageResult<SysConfig>> queryWithPage(String key, String value, Pageable pageable) {
        Criteria criteria = buildCriteria(key, value);
        Query query = Query.query(criteria);
        
        // 获取总数
        Mono<Long> countMono = template.count(query, SysConfig.class);
        
        // 获取分页数据
        Mono<java.util.List<SysConfig>> dataMono = template.select(SysConfig.class)
            .matching(query.with(pageable))
            .all()
            .collectList();
        
        // 组合成分页结果
        return Mono.zip(countMono, dataMono)
            .map(tuple -> PageResult.<SysConfig>builder()
                .data(tuple.getT2())
                .total(tuple.getT1())
                .page(pageable.getPageNumber())
                .size(pageable.getPageSize())
                .build());
    }

    /**
     * 构建查询条件
     */
    private Criteria buildCriteria(String key, String value) {
        Criteria criteria = Criteria.empty();

        if (key != null && !key.isEmpty()) {
            criteria = criteria.and(Criteria.where("key").like("%" + key + "%"));
        }

        if (value != null && !value.isEmpty()) {
            criteria = criteria.and(Criteria.where("value").like("%" + value + "%"));
        }

        return criteria;
    }
}

