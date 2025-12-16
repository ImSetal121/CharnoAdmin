package org.charno.commonredis.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.RedisSerializer;

/**
 * Redis配置类
 * 配置ReactiveRedisTemplate支持Object类型存储（使用Jackson序列化）
 */
@Configuration
public class RedisConfig {

    /**
     * 配置ReactiveRedisTemplate，支持Object类型
     * 使用Jackson2JsonRedisSerializer进行JSON序列化
     */
    @Bean
    @Primary
    public ReactiveRedisTemplate<String, Object> reactiveRedisTemplate(
            ReactiveRedisConnectionFactory connectionFactory,
            ObjectMapper objectMapper) {
        
        // 配置序列化器，使用Jackson进行JSON序列化
        Jackson2JsonRedisSerializer<Object> jsonSerializer = new Jackson2JsonRedisSerializer<>(Object.class);
        jsonSerializer.setObjectMapper(objectMapper);
        
        // 配置Redis序列化上下文
        RedisSerializationContext<String, Object> serializationContext = 
                RedisSerializationContext.<String, Object>newSerializationContext()
                        .key(RedisSerializer.string())
                        .value(jsonSerializer)
                        .hashKey(RedisSerializer.string())
                        .hashValue(jsonSerializer)
                        .build();
        
        return new ReactiveRedisTemplate<>(connectionFactory, serializationContext);
    }
}

