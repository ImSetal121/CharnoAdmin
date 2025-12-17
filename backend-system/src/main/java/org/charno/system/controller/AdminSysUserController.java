package org.charno.system.controller;

import org.charno.commonsecurity.annotation.RequiresRole;
import org.charno.commonweb.response.ApiResponse;
import org.charno.commonweb.response.PageResult;
import org.charno.systementity.entity.SysUser;
import org.charno.systementity.repository.SysUserRepository;
import org.charno.system.service.AdminSysUserService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.UUID;

/**
 * 系统用户管理控制器
 * 面向管理的控制类，提供CRUD及条件查询功能
 */
@RequiresRole("ADMIN")
@RestController
@RequestMapping("/api/admin/users")
public class AdminSysUserController {

    private final AdminSysUserService adminUserService;
    private final SysUserRepository userRepository;

    public AdminSysUserController(AdminSysUserService adminUserService, SysUserRepository userRepository) {
        this.adminUserService = adminUserService;
        this.userRepository = userRepository;
    }

    // ==================== CRUD 操作 ====================

    /**
     * 创建用户
     * 
     * @param user 用户实体
     * @return 响应结果
     */
    @PostMapping
    public Mono<ApiResponse<SysUser>> create(@RequestBody SysUser user) {
        return userRepository.save(user)
            .map(ApiResponse::success)
            .onErrorResume(e -> Mono.just(ApiResponse.fail("创建用户失败：" + e.getMessage())));
    }

    /**
     * 根据ID查询用户
     * 
     * @param id 用户ID
     * @return 响应结果
     */
    @GetMapping("/{id}")
    public Mono<ApiResponse<SysUser>> getById(@PathVariable UUID id) {
        return userRepository.findById(id)
            .map(ApiResponse::success)
            .switchIfEmpty(Mono.just(ApiResponse.fail("用户不存在")))
            .onErrorResume(e -> Mono.just(ApiResponse.fail("查询用户失败：" + e.getMessage())));
    }

    /**
     * 更新用户
     * 
     * @param id 用户ID
     * @param user 用户实体
     * @return 响应结果
     */
    @PutMapping("/{id}")
    public Mono<ApiResponse<SysUser>> update(@PathVariable UUID id, @RequestBody SysUser user) {
        // 先查询现有用户，保留时间戳等字段
        return userRepository.findById(id)
            .flatMap(existingUser -> {
                // 检查是否为 root 账号，root 账号的角色代码不允许更改
                if ("root".equalsIgnoreCase(existingUser.getAccountIdentifier()) 
                    && user.getRoleCode() != null 
                    && !user.getRoleCode().equals(existingUser.getRoleCode())) {
                    return Mono.just(ApiResponse.<SysUser>fail("root 账号的角色代码不允许更改"));
                }
                
                // 更新允许修改的字段
                if (user.getStatus() != null) {
                    existingUser.setStatus(user.getStatus());
                }
                if (user.getRoleCode() != null) {
                    existingUser.setRoleCode(user.getRoleCode());
                }
                if (user.getAccountType() != null) {
                    existingUser.setAccountType(user.getAccountType());
                }
                if (user.getAccountIdentifier() != null) {
                    existingUser.setAccountIdentifier(user.getAccountIdentifier());
                }
                if (user.getNickname() != null) {
                    existingUser.setNickname(user.getNickname());
                }
                if (user.getAvatarUrl() != null) {
                    existingUser.setAvatarUrl(user.getAvatarUrl());
                }
                if (user.getGender() != null) {
                    existingUser.setGender(user.getGender());
                }
                if (user.getLocale() != null) {
                    existingUser.setLocale(user.getLocale());
                }
                if (user.getTimezone() != null) {
                    existingUser.setTimezone(user.getTimezone());
                }
                // 保留原有的时间戳字段，不更新
                // 保留密码相关字段，不更新（密码修改应通过专门的接口）
                // 更新 updatedAt
                existingUser.setUpdatedAt(java.time.OffsetDateTime.now());
                // 保存更新后的用户
                return userRepository.save(existingUser)
                    .map(ApiResponse::success);
            })
            .switchIfEmpty(Mono.just(ApiResponse.<SysUser>fail("用户不存在")))
            .onErrorResume(e -> Mono.just(ApiResponse.<SysUser>fail("更新用户失败：" + e.getMessage())));
    }

