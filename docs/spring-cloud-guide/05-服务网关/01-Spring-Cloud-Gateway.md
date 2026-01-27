# Spring Cloud Gateway

## Gateway 简介

Spring Cloud Gateway 是 Spring Cloud 官方推出的第二代网关框架，基于 Spring WebFlux 和 Project Reactor 构建，提供高性能、非阻塞的 API 网关服务。

### 主要功能

- **路由**：将请求路由到不同的微服务
- **过滤器**：在请求处理前后执行自定义逻辑
- **限流**：防止服务过载
- **跨域**：处理跨域请求
- **负载均衡**：集成 Spring Cloud LoadBalancer

### 与 Zuul 的对比

| 特性 | Spring Cloud Gateway | Zuul |
|------|---------------------|------|
| 性能 | 基于 WebFlux，性能更高 | 基于 Servlet，性能较低 |
| 支持协议 | HTTP、WebSocket | HTTP |
| 过滤器 | 功能更强大 | 功能相对简单 |
| 维护状态 | 积极维护 | 进入维护模式 |

## 创建 Gateway 服务

### 1. 创建 Gateway 模块

在父项目中添加新模块 `api-gateway`。

### 2. 添加依赖

在 `api-gateway/pom.xml` 中添加依赖：

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-gateway</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
</dependencies>
```

**注意**：Gateway 不能同时引入 `spring-boot-starter-web` 依赖，因为 Gateway 基于 WebFlux，与 WebMVC 冲突。

### 3. 创建主类

创建 `GatewayApplication.java`：

```java
package com.example.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;

@SpringBootApplication
@EnableEurekaClient
public class GatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(GatewayApplication.class, args);
    }
}
```

### 4. 配置 application.yml

#### 基础路由配置

```yaml
server:
  port: 8080

