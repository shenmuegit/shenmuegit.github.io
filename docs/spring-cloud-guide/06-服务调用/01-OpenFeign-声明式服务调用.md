---
layout: default
title: OpenFeign 声明式服务调用
parent: 服务调用
grand_parent: Spring Cloud 教程
nav_order: 1
---

# OpenFeign 声明式服务调用

> 📊 **难度**：🟡 进阶 | ⏱️ **阅读时间**：30 分钟
> 
> 📝 **本章摘要**：学习 OpenFeign 声明式服务调用，简化微服务间的 HTTP 通信。

## 🎯 学习目标

学完本章后，你将能够：
- 创建 Feign 客户端接口
- 配置超时和重试
- 传递请求头
- 处理错误和降级
- 集成负载均衡

---

## OpenFeign 简介

OpenFeign 是一个声明式的 HTTP 客户端，它使得编写 HTTP 客户端变得简单。使用 OpenFeign，只需要创建一个接口并添加注解，就可以实现服务调用。

### 主要特性

- **声明式调用**：通过接口和注解定义服务调用
- **负载均衡**：集成 Spring Cloud LoadBalancer
- **熔断器支持**：可以集成 Resilience4j 或 Sentinel
- **请求/响应拦截**：支持自定义拦截器
- **错误处理**：支持自定义错误解码器

## 添加依赖

在 `service-consumer/pom.xml` 中添加依赖：

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-openfeign</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
</dependencies>
```

## 创建 Feign 客户端接口

### 1. 启用 Feign

在主类上添加 `@EnableFeignClients` 注解：

```java
package com.example.consumer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableEurekaClient
@EnableFeignClients  // 启用 Feign 客户端
public class ConsumerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConsumerApplication.class, args);
    }
}
```

### 2. 创建 Feign 客户端接口

创建 `ProviderClient.java`：

```java
package com.example.consumer.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "service-provider")  // 服务名
public interface ProviderClient {
    
    @GetMapping("/hello")
    String hello();
    
    @GetMapping("/hello/{name}")
    String hello(@PathVariable String name);
}
```

### 3. 使用 Feign 客户端

在 Controller 中注入并使用：

```java
package com.example.consumer.controller;

import com.example.consumer.client.ProviderClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class FeignController {
    
    @Autowired
    private ProviderClient providerClient;
    
    @GetMapping("/feign/hello")
    public String hello() {
        return providerClient.hello();
    }
    
    @GetMapping("/feign/hello/{name}")
    public String hello(@PathVariable String name) {
        return providerClient.hello(name);
    }
}
```

## 配置详解

### application.yml 配置

```yaml
server:
  port: 8082

spring:
  application:
    name: service-consumer

eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/

# Feign 配置
feign:
  client:
    config:
      default:  # 默认配置，对所有 Feign 客户端生效
        connectTimeout: 5000  # 连接超时时间（毫秒）
        readTimeout: 5000  # 读取超时时间（毫秒）
        loggerLevel: full  # 日志级别：NONE, BASIC, HEADERS, FULL
      service-provider:  # 针对特定服务的配置
        connectTimeout: 3000
        readTimeout: 3000
  compression:
    request:
      enabled: true  # 启用请求压缩
    response:
      enabled: true  # 启用响应压缩
  httpclient:
    enabled: true  # 使用 Apache HttpClient（需要添加依赖）
    max-connections: 200  # 最大连接数
    max-connections-per-route: 50  # 每个路由的最大连接数
```

### 使用 Apache HttpClient

如果需要使用 Apache HttpClient，添加依赖：

```xml
<dependency>
    <groupId>io.github.openfeign</groupId>
    <artifactId>feign-httpclient</artifactId>
</dependency>
```

### 使用 OkHttp

如果需要使用 OkHttp，添加依赖：

```xml
<dependency>
    <groupId>io.github.openfeign</groupId>
    <artifactId>feign-okhttp</artifactId>
</dependency>
```

配置：

```yaml
feign:
  okhttp:
    enabled: true
```

## 传递请求头

### 方式一：使用 @RequestHeader

```java
@FeignClient(name = "service-provider")
public interface ProviderClient {
    
    @GetMapping("/hello")
    String hello(@RequestHeader("Authorization") String token);
}
```

### 方式二：使用 RequestInterceptor

创建 `FeignRequestInterceptor.java`：

```java
package com.example.consumer.interceptor;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;

@Component
public class FeignRequestInterceptor implements RequestInterceptor {
    
