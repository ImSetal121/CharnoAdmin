package org.charno.customwechatcustomer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.charno.commonsecurity.config.PermitAllPathProvider;
import org.charno.systementity.entity.SysConfig;
import org.charno.systementity.repository.SysConfigRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.List;

/**
 * 微信客服模块初始化
 * 负责检查并创建微信企业ID和密钥相关配置项
 * 
 * 参考：https://developer.work.weixin.qq.com/document/path/91039
 */
@Slf4j
@Component("wechatCustomerModuleInitialization")  // 指定唯一的 Bean 名称，避免冲突
@RequiredArgsConstructor
public class ModuleInitialization implements ApplicationRunner, PermitAllPathProvider {

    private final SysConfigRepository configRepository;
    private final R2dbcEntityTemplate template;

    /**
     * 微信企业ID配置键
     */
    private static final String WECHAT_CORP_ID_KEY = "wechat.corp.id";
    
    /**
     * 微信企业密钥配置键
     */
    private static final String WECHAT_CORP_SECRET_KEY = "wechat.corp.secret";
    
    /**
     * 企业微信验证 Token 配置键
     */
    private static final String WECHAT_VERIFY_TOKEN_KEY = "wechat.verify.token";
    
    /**
     * 企业微信 EncodingAESKey 配置键
     */
    private static final String WECHAT_ENCODING_AES_KEY = "wechat.verify.encoding_aes_key";

    @Override
    public void run(ApplicationArguments args) {
        log.info("开始初始化微信客服模块配置...");
        
        initializeWechatConfig(WECHAT_CORP_ID_KEY, "企业微信企业ID", "请在企业管理后台获取企业ID")
            .then(initializeWechatConfig(WECHAT_CORP_SECRET_KEY, "企业微信企业密钥", "请在企业管理后台获取企业密钥"))
            .then(initializeWechatConfig(WECHAT_VERIFY_TOKEN_KEY, "企业微信验证Token", "用于企业微信回调URL验证，需与企业微信配置一致"))
            .then(initializeWechatConfig(WECHAT_ENCODING_AES_KEY, "企业微信EncodingAESKey", "43位Base64字符串，用于消息加解密，需与企业微信配置一致"))
            .doOnSuccess(v -> log.info("微信客服模块配置初始化完成"))
            .doOnError(e -> log.error("微信客服模块配置初始化失败", e))
            .subscribe();
    }

    /**
     * 初始化微信配置项
     * 如果配置项不存在，则创建默认配置项（值为空，需要后续在管理后台配置）
     * 
     * @param key 配置键
     * @param description 配置描述
     * @param hint 配置提示信息
     * @return Mono<Void>
     */
    private Mono<Void> initializeWechatConfig(String key, String description, String hint) {
        return configRepository.existsById(key)
            .flatMap(exists -> {
                if (exists) {
                    log.debug("配置项已存在: {}", key);
                    return Mono.empty();
                } else {
                    log.info("创建微信配置项: {} - {}", key, description);
                    SysConfig config = new SysConfig();
                    config.setKey(key);
                    config.setValue(""); // 默认值为空，需要在管理后台配置
                    config.setDescription(description + "。提示：" + hint);
                    
                    return template.insert(config)
                        .doOnSuccess(v -> log.info("成功创建配置项: {}", key))
                        .doOnError(e -> log.error("创建配置项失败: {}", key, e))
                        .then();
                }
            });
    }

    /**
     * 获取微信客服模块需要放行的路径
     * 注册企业微信回调接口，允许匿名访问
     * 
     * @return 路径列表
     */
    @Override
    public List<String> getPermitAllPaths() {
        return Arrays.asList(
            "/api/wechat/callback/**"  // 企业微信回调接口（包括验证接口和其他回调接口）
        );
    }
}
