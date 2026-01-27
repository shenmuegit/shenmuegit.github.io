---
layout: default
title: Eureka 服务提供者与消费者
parent: 服务注册与发现
grand_parent: Spring Cloud 教程
nav_order: 2
---

# Eureka 服务提供者与消费者

> 📊 **难度**：🟡 进阶 | ⏱️ **阅读时间**：35 分钟
> 
> 📝 **本章摘要**：创建服务提供者和消费者，将服务注册到 Eureka，实现服务发现和负载均衡调用。

## 🎯 学习目标

学完本章后，你将能够：
- 创建服务提供者并注册到 Eureka
- 创建服务消费者
- 使用 RestTemplate 调用服务
- 配置负载均衡
- 使用 DiscoveryClient 获取服务信息

---

## 服务提供者（Provider）

服务提供者是向其他服务提供功能的微服务，它需要向 Eureka Server 注册自己，以便其他服务可以发现和调用它。

### 1. 添加依赖

在 `service-provider` 模块的 `pom.xml` 中添加依赖：

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
    </dependency>
</dependencies>
```

### 2. 创建主类

创建 `ProviderApplication.java`：

```java
package com.example.provider;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;

@SpringBootApplication
@EnableEurekaClient  // 启用 Eureka Client
public class ProviderApplication {
    public static void main(String[] args) {
        SpringApplication.run(ProviderApplication.class, args);
    }
}
```

**注意**：在 Spring Cloud 2025.0 中，`@EnableEurekaClient` 注解可以省略，只要添加了 `spring-cloud-starter-netflix-eureka-client` 依赖，Spring Boot 会自动配置。

### 3. 配置 application.yml

```yaml
server:
  port: 8081

spring:
  application:
    name: service-provider  # 服务名称，用于服务发现

eureka:
  client:
    service-url:
      # Eureka Server 地址
      defaultZone: http://localhost:8761/eureka/
  instance:
    # 使用 IP 地址注册（可选）
    prefer-ip-address: true
    # 实例 ID（可选）
    instance-id: ${spring.application.name}:${server.port}
```

### 4. 创建 Controller

创建 `HelloController.java`：

```java
package com.example.provider.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {
    
    @Value("${server.port}")
    private String port;
    
    @GetMapping("/hello")
    public String hello() {
        return "Hello from Service Provider! Port: " + port;
    }
    
    @GetMapping("/hello/{name}")
    public String hello(@PathVariable String name) {
        return "Hello, " + name + "! From Service Provider on port: " + port;
    }
}
```

### 5. 启动服务提供者

```bash
cd service-provider
mvn spring-boot:run
```

启动后，访问 http://localhost:8761，可以在 Eureka Dashboard 中看到 `service-provider` 服务已经注册。

## 服务消费者（Consumer）

服务消费者是调用其他服务的微服务，它从 Eureka Server 获取服务列表，然后调用服务提供者。

### 1. 添加依赖

在 `service-consumer` 模块的 `pom.xml` 中添加依赖：

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-loadbalancer</artifactId>
    </dependency>
</dependencies>
```

### 2. 创建主类

创建 `ConsumerApplication.java`：

```java
package com.example.consumer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
@EnableEurekaClient
public class ConsumerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConsumerApplication.class, args);
    }
    
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
```

### 3. 配置 application.yml

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
```

### 4. 使用 RestTemplate 调用服务

创建 `ConsumerController.java`：

```java
package com.example.consumer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.cloud.client.loadbalancer.LoadBalancerClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@RestController
public class ConsumerController {
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Autowired
    private DiscoveryClient discoveryClient;
    
    @Autowired
    private LoadBalancerClient loadBalancerClient;
    
    /**
     * 方式一：使用 RestTemplate + 服务名调用（需要 @LoadBalanced）
     */
    @GetMapping("/consumer/hello")
    public String hello() {
        // 使用服务名调用，Spring Cloud 会自动进行负载均衡
        String url = "http://service-provider/hello";
        return restTemplate.getForObject(url, String.class);
    }
    
    /**
     * 方式二：手动从 Eureka 获取服务实例
     */
    @GetMapping("/consumer/hello2")
    public String hello2() {
        // 获取服务实例列表
        List<ServiceInstance> instances = discoveryClient.getInstances("service-provider");
        if (instances.isEmpty()) {
            return "No service provider available";
        }
        
        // 获取第一个实例
        ServiceInstance instance = instances.get(0);
        String url = "http://" + instance.getHost() + ":" + instance.getPort() + "/hello";
        return restTemplate.getForObject(url, String.class);
    }
    