    @Override
    public void apply(RequestTemplate template) {
        ServletRequestAttributes attributes = 
            (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            // 传递请求头
            String token = request.getHeader("Authorization");
            if (token != null) {
                template.header("Authorization", token);
            }
        }
    }
}
```

## 错误处理

### 自定义错误解码器

创建 `FeignErrorDecoder.java`：

```java
package com.example.consumer.decoder;

import feign.Response;
import feign.codec.ErrorDecoder;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class FeignErrorDecoder implements ErrorDecoder {
    
    private final ErrorDecoder defaultErrorDecoder = new Default();
    
    @Override
    public Exception decode(String methodKey, Response response) {
        if (response.status() == 404) {
            return new ResponseStatusException(
                HttpStatus.NOT_FOUND, 
                "Service not found"
            );
        }
        if (response.status() == 500) {
            return new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Internal server error"
            );
        }
        return defaultErrorDecoder.decode(methodKey, response);
    }
}
```

配置错误解码器：

```java
@FeignClient(
    name = "service-provider",
    configuration = FeignConfiguration.class
)
public interface ProviderClient {
    // ...
}
```

```java
package com.example.consumer.config;

import com.example.consumer.decoder.FeignErrorDecoder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeignConfiguration {
    
    @Bean
    public FeignErrorDecoder errorDecoder() {
        return new FeignErrorDecoder();
    }
}
```

## 负载均衡

OpenFeign 默认集成了 Spring Cloud LoadBalancer，会自动进行负载均衡。

### 配置负载均衡

```yaml
spring:
  cloud:
    loadbalancer:
      ribbon:
        enabled: false  # 禁用 Ribbon（已弃用）
```

## 熔断器集成

### 1. 添加依赖

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-circuitbreaker-resilience4j</artifactId>
</dependency>
```

### 2. 配置熔断器

```yaml
resilience4j:
  circuitbreaker:
    configs:
      default:
        registerHealthIndicator: true
        slidingWindowSize: 10
        minimumNumberOfCalls: 5
        permittedNumberOfCallsInHalfOpenState: 3
        automaticTransitionFromOpenToHalfOpenEnabled: true
        waitDurationInOpenState: 5s
        failureRateThreshold: 50
        eventConsumerBufferSize: 10
    instances:
      providerClient:
        baseConfig: default
```

### 3. 启用熔断器

```yaml
feign:
  circuitbreaker:
    enabled: true
```

### 4. 创建降级类

```java
package com.example.consumer.fallback;

import com.example.consumer.client.ProviderClient;
import org.springframework.stereotype.Component;

@Component
public class ProviderClientFallback implements ProviderClient {
    
    @Override
    public String hello() {
        return "Service unavailable, fallback response";
    }
    
    @Override
    public String hello(String name) {
        return "Hello, " + name + "! Service unavailable, fallback response";
    }
}
```

### 5. 配置降级类

```java
@FeignClient(
    name = "service-provider",
    fallback = ProviderClientFallback.class
)
public interface ProviderClient {
    // ...
}
```

## 日志配置

### 配置日志级别

```yaml
logging:
  level:
    com.example.consumer.client: DEBUG  # Feign 客户端接口的包路径
```

### Feign 日志级别

```yaml
feign:
  client:
    config:
      default:
        loggerLevel: full  # NONE, BASIC, HEADERS, FULL
```

## 传递复杂对象

### GET 请求传递对象

```java
@FeignClient(name = "service-provider")
public interface ProviderClient {
    
    @GetMapping("/user")
    User getUser(@SpringQueryMap UserQuery query);
}
```

### POST 请求传递对象

```java
@FeignClient(name = "service-provider")
public interface ProviderClient {
    
    @PostMapping("/user")
    User createUser(@RequestBody User user);
}
```

## 文件上传

```java
@FeignClient(name = "service-provider")
public interface ProviderClient {
    
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    String uploadFile(@RequestPart("file") MultipartFile file);
}
```

## 常见问题

### 1. 服务调用失败

**检查**：
- 服务是否已注册到 Eureka
- 服务名是否正确
- 接口路径是否正确

### 2. 超时问题

**解决**：调整 `connectTimeout` 和 `readTimeout` 配置。

### 3. 404 错误

**检查**：
- 接口路径是否匹配
- HTTP 方法是否正确
- 路径参数是否正确

### 4. 请求头丢失

**解决**：使用 `RequestInterceptor` 传递请求头。

## 下一步

服务调用是微服务间通信的基础。接下来我们将学习熔断降级，提高系统的容错能力。

---

<div align="center">

⬅️ [上一章：Spring Cloud Gateway](../05-服务网关/01-Spring-Cloud-Gateway.md) | 🏠 [返回目录](../../../README.md) | [下一章：Resilience4j 熔断器](../07-熔断降级/01-Resilience4j-熔断器.md) ➡️

</div>

