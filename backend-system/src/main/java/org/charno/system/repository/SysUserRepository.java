package org.charno.system.repository;

import org.charno.system.entity.SysUser;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.data.repository.reactive.ReactiveSortingRepository;

import java.util.UUID;

/**
 * 系统用户 Repository
 * Spring Data R2DBC 响应式持久层接口
 */
public interface SysUserRepository extends ReactiveCrudRepository<SysUser, UUID>, 
                                         ReactiveSortingRepository<SysUser, UUID> {
}

