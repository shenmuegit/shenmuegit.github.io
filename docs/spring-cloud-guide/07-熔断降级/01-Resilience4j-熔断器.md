---
layout: default
title: Resilience4j 熔断器
parent: 熔断降级
grand_parent: Spring Cloud 教程
nav_order: 1
---

# Resilience4j 熔断器

> 📊 **难度**：🔴 高级 | ⏱️ **阅读时间**：40 分钟
> 
> 📝 **本章摘要**：学习 Resilience4j 熔断器，实现服务的熔断、降级、限流和重试。

## 🎯 学习目标

学完本章后，你将能够：
- 理解熔断器模式的原理
- 配置 Resilience4j 熔断器
- 实现服务降级
- 配置重试和限流
- 组合使用多种容错模式

---

## Resilience4j 简介

Resilience4j 是一个轻量级的容错库，专为 Java 8 和函数式编程设计。它提供了多种容错模式，包括熔断器、限流器、重试、超时和隔离。

### 主要组件

- **Circuit Breaker**：熔断器，防止级联故障
- **Rate Limiter**：限流器，控制请求速率
- **Retry**：重试机制，自动重试失败的请求
- **Time Limiter**：超时控制，限制方法执行时间
- **Bulkhead**：隔离，限制并发执行数量

### 与 Hystrix 的对比

| 特性 | Resilience4j | Hystrix |
|------|--------------|---------|
| 维护状态 | 积极维护 | 进入维护模式 |
| 依赖 | 仅依赖 Vavr | 依赖较多 |
| 性能 | 更高 | 较低 |
| 函数式支持 | 完全支持 | 部分支持 |

## 添加依赖

在 `pom.xml` 中添加依赖：

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-circuitbreaker-resilience4j</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-aop</artifactId>
    </dependency>
</dependencies>
```

## 配置熔断器

### application.yml 配置

```yaml
resilience4j:
  circuitbreaker:
    configs:
      default:
        # 滑动窗口大小
        slidingWindowSize: 10
        # 最小调用次数
        minimumNumberOfCalls: 5
        # 半开状态允许的调用次数
        permittedNumberOfCallsInHalfOpenState: 3
        # 自动从开启状态转换到半开状态
        automaticTransitionFromOpenToHalfOpenEnabled: true
        # 开启状态的等待时间
        waitDurationInOpenState: 5s
        # 失败率阈值（百分比）
        failureRateThreshold: 50
        # 慢调用率阈值（百分比）
        slowCallRateThreshold: 100
        # 慢调用持续时间阈值
        slowCallDurationThreshold: 2s
        # 注册健康指标
        registerHealthIndicator: true
        # 事件消费者缓冲区大小
        eventConsumerBufferSize: 10
    instances:
      # 自定义熔断器实例
      myCircuitBreaker:
        baseConfig: default
        slidingWindowSize: 20
        failureRateThreshold: 30
```

## 使用熔断器

### 方式一：使用注解

#### 1. 启用 AOP

在主类上添加 `@EnableCircuitBreaker` 或使用 `@SpringBootApplication`（Spring Boot 2.4+ 已自动启用）：

```java
package com.example.consumer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;

@SpringBootApplication
@EnableEurekaClient
public class ConsumerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConsumerApplication.class, args);
    }
}
```

#### 2. 在方法上使用注解

```java
package com.example.consumer.service;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class UserService {
    
    private final RestTemplate restTemplate;
    
    public UserService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }
    
    @CircuitBreaker(name = "myCircuitBreaker", fallbackMethod = "fallback")
    public String getUser(String id) {
        return restTemplate.getForObject(
            "http://service-provider/user/" + id, 
            String.class
        );
    }
    
    // 降级方法
    public String fallback(String id, Exception e) {
        return "Service unavailable, fallback response for user: " + id;
    }
}
```

### 方式二：使用编程式 API

```java
package com.example.consumer.service;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class UserService {
    
    private final RestTemplate restTemplate;
    private final CircuitBreaker circuitBreaker;
    
    public UserService(
        RestTemplate restTemplate,
        CircuitBreakerRegistry circuitBreakerRegistry
    ) {
        this.restTemplate = restTemplate;
        this.circuitBreaker = circuitBreakerRegistry.circuitBreaker("myCircuitBreaker");
    }
    
    public String getUser(String id) {
        return CircuitBreaker.decorateSupplier(
            circuitBreaker,
            () -> restTemplate.getForObject(
                "http://service-provider/user/" + id,
                String.class
            )
        ).get();
    }
}
```

### 方式三：使用函数式编程

```java
package com.example.consumer.service;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.function.Supplier;

