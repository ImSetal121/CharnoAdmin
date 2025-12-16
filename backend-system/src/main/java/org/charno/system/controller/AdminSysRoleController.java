package org.charno.system.controller;

import org.charno.commonsecurity.annotation.RequiresRole;
import org.charno.commonweb.response.ApiResponse;
import org.charno.systementity.entity.SysRole;
import org.charno.systementity.repository.SysRoleRepository;
import org.charno.system.service.AdminSysRoleService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * 系统角色管理控制器
 * 面向管理的控制类，提供CRUD及条件查询功能
 */
@RequiresRole("ADMIN")
@RestController
@RequestMapping("/api/admin/roles")
public class AdminSysRoleController {

    private final AdminSysRoleService adminRoleService;
    private final SysRoleRepository roleRepository;
    private final R2dbcEntityTemplate template;

    public AdminSysRoleController(AdminSysRoleService adminRoleService, SysRoleRepository roleRepository, R2dbcEntityTemplate template) {
        this.adminRoleService = adminRoleService;
        this.roleRepository = roleRepository;
        this.template = template;
    }

    // ==================== CRUD 操作 ====================

    /**
     * 创建角色
     * 
     * @param role 角色实体
     * @return 响应结果
     */
    @PostMapping
    public Mono<ApiResponse<SysRole>> create(@RequestBody SysRole role) {
        // 检查角色代码是否已存在
        if (role.getCode() == null || role.getCode().isEmpty()) {
            return Mono.just(ApiResponse.<SysRole>fail("角色代码不能为空"));
        }
        
        return roleRepository.existsById(role.getCode())
            .flatMap(exists -> {
                if (exists) {
                    return Mono.just(ApiResponse.<SysRole>fail("角色代码已存在：" + role.getCode()));
                }
                // 设置创建时间
                if (role.getCreatedAt() == null) {
                    role.setCreatedAt(OffsetDateTime.now());
                }
                // 使用 insert() 方法强制插入新记录，避免 save() 尝试更新
                return template.insert(role)
                    .map(ApiResponse::success);
            })
            .onErrorResume(e -> Mono.just(ApiResponse.<SysRole>fail("创建角色失败：" + e.getMessage())));
    }

    /**
     * 根据代码查询角色
     * 
     * @param code 角色代码
     * @return 响应结果
     */
    @GetMapping("/{code}")
    public Mono<ApiResponse<SysRole>> getByCode(@PathVariable String code) {
        return roleRepository.findById(code)
            .map(ApiResponse::success)
            .switchIfEmpty(Mono.just(ApiResponse.fail("角色不存在")))
            .onErrorResume(e -> Mono.just(ApiResponse.fail("查询角色失败：" + e.getMessage())));
    }

    /**
     * 更新角色
     * 
     * @param code 角色代码
     * @param role 角色实体
     * @return 响应结果
     */
    @PutMapping("/{code}")
    public Mono<ApiResponse<SysRole>> update(@PathVariable String code, @RequestBody SysRole role) {
        // 先查询现有角色，保留创建时间
        return roleRepository.findById(code)
            .flatMap(existingRole -> {
                // 更新允许修改的字段
                existingRole.setName(role.getName());
                existingRole.setDescription(role.getDescription());
                // 保留原有的创建时间，不更新
                return roleRepository.save(existingRole)
                    .map(ApiResponse::success);
            })
            .switchIfEmpty(Mono.just(ApiResponse.<SysRole>fail("角色不存在")))
            .onErrorResume(e -> Mono.just(ApiResponse.<SysRole>fail("更新角色失败：" + e.getMessage())));
    }

    /**
     * 删除角色
     * 
     * @param code 角色代码
     * @return 响应结果
     */
    @DeleteMapping("/{code}")
    public Mono<ApiResponse<Void>> delete(@PathVariable String code) {
        // 检查角色代码是否为 ADMIN，ADMIN 角色不允许删除
        if ("ADMIN".equalsIgnoreCase(code)) {
            return Mono.just(ApiResponse.<Void>fail("ADMIN 角色不允许删除"));
        }
        // 允许删除
        return roleRepository.deleteById(code)
            .then(Mono.just(ApiResponse.<Void>success()))
            .onErrorResume(e -> Mono.just(ApiResponse.<Void>fail("删除角色失败：" + e.getMessage())));
    }

    // ==================== 条件查询 ====================

    /**
     * 不分页条件查询角色
     * 
     * @param code 角色代码（可选，支持模糊查询）
     * @param name 角色名称（可选，支持模糊查询）
     * @return 响应结果
     */
    @GetMapping("/query")
    public Mono<ApiResponse<List<SysRole>>> query(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String name) {
        return adminRoleService.query(code, name)
            .collectList()
            .map(ApiResponse::success)
            .onErrorResume(e -> Mono.just(ApiResponse.fail("查询角色失败：" + e.getMessage())));
    }

    /**
     * 分页条件查询角色
     * 
     * @param code 角色代码（可选，支持模糊查询）
     * @param name 角色名称（可选，支持模糊查询）
     * @param page 页码（从0开始，默认0）
     * @param size 每页大小（默认10）
     * @param sort 排序字段（可选，格式：field,asc/desc，默认按createdAt降序）
     * @return 响应结果
     */
    @GetMapping("/query/page")
    public Mono<ApiResponse<List<SysRole>>> queryWithPage(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String name,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String sort) {
        
        Pageable pageable = buildPageable(page, size, sort);
        
        return adminRoleService.queryWithPage(code, name, pageable)
            .collectList()
            .map(ApiResponse::success)
            .onErrorResume(e -> Mono.just(ApiResponse.fail("分页查询角色失败：" + e.getMessage())));
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

