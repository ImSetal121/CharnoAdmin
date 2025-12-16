package org.charno.systementity.entity;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

import java.time.OffsetDateTime;

/**
 * 系统角色实体
 * Spring Data R2DBC 实体类
 */
@Getter
@Setter
@Table(name = "sys_role")
public class SysRole {
    
    /**
     * 主键 ID
     */
    @Id
    private Long id;

    /**
     * 角色代码（唯一标识）
     */
    private String code;

    /**
     * 角色名称
     */
    private String name;

    /**
     * 角色描述
     */
    private String description;

    /**
     * 创建时间
     */
    private OffsetDateTime createdAt;
}

