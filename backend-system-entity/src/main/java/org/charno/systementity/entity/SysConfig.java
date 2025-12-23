package org.charno.systementity.entity;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

/**
 * 系统配置实体
 * Spring Data R2DBC 实体类
 */
@Getter
@Setter
@Table(name = "sys_config")
public class SysConfig {
    
    /**
     * 配置键（主键，唯一标识）
     */
    @Id
    private String key;

    /**
     * 配置值
     */
    private String value;

    /**
     * 配置描述
     */
    private String description;
}