@Service
public class UserService {
    
    private final RestTemplate restTemplate;
    private final CircuitBreaker circuitBreaker;
    
    public UserService(
        RestTemplate restTemplate,
        CircuitBreakerRegistry circuitBreakerRegistry
    ) {
        this.restTemplate = restTemplate;
        this.circuitBreaker = circuitBreakerRegistry.circuitBreaker("myCircuitBreaker");
    }
    
    public String getUser(String id) {
        Supplier<String> decoratedSupplier = CircuitBreaker
            .decorateSupplier(circuitBreaker, () -> {
                return restTemplate.getForObject(
                    "http://service-provider/user/" + id,
                    String.class
                );
            });
        
        return decoratedSupplier.get();
    }
}
```

## 熔断器状态

熔断器有三种状态：

1. **CLOSED（关闭）**：正常状态，请求正常通过
2. **OPEN（开启）**：熔断状态，请求直接失败，不调用后端服务
3. **HALF_OPEN（半开）**：尝试恢复状态，允许少量请求通过，根据结果决定是否恢复

### 状态转换

```
CLOSED → OPEN：失败率超过阈值
OPEN → HALF_OPEN：等待时间到期
HALF_OPEN → CLOSED：请求成功
HALF_OPEN → OPEN：请求失败
```

## 降级处理

### 使用 fallbackMethod

```java
@CircuitBreaker(name = "myCircuitBreaker", fallbackMethod = "fallback")
public String getUser(String id) {
    // 业务逻辑
}

public String fallback(String id, Exception e) {
    // 降级逻辑
    return "Fallback response";
}
```

**注意**：降级方法的参数必须与原方法相同，最后一个参数必须是 `Exception` 类型。

### 使用 Fallback 类

```java
package com.example.consumer.fallback;

import com.example.consumer.service.UserService;
import org.springframework.stereotype.Component;

@Component
public class UserServiceFallback {
    
    public String getUserFallback(String id, Exception e) {
        return "Service unavailable, fallback response for user: " + id;
    }
}
```

```java
@Service
public class UserService {
    
    @Autowired
    private UserServiceFallback fallback;
    
    @CircuitBreaker(name = "myCircuitBreaker", fallbackMethod = "getUserFallback")
    public String getUser(String id) {
        // 业务逻辑
    }
}
```

## 重试机制

### 配置重试

```yaml
resilience4j:
  retry:
    configs:
      default:
        # 最大重试次数
        maxAttempts: 3
        # 重试间隔
        waitDuration: 1s
        # 是否启用指数退避
        enableExponentialBackoff: false
        # 指数退避倍数
        exponentialBackoffMultiplier: 2
        # 重试间隔随机化
        randomizeWaitDuration: true
    instances:
      myRetry:
        baseConfig: default
        maxAttempts: 5
```

### 使用重试

```java
import io.github.resilience4j.retry.annotation.Retry;

@Service
public class UserService {
    
