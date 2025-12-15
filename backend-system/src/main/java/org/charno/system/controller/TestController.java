package org.charno.system.controller;

import org.charno.commonweb.response.ApiResponse;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 测试控制器
 */
@RestController
@RequestMapping("/api/test")
public class TestController {

    /**
     * 测试接口 - GET请求
     *
     * @return 响应结果
     */
    @GetMapping("/hello")
    public Mono<ApiResponse<String>> hello() {
        return Mono.just(ApiResponse.success("Hello, World!"));
    }

    /**
     * 测试接口 - 带参数
     *
     * @param name 名称参数
     * @return 响应结果
     */
    @GetMapping("/greet")
    public Mono<ApiResponse<String>> greet(@RequestParam(required = false, defaultValue = "Guest") String name) {
        String message = String.format("Hello, %s! Welcome to MetaWebProject.", name);
        return Mono.just(ApiResponse.success(message));
    }

    /**
     * 测试接口 - POST请求
     *
     * @param requestBody 请求体
     * @return 响应结果
     */
    @PostMapping("/echo")
    public Mono<ApiResponse<Map<String, Object>>> echo(@RequestBody Map<String, Object> requestBody) {
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("received", requestBody);
        responseData.put("timestamp", LocalDateTime.now());
        return Mono.just(ApiResponse.success("数据接收成功", responseData));
    }

    /**
     * 测试接口 - 返回详细信息
     *
     * @return 响应结果
     */
    @GetMapping("/info")
    public Mono<ApiResponse<Map<String, Object>>> info() {
        Map<String, Object> info = new HashMap<>();
        info.put("application", "MetaWebProject");
        info.put("module", "backend-system");
        info.put("version", "0.0.1-SNAPSHOT");
        info.put("timestamp", LocalDateTime.now());
        info.put("framework", "Spring WebFlux");
        return Mono.just(ApiResponse.success("系统信息", info));
    }

    /**
     * 测试接口 - 健康检查
     *
     * @return 响应结果
     */
    @GetMapping("/health")
    public Mono<ApiResponse<Map<String, String>>> health() {
        Map<String, String> health = new HashMap<>();
        health.put("status", "UP");
        health.put("message", "服务运行正常");
        return Mono.just(ApiResponse.success(health));
    }
}