    /**
     * 方式三：使用 LoadBalancerClient 进行负载均衡
     */
    @GetMapping("/consumer/hello3")
    public String hello3() {
        ServiceInstance instance = loadBalancerClient.choose("service-provider");
        if (instance == null) {
            return "No service provider available";
        }
        
        String url = "http://" + instance.getHost() + ":" + instance.getPort() + "/hello";
        return restTemplate.getForObject(url, String.class);
    }
    
    @GetMapping("/consumer/hello/{name}")
    public String hello(@PathVariable String name) {
        String url = "http://service-provider/hello/" + name;
        return restTemplate.getForObject(url, String.class);
    }
}
```

### 5. 配置 RestTemplate 支持负载均衡

修改 `ConsumerApplication.java`，添加 `@LoadBalanced` 注解：

```java
package com.example.consumer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
@EnableEurekaClient
public class ConsumerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConsumerApplication.class, args);
    }
    
    @Bean
    @LoadBalanced  // 启用负载均衡
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
```

添加 `@LoadBalanced` 后，RestTemplate 可以使用服务名进行调用，Spring Cloud 会自动进行负载均衡。

### 6. 启动服务消费者

```bash
cd service-consumer
mvn spring-boot:run
```

## 负载均衡

### 启动多个服务提供者实例

为了演示负载均衡，我们可以启动多个服务提供者实例：

```bash
# 第一个实例（端口 8081）
cd service-provider
mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8081

# 第二个实例（端口 8083，新终端窗口）
mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8083
```

或者修改 `application.yml`，使用不同的配置文件：

**application-8081.yml**：
```yaml
server:
  port: 8081
```

**application-8083.yml**：
```yaml
server:
  port: 8083
```

然后分别使用不同的 profile 启动：
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=8081
mvn spring-boot:run -Dspring-boot.run.profiles=8083
```

### 测试负载均衡

多次访问 http://localhost:8082/consumer/hello，可以看到请求被分发到不同的服务提供者实例。

## 服务发现 API

Spring Cloud 提供了 `DiscoveryClient` 接口，可以获取服务信息：

```java
@Autowired
private DiscoveryClient discoveryClient;

// 获取所有服务名称
List<String> services = discoveryClient.getServices();

// 获取指定服务的所有实例
List<ServiceInstance> instances = discoveryClient.getInstances("service-provider");

// 获取服务实例信息
ServiceInstance instance = instances.get(0);
String host = instance.getHost();
int port = instance.getPort();
URI uri = instance.getUri();
```

## 配置详解

### 心跳配置

```yaml
eureka:
  instance:
    # 心跳间隔（秒）
    lease-renewal-interval-in-seconds: 30
    # 心跳超时时间（秒）
    lease-expiration-duration-in-seconds: 90
  client:
    # 获取服务列表的间隔（秒）
    registry-fetch-interval-seconds: 30
```

### 健康检查

```yaml
eureka:
  client:
    healthcheck:
      enabled: true  # 启用健康检查
```

需要在 `pom.xml` 中添加健康检查依赖：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

## 常见问题

### 1. 服务无法注册到 Eureka

**检查**：
- Eureka Server 是否启动
- `defaultZone` 配置是否正确
- 网络是否连通

### 2. 服务调用失败

**检查**：
- 服务是否已注册
- RestTemplate 是否添加了 `@LoadBalanced`
- 服务名是否正确

### 3. 负载均衡不生效

**检查**：
- 是否有多个服务实例
- `@LoadBalanced` 注解是否正确添加
- 是否添加了 `spring-cloud-starter-loadbalancer` 依赖

## 下一步

服务注册与发现是微服务架构的基础。接下来我们将学习配置中心，实现配置的集中管理。

---

| ⬅️ 上一章 | 🏠 目录 | 下一章 ➡️ |
|:----------|:------:|----------:|
| [Eureka 服务注册中心](./01-Eureka-服务注册中心.md) | [返回目录](../../../) | [Spring Cloud Config](../04-配置中心/01-Spring-Cloud-Config.md) |

