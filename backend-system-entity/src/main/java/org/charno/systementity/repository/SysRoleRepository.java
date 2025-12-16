package org.charno.systementity.repository;

import org.charno.systementity.entity.SysRole;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.data.repository.reactive.ReactiveSortingRepository;

/**
 * 系统角色 Repository
 * Spring Data R2DBC 响应式持久层接口
 * 
 * 规范参考：prompt/持久层规范.md
 */
public interface SysRoleRepository extends ReactiveCrudRepository<SysRole, Long>,
                                         ReactiveSortingRepository<SysRole, Long> {
}

