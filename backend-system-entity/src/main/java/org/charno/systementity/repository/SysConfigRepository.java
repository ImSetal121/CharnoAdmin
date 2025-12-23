package org.charno.systementity.repository;

import org.charno.systementity.entity.SysConfig;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.data.repository.reactive.ReactiveSortingRepository;

/**
 * 系统配置 Repository
 * Spring Data R2DBC 响应式持久层接口
 * 
 * 规范参考：prompt/持久层规范.md
 */
public interface SysConfigRepository extends ReactiveCrudRepository<SysConfig, String>,
                                         ReactiveSortingRepository<SysConfig, String> {
}

