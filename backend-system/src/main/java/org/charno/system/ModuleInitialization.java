package org.charno.system;

import org.charno.commonsecurity.config.PermitAllPathProvider;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * 系统模块初始化
 * 负责系统模块的启动时初始化工作，包括注册系统模块需要放行的路径
 */
@Component
public class ModuleInitialization implements ApplicationRunner, PermitAllPathProvider {
    
    @Override
    public void run(ApplicationArguments args) throws Exception {
        // 系统模块初始化逻辑
    }
    
    /**
     * 获取系统模块需要放行的路径
     * 包括登录和注册接口
     * 
     * @return 路径列表
     */
    @Override
    public List<String> getPermitAllPaths() {
        return Arrays.asList(
                "/api/login",       // 登录接口
                "/api/register"     // 注册接口
        );
    }
}
