package org.charno.systementity.entity;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * 系统用户实体
 * Spring Data R2DBC 实体类
 * 
 * 合并了用户主表、账号表、资料表的所有字段
 */
@Getter
@Setter
@Table(name = "sys_user")
public class SysUser {
    
    /**
     * 用户唯一标识（UUID 主键）
     */
    @Id
    private UUID id;

    /**
     * 用户状态（如 ENABLED / DISABLED / LOCKED）
     */
    private String status;

    /**
     * 用户角色代码，关联 sys_role 表的 code 字段
     */
    @Column("role_code")
    private String roleCode;

    /**
     * 账号类型（如 EMAIL / PHONE / USERNAME / WECHAT）
     */
    private String accountType;

    /**
     * 账号唯一标识（邮箱、手机号、用户名等）
     */
    private String accountIdentifier;

    /**
     * 用户密码哈希值（不可逆）
     */
    private String passwordHash;

    /**
     * 密码算法版本号，用于平滑升级密码算法
     */
    private Integer passwordAlgoVersion;

    /**
     * 最近一次密码修改时间
     */
    private OffsetDateTime passwordChangedAt;

    /**
     * 最近一次登录时间
     */
    private OffsetDateTime lastLoginAt;

    /**
     * 最近一次登录IP地址
     */
    private String lastLoginIp;

    /**
     * 用户昵称
     */
    private String nickname;

    /**
     * 用户头像URL
     */
    private String avatarUrl;

    /**
     * 用户性别（如 MALE / FEMALE / UNKNOWN）
     */
    private String gender;

    /**
     * 用户语言环境（如 zh-CN / en-US）
     */
    private String locale;

    /**
     * 用户所在时区（如 Asia/Shanghai）
     */
    private String timezone;

    /**
     * 用户创建时间
     */
    private OffsetDateTime createdAt;

    /**
     * 用户最近更新时间
     */
    private OffsetDateTime updatedAt;

    /**
     * 逻辑删除时间（为空表示未删除）
     */
    private OffsetDateTime deletedAt;

    /**
     * 乐观锁版本号
     */
    @Version
    private Long version;
}