    /**
     * 删除用户
     * 
     * @param id 用户ID
     * @return 响应结果
     */
    @DeleteMapping("/{id}")
    public Mono<ApiResponse<Void>> delete(@PathVariable UUID id) {
        // 先查询用户，检查是否为 root 账号
        return userRepository.findById(id)
            .flatMap(user -> {
                // 检查账号标识是否为 root，root 账号不允许删除
                if ("root".equalsIgnoreCase(user.getAccountIdentifier())) {
                    return Mono.just(ApiResponse.<Void>fail("root 账号不允许删除"));
                }
                // 允许删除
        return userRepository.deleteById(id)
                    .then(Mono.just(ApiResponse.<Void>success()));
            })
            .switchIfEmpty(Mono.just(ApiResponse.<Void>fail("用户不存在")))
            .onErrorResume(e -> Mono.just(ApiResponse.<Void>fail("删除用户失败：" + e.getMessage())));
    }

    // ==================== 条件查询 ====================

    /**
     * 不分页条件查询用户
     * 
     * @param status 用户状态（可选）
     * @param roleCode 角色代码（可选）
     * @param accountType 账号类型（可选）
     * @param accountIdentifier 账号标识符（可选，支持模糊查询）
     * @param nickname 昵称（可选，支持模糊查询）
     * @return 响应结果
     */
    @GetMapping("/query")
    public Mono<ApiResponse<List<SysUser>>> query(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String roleCode,
            @RequestParam(required = false) String accountType,
            @RequestParam(required = false) String accountIdentifier,
            @RequestParam(required = false) String nickname) {
        return adminUserService.query(status, roleCode, accountType, accountIdentifier, nickname)
            .collectList()
            .map(ApiResponse::success)
            .onErrorResume(e -> Mono.just(ApiResponse.fail("查询用户失败：" + e.getMessage())));
    }

    /**
     * 分页条件查询用户
     * 
     * @param status 用户状态（可选）
     * @param roleCode 角色代码（可选）
     * @param accountType 账号类型（可选）
     * @param accountIdentifier 账号标识符（可选，支持模糊查询）
     * @param nickname 昵称（可选，支持模糊查询）
     * @param page 页码（从0开始，默认0）
     * @param size 每页大小（默认10）
     * @param sort 排序字段（可选，格式：field,asc/desc，默认按createdAt降序）
     * @return 响应结果
     */
    @GetMapping("/query/page")
    public Mono<ApiResponse<PageResult<SysUser>>> queryWithPage(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String roleCode,
            @RequestParam(required = false) String accountType,
            @RequestParam(required = false) String accountIdentifier,
            @RequestParam(required = false) String nickname,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String sort) {
        
        Pageable pageable = buildPageable(page, size, sort);
        
        return adminUserService.queryWithPage(status, roleCode, accountType, accountIdentifier, nickname, pageable)
            .map(ApiResponse::success)
            .onErrorResume(e -> Mono.just(ApiResponse.fail("分页查询用户失败：" + e.getMessage())));
    }

    /**
     * 构建分页参数
     */
    private Pageable buildPageable(int page, int size, String sort) {
        if (sort != null && !sort.isEmpty()) {
            String[] sortParts = sort.split(",");
            if (sortParts.length == 2) {
                String field = sortParts[0].trim();
                Sort.Direction direction = "desc".equalsIgnoreCase(sortParts[1].trim()) 
                    ? Sort.Direction.DESC 
                    : Sort.Direction.ASC;
                return PageRequest.of(page, size, Sort.by(direction, field));
            }
        }
        // 默认按创建时间降序
        return PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    }
}

