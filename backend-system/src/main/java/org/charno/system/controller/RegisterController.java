package org.charno.system.controller;

import org.charno.commonweb.response.ApiResponse;
import org.charno.systementity.entity.SysUser;
import org.charno.system.service.RegisterService;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * 注册控制器
 * 面向业务的控制类，实现注册相关的业务功能
 */
@RestController
@RequestMapping("/api/register")
public class RegisterController {

    private final RegisterService registerService;

    public RegisterController(RegisterService registerService) {
        this.registerService = registerService;
    }

    /**
     * 用户名密码注册
     * 账号类型固定为 USERNAME
     * 
     * @param requestBody 请求体，包含 username、password、nickname
     * @return 响应结果，包含用户信息
     */
    @PostMapping
    public Mono<ApiResponse<SysUser>> register(@RequestBody Map<String, String> requestBody) {
        String username = requestBody.get("username");
        String password = requestBody.get("password");
        String nickname = requestBody.get("nickname");
        
        // 参数验证
        if (username == null || username.isEmpty()) {
            return Mono.just(ApiResponse.fail("用户名不能为空"));
        }
        if (password == null || password.isEmpty()) {
            return Mono.just(ApiResponse.fail("密码不能为空"));
        }
        if (nickname == null || nickname.isEmpty()) {
            return Mono.just(ApiResponse.fail("昵称不能为空"));
        }
        
        return registerService.register(username, password, nickname)
                .map(ApiResponse::success)
                .onErrorResume(e -> Mono.just(ApiResponse.fail(e.getMessage())));
    }
}

