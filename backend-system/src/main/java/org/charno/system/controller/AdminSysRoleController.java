package org.charno.system.controller;

import org.charno.commonsecurity.annotation.RequiresRole;
import org.charno.commonweb.response.ApiResponse;
import org.charno.systementity.entity.SysRole;
import org.charno.systementity.repository.SysRoleRepository;
import org.charno.system.service.AdminSysRoleService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

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

    public AdminSysRoleController(AdminSysRoleService adminRoleService, SysRoleRepository roleRepository) {
        this.adminRoleService = adminRoleService;
        this.roleRepository = roleRepository;
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
        return roleRepository.save(role)
            .map(ApiResponse::success)
            .onErrorResume(e -> Mono.just(ApiResponse.fail("创建角色失败：" + e.getMessage())));
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
        role.setCode(code);
        return roleRepository.save(role)
            .map(ApiResponse::success)
            .onErrorResume(e -> Mono.just(ApiResponse.fail("更新角色失败：" + e.getMessage())));
    }

    /**
     * 删除角色
     * 
     * @param code 角色代码
     * @return 响应结果
     */
    @DeleteMapping("/{code}")
    public Mono<ApiResponse<Void>> delete(@PathVariable String code) {
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