spring:
  application:
    name: api-gateway
  cloud:
    gateway:
      routes:
        # 路由到 service-provider
        - id: service-provider-route
          uri: http://localhost:8081
          predicates:
            - Path=/provider/**
          filters:
            - StripPrefix=1  # 去掉前缀 /provider
        # 路由到 service-consumer
        - id: service-consumer-route
          uri: http://localhost:8082
          predicates:
            - Path=/consumer/**
          filters:
            - StripPrefix=1
```

#### 使用服务发现

```yaml
server:
  port: 8080

spring:
  application:
    name: api-gateway
  cloud:
    gateway:
      discovery:
        locator:
          enabled: true  # 启用服务发现
          lower-case-service-id: true  # 服务名转小写
      routes:
        - id: service-provider-route
          uri: lb://service-provider  # lb:// 表示使用负载均衡
          predicates:
            - Path=/provider/**
          filters:
            - StripPrefix=1
```

## 路由配置详解

### 路由规则

路由配置包含三个主要部分：
- **id**：路由的唯一标识
- **uri**：目标服务地址
- **predicates**：路由断言（匹配条件）
- **filters**：过滤器（请求处理逻辑）

### 常用 Predicates

#### Path 断言

```yaml
predicates:
  - Path=/api/user/**,/api/order/**
```

#### Method 断言

```yaml
predicates:
  - Method=GET,POST
```

#### Header 断言

```yaml
predicates:
  - Header=X-Request-Id, \d+
```

#### Query 断言

```yaml
predicates:
  - Query=name, zhangsan
```

#### After 断言（时间）

```yaml
predicates:
  - After=2024-01-01T00:00:00+08:00
```

#### Before 断言

```yaml
predicates:
  - Before=2024-12-31T23:59:59+08:00
```

#### Between 断言

```yaml
predicates:
  - Between=2024-01-01T00:00:00+08:00,2024-12-31T23:59:59+08:00
```

### 组合断言

多个断言之间是 AND 关系：

```yaml
predicates:
  - Path=/api/**
  - Method=GET
  - Header=X-Request-Id, \d+
```

## 过滤器（Filter）

### 内置过滤器

#### StripPrefix

去掉路径前缀：

```yaml
filters:
  - StripPrefix=1  # 去掉第一个路径段
```

例如：`/provider/hello` → `/hello`

#### PrefixPath

添加路径前缀：

```yaml
filters:
  - PrefixPath=/api
```

#### AddRequestHeader

添加请求头：

```yaml
filters:
  - AddRequestHeader=X-Request-Id, 12345
```

#### AddRequestParameter

添加请求参数：

```yaml
filters:
  - AddRequestParameter=name, value
```

#### AddResponseHeader

添加响应头：

```yaml
filters:
  - AddResponseHeader=X-Response-Id, 12345
```

#### RemoveRequestHeader

移除请求头：

```yaml
filters:
  - RemoveRequestHeader=X-Secret-Header
```

#### Retry

重试：

```yaml
filters:
  - name: Retry
    args:
      retries: 3
      statuses: BAD_GATEWAY
      methods: GET,POST
```

#### CircuitBreaker

熔断器：

```yaml
filters:
  - name: CircuitBreaker
    args:
      name: myCircuitBreaker
      fallbackUri: forward:/fallback
```

### 自定义过滤器

#### 全局过滤器

创建 `CustomGlobalFilter.java`：

```java
package com.example.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class CustomGlobalFilter implements GlobalFilter, Ordered {
    
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        // 获取请求
        String token = exchange.getRequest().getHeaders().getFirst("Authorization");
        
        // 验证 token
        if (token == null || !token.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
        
        // 继续执行
        return chain.filter(exchange);
    }
    
    @Override
    public int getOrder() {
        return 0;  // 优先级，数字越小优先级越高
    }
}
```

#### 路由过滤器

创建 `CustomGatewayFilterFactory.java`：

```java
package com.example.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;

@Component
public class CustomGatewayFilterFactory extends AbstractGatewayFilterFactory<CustomGatewayFilterFactory.Config> {
    
    public CustomGatewayFilterFactory() {
        super(Config.class);
    }
    
    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest().mutate()
                    .header("X-Custom-Header", config.getValue())
                    .build();
            return chain.filter(exchange.mutate().request(request).build());
        };
    }
    
    public static class Config {
        private String value;
        
        public String getValue() {
            return value;
        }
        
        public void setValue(String value) {
            this.value = value;
        }
    }
}
```

使用自定义过滤器：

```yaml
filters:
  - Custom=my-value
```

## 限流配置

### 使用 Redis 实现限流

#### 1. 添加依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis-reactive</artifactId>
</dependency>
```

#### 2. 配置限流

```yaml
spring:
  redis:
    host: localhost
    port: 6379
  cloud:
    gateway:
      routes:
        - id: service-provider-route
          uri: lb://service-provider
          predicates:
            - Path=/provider/**
          filters:
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 10  # 每秒允许的请求数
                redis-rate-limiter.burstCapacity: 20  # 令牌桶容量
                key-resolver: "#{@ipKeyResolver}"  # 限流键解析器
```

#### 3. 创建限流键解析器

```java
package com.example.gateway.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Mono;

@Configuration
public class RateLimiterConfig {
    
    @Bean
    public KeyResolver ipKeyResolver() {
        return exchange -> Mono.just(
            exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
        );
    }
}
```

## 跨域配置

### 全局跨域配置

```java
package com.example.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

@Configuration
public class CorsConfig {
    
    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.addAllowedOriginPattern("*");
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        config.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        
        return new CorsWebFilter(source);
    }
}
```

## 监控和管理

### 启用 Actuator

```yaml
management:
  endpoints:
    web:
      exposure:
        include: gateway, health, info
  endpoint:
    gateway:
      enabled: true
```

### 查看路由信息

访问 http://localhost:8080/actuator/gateway/routes 查看所有路由配置。

## 常见问题

### 1. 路由不生效

**检查**：
- 路由配置是否正确
- 服务是否已注册到 Eureka
- 断言条件是否匹配

### 2. 过滤器不执行

**检查**：
- 过滤器配置是否正确
- 过滤器顺序是否正确
- 是否有异常被捕获

### 3. 跨域问题

**解决**：配置全局跨域过滤器。

## 下一步

API 网关实现了统一的请求入口。接下来我们将学习服务调用，使用 OpenFeign 简化服务间调用。请继续学习下一章节：[OpenFeign 声明式服务调用](../06-服务调用/01-OpenFeign-声明式服务调用.md)。

