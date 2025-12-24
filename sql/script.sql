create table sys_role
(
    code        varchar(64)                            not null
        constraint sys_role_pk
            primary key,
    name        varchar(64)                            not null,
    description varchar(255),
    created_at  timestamp with time zone default now() not null
);

alter table sys_role
    owner to postgres;

create table sys_user
(
    id                    uuid                     default gen_random_uuid() not null
        primary key,
    status                varchar(32)                                        not null,
    role_code             varchar(64)                                        not null
        constraint sys_user_sys_role_code_fk
            references sys_role,
    account_type          varchar(32)                                        not null,
    account_identifier    varchar(128)                                       not null,
    password_hash         varchar(255),
    password_algo_version integer                  default 1                 not null,
    password_changed_at   timestamp with time zone,
    last_login_at         timestamp with time zone,
    last_login_ip         varchar(64),
    nickname              varchar(64),
    avatar_url            varchar(512),
    gender                varchar(16),
    locale                varchar(16),
    timezone              varchar(32),
    created_at            timestamp with time zone default now()             not null,
    updated_at            timestamp with time zone default now()             not null,
    deleted_at            timestamp with time zone,
    version               bigint,
    constraint uk_sys_user_account_identifier
        unique (account_type, account_identifier)
);

comment on table sys_user is '系统用户表';

comment on column sys_user.id is '用户唯一标识（UUID 主键）';

comment on column sys_user.status is '用户状态（如 ENABLED / DISABLED / LOCKED）';

comment on column sys_user.role_code is '用户角色ID，关联 sys_role 表';

comment on column sys_user.account_type is '账号类型（如 EMAIL / PHONE / USERNAME / WECHAT）';

comment on column sys_user.account_identifier is '账号唯一标识（邮箱、手机号、用户名等）';

comment on column sys_user.password_hash is '用户密码哈希值（不可逆）';

comment on column sys_user.password_algo_version is '密码算法版本号，用于平滑升级密码算法';

comment on column sys_user.password_changed_at is '最近一次密码修改时间';

comment on column sys_user.last_login_at is '最近一次登录时间';

comment on column sys_user.last_login_ip is '最近一次登录IP地址';

comment on column sys_user.nickname is '用户昵称';

comment on column sys_user.avatar_url is '用户头像URL';

comment on column sys_user.gender is '用户性别（如 MALE / FEMALE / UNKNOWN）';

comment on column sys_user.locale is '用户语言环境（如 zh-CN / en-US）';

comment on column sys_user.timezone is '用户所在时区（如 Asia/Shanghai）';

comment on column sys_user.created_at is '用户创建时间';

comment on column sys_user.updated_at is '用户最近更新时间';

comment on column sys_user.deleted_at is '逻辑删除时间（为空表示未删除）';

comment on column sys_user.version is '乐观锁版本号';

comment on constraint uk_sys_user_account_identifier on sys_user is '账号类型 + 账号标识的全局唯一约束';

alter table sys_user
    owner to postgres;

create index idx_sys_user_status
    on sys_user (status);

create index idx_sys_user_created_at
    on sys_user (created_at);

create index idx_sys_user_account_password_algo_version
    on sys_user (password_algo_version);

create index idx_sys_user_account_password_changed_at
    on sys_user (password_changed_at);

create index idx_sys_user_last_login_at
    on sys_user (last_login_at);

create index idx_sys_user_role_id
    on sys_user (role_code);

create table sys_config
(
    key         varchar not null
        constraint sys_config_pk
            primary key,
    value       varchar,
    description text
);

alter table sys_config
    owner to postgres;


