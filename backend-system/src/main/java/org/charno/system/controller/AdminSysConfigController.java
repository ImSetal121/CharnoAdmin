package org.charno.system.controller;

import org.charno.common.security.annotation.RequiresRole;
import org.charno.common.web.response.ApiResponse;
import org.charno.common.web.response.PageResult;
import org.charno.systementity.entity.SysConfig;
import org.charno.systementity.repository.SysConfigRepository;
import org.charno.system.service.AdminSysConfigService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;

/**
 * 系统配置管理控制器
 * 面向管理的控制类，提供CRUD及条件查询功能
 */
@RequiresRole("ADMIN")
@RestController
@RequestMapping("/api/admin/configs")
public class AdminSysConfigController {

    private final AdminSysConfigService adminConfigService;
    private final SysConfigRepository configRepository;
    private final R2dbcEntityTemplate template;

    public AdminSysConfigController(AdminSysConfigService adminConfigService, 
                                    SysConfigRepository configRepository,
                                    R2dbcEntityTemplate template) {
        this.adminConfigService = adminConfigService;
        this.configRepository = configRepository;
        this.template = template;
    }

    // ==================== CRUD 操作 ====================

    /**
     * 创建配置
     * 
     * 注意：SysConfig 使用业务主键（String key），需要先检查存在性，
     * 然后使用 R2dbcEntityTemplate.insert() 强制插入。
     * 
     * @param config 配置实体
     * @return 响应结果
     */
    @PostMapping
    public Mono<ApiResponse<SysConfig>> create(@RequestBody SysConfig config) {
        // 检查配置键是否已存在
        if (config.getKey() == null || config.getKey().isEmpty()) {
            return Mono.just(ApiResponse.<SysConfig>fail("配置键不能为空"));
        }
        
        return configRepository.existsById(config.getKey())
            .flatMap(exists -> {
                if (exists) {
                    return Mono.just(ApiResponse.<SysConfig>fail("配置键已存在：" + config.getKey()));
                }
                // 使用 insert() 方法强制插入新记录，避免 save() 尝试更新
                return template.insert(config)
                    .map(ApiResponse::success);
            })
            .onErrorResume(e -> Mono.just(ApiResponse.<SysConfig>fail("创建配置失败：" + e.getMessage())));
    }

    /**
     * 根据键查询配置
     * 
     * @param key 配置键
     * @return 响应结果
     */
    @GetMapping("/{key}")
    public Mono<ApiResponse<SysConfig>> getByKey(@PathVariable String key) {
        return configRepository.findById(key)
            .map(ApiResponse::success)
            .switchIfEmpty(Mono.just(ApiResponse.fail("配置不存在")))
            .onErrorResume(e -> Mono.just(ApiResponse.fail("查询配置失败：" + e.getMessage())));
    }

    /**
     * 更新配置
     * 
     * 注意：必须先查询现有记录，然后更新允许修改的字段。
     * SysConfig 的 key 是主键不能修改，可以更新 value 和 description。
     * 
     * @param key 配置键
     * @param config 配置实体
     * @return 响应结果
     */
    @PutMapping("/{key}")
    public Mono<ApiResponse<SysConfig>> update(@PathVariable String key, @RequestBody SysConfig config) {
        // 先查询现有配置
        return configRepository.findById(key)
            .flatMap(existingConfig -> {
                // 更新配置值
                if (config.getValue() != null) {
                    existingConfig.setValue(config.getValue());
                }
                // 更新配置描述
                if (config.getDescription() != null) {
                    existingConfig.setDescription(config.getDescription());
                }
                
                return configRepository.save(existingConfig)
                    .map(ApiResponse::success);
            })
            .switchIfEmpty(Mono.just(ApiResponse.<SysConfig>fail("配置不存在")))
            .onErrorResume(e -> Mono.just(ApiResponse.<SysConfig>fail("更新配置失败：" + e.getMessage())));
    }

    /**
     * 删除配置
     * 
     * @param key 配置键
     * @return 响应结果
     */
    @DeleteMapping("/{key}")
    public Mono<ApiResponse<Void>> delete(@PathVariable String key) {
        return configRepository.deleteById(key)
            .then(Mono.just(ApiResponse.<Void>success()))
            .onErrorResume(e -> Mono.just(ApiResponse.<Void>fail("删除配置失败：" + e.getMessage())));
    }

    // ==================== 条件查询 ====================

    /**
     * 不分页条件查询配置
     * 
     * @param key 配置键（可选，支持模糊查询）
     * @param value 配置值（可选，支持模糊查询）
     * @return 响应结果
     */
    @GetMapping("/query")
    public Mono<ApiResponse<List<SysConfig>>> query(
            @RequestParam(required = false) String key,
            @RequestParam(required = false) String value) {
        return adminConfigService.query(key, value)
            .collectList()
            .map(ApiResponse::success)
            .onErrorResume(e -> Mono.just(ApiResponse.fail("查询配置失败：" + e.getMessage())));
    }

    /**
     * 分页条件查询配置
     * 
     * @param key 配置键（可选，支持模糊查询）
     * @param value 配置值（可选，支持模糊查询）
     * @param page 页码（从0开始，默认0）
     * @param size 每页大小（默认10）
     * @param sort 排序字段（可选，格式：field,asc/desc，默认按key升序）
     * @return 响应结果
     */
    @GetMapping("/query/page")
    public Mono<ApiResponse<PageResult<SysConfig>>> queryWithPage(
            @RequestParam(required = false) String key,
            @RequestParam(required = false) String value,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String sort) {
        
        Pageable pageable = buildPageable(page, size, sort);
        
        return adminConfigService.queryWithPage(key, value, pageable)
            .map(ApiResponse::success)
            .onErrorResume(e -> Mono.just(ApiResponse.fail("分页查询配置失败：" + e.getMessage())));
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
        // 默认按配置键升序
        return PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "key"));
    }
}