    @Retry(name = "myRetry", fallbackMethod = "fallback")
    public String getUser(String id) {
        return restTemplate.getForObject(
            "http://service-provider/user/" + id,
            String.class
        );
    }
}
```

## 限流器

### 配置限流器

```yaml
resilience4j:
  ratelimiter:
    configs:
      default:
        # 时间窗口
        limitForPeriod: 10
        # 刷新周期
        limitRefreshPeriod: 1s
        # 超时时间
        timeoutDuration: 0
    instances:
      myRateLimiter:
        baseConfig: default
        limitForPeriod: 5
```

### 使用限流器

```java
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;

@Service
public class UserService {
    
    @RateLimiter(name = "myRateLimiter", fallbackMethod = "fallback")
    public String getUser(String id) {
        return restTemplate.getForObject(
            "http://service-provider/user/" + id,
            String.class
        );
    }
}
```

## 超时控制

### 配置超时

```yaml
resilience4j:
  timelimiter:
    configs:
      default:
        # 超时时间
        timeoutDuration: 2s
        # 是否取消执行
        cancelRunningFuture: true
    instances:
      myTimeLimiter:
        baseConfig: default
        timeoutDuration: 5s
```

### 使用超时

```java
import io.github.resilience4j.timelimiter.annotation.TimeLimiter;

@Service
public class UserService {
    
    @TimeLimiter(name = "myTimeLimiter", fallbackMethod = "fallback")
    public CompletableFuture<String> getUser(String id) {
        return CompletableFuture.supplyAsync(() -> {
            return restTemplate.getForObject(
                "http://service-provider/user/" + id,
                String.class
            );
        });
    }
}
```

## 组合使用

可以同时使用多个 Resilience4j 组件：

```java
@Service
public class UserService {
    
    @CircuitBreaker(name = "myCircuitBreaker", fallbackMethod = "fallback")
    @Retry(name = "myRetry")
    @RateLimiter(name = "myRateLimiter")
    @TimeLimiter(name = "myTimeLimiter")
    public CompletableFuture<String> getUser(String id) {
        return CompletableFuture.supplyAsync(() -> {
            return restTemplate.getForObject(
                "http://service-provider/user/" + id,
                String.class
            );
        });
    }
}
```

## 监控和指标

### 添加 Actuator 依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

### 配置 Actuator

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,metrics,circuitbreakers
  endpoint:
    health:
      show-details: always
```

### 查看熔断器状态

访问 http://localhost:8082/actuator/health 查看健康状态。

访问 http://localhost:8082/actuator/metrics 查看指标。

## 事件监听

### 创建事件监听器

```java
package com.example.consumer.listener;

import io.github.resilience4j.circuitbreaker.event.CircuitBreakerEvent;
import io.github.resilience4j.circuitbreaker.event.CircuitBreakerOnStateTransitionEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class CircuitBreakerEventListener {
    
    @EventListener
    public void onCircuitBreakerEvent(CircuitBreakerEvent event) {
        System.out.println("Circuit Breaker Event: " + event.getEventType());
    }
    
    @EventListener
    public void onStateTransition(CircuitBreakerOnStateTransitionEvent event) {
        System.out.println("State Transition: " + 
            event.getStateTransition().getFromState() + " -> " + 
            event.getStateTransition().getToState());
    }
}
```

## 常见问题

### 1. 熔断器不生效

**检查**：
- 是否添加了 `spring-boot-starter-aop` 依赖
- 配置是否正确
- 方法是否被 Spring 管理

### 2. 降级方法不执行

**检查**：
- 降级方法参数是否正确
- 降级方法是否在同一个类中
- 异常类型是否匹配

### 3. 重试不生效

**检查**：
- 重试配置是否正确
- 异常类型是否在重试范围内

## 下一步

熔断降级提高了系统的容错能力。接下来我们将学习分布式追踪，实现请求的链路追踪。

---

<div align="center">

⬅️ [上一章：OpenFeign 声明式服务调用](../06-服务调用/01-OpenFeign-声明式服务调用.md) | 🏠 [返回目录](../../../README.md) | [下一章：分布式链路追踪](../08-分布式追踪/01-分布式链路追踪.md) ➡️

</div>

