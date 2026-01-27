---
layout: default
title: Eureka 服务注册中心
parent: 服务注册与发现
grand_parent: Spring Cloud 教程
nav_order: 1
---

# Eureka 服务注册中心

> 📊 **难度**：🟡 进阶 | ⏱️ **阅读时间**：30 分钟
> 
> 📝 **本章摘要**：学习 Eureka 服务注册中心的原理，创建和配置 Eureka Server，理解服务注册流程。

## 🎯 学习目标

学完本章后，你将能够：
- 理解服务注册与发现的原理
- 创建 Eureka Server
- 配置 Eureka Server（单机/集群）
- 访问 Eureka Dashboard
- 理解自我保护机制

---

## Eureka 简介

Eureka 是 Netflix 开源的服务注册与发现组件，Spring Cloud 将其集成到自己的生态系统中。Eureka 采用 C-S 架构设计，分为 Eureka Server 和 Eureka Client。

- **Eureka Server**：服务注册中心，提供服务注册和发现功能
- **Eureka Client**：服务提供者和消费者，向 Eureka Server 注册自己，并从 Eureka Server 获取其他服务的信息

## 创建 Eureka Server

### 1. 添加依赖

在 `eureka-server` 模块的 `pom.xml` 中添加依赖：

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
</dependencies>
```

### 2. 创建主类

创建 `EurekaServerApplication.java`：

```java
package com.example.eureka;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

@SpringBootApplication
@EnableEurekaServer  // 启用 Eureka Server
public class EurekaServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
    }
}
```

关键注解说明：
- `@EnableEurekaServer`：启用 Eureka Server 功能

### 3. 配置 application.yml

在 `src/main/resources/application.yml` 中配置：

```yaml
server:
  port: 8761  # Eureka Server 默认端口

spring:
  application:
    name: eureka-server

eureka:
  instance:
    hostname: localhost
  client:
    # 不向自己注册
    register-with-eureka: false
    # 不从自己获取服务注册信息
    fetch-registry: false
    service-url:
      # Eureka Server 的地址
      defaultZone: http://${eureka.instance.hostname}:${server.port}/eureka/
```

配置说明：
- `register-with-eureka: false`：Eureka Server 不需要向自己注册
- `fetch-registry: false`：Eureka Server 不需要从注册中心获取服务列表
- `defaultZone`：Eureka Server 的访问地址

### 4. 启动 Eureka Server

在项目根目录执行：

```bash
cd eureka-server
mvn spring-boot:run
```

或者在 IDE 中直接运行 `EurekaServerApplication` 的 main 方法。

### 5. 访问 Eureka Dashboard

启动成功后，访问 http://localhost:8761，可以看到 Eureka 的管理界面。

## 配置详解

### 单机模式配置

单机模式的完整配置：

```yaml
server:
  port: 8761

spring:
  application:
    name: eureka-server

eureka:
  instance:
    hostname: localhost
  client:
    register-with-eureka: false
    fetch-registry: false
    service-url:
      defaultZone: http://${eureka.instance.hostname}:${server.port}/eureka/
  server:
    # 关闭自我保护机制（开发环境）
    enable-self-preservation: false
    # 清理间隔（单位：毫秒）
    eviction-interval-timer-in-ms: 5000
```

### 集群模式配置

Eureka Server 支持集群部署，提高可用性。集群配置示例：

**eureka-server-1 的配置**：

```yaml
server:
  port: 8761

spring:
  application:
    name: eureka-server

eureka:
  instance:
    hostname: eureka-server-1
  client:
    service-url:
      # 向其他 Eureka Server 注册
      defaultZone: http://eureka-server-2:8762/eureka/,http://eureka-server-3:8763/eureka/
```

**eureka-server-2 的配置**：

```yaml
server:
  port: 8762

spring:
  application:
    name: eureka-server

eureka:
  instance:
    hostname: eureka-server-2
  client:
    service-url:
      defaultZone: http://eureka-server-1:8761/eureka/,http://eureka-server-3:8763/eureka/
```

## 服务注册流程

1. **服务启动**：Eureka Client 启动时，向 Eureka Server 发送注册请求
2. **服务注册**：Eureka Server 将服务信息存储到注册表中
3. **心跳检测**：Eureka Client 定期向 Eureka Server 发送心跳，证明自己还活着
4. **服务发现**：其他服务从 Eureka Server 获取服务列表
5. **服务下线**：服务关闭时，Eureka Client 向 Eureka Server 发送下线请求

## Eureka Server 自我保护机制

Eureka Server 有一个自我保护机制，当短时间内丢失大量服务实例时，Eureka Server 会进入自我保护模式，不会删除这些服务实例。

### 自我保护机制的作用

- 防止网络分区故障导致服务被误删
- 提高系统的可用性

### 关闭自我保护（开发环境）

```yaml
eureka:
  server:
    enable-self-preservation: false
```

**注意**：生产环境建议开启自我保护机制。

## 常见问题

### 1. 无法访问 Eureka Dashboard

**检查**：
- 端口是否被占用
- 防火墙是否阻止访问
- 配置中的 `hostname` 是否正确

### 2. 服务注册失败

**检查**：
- Eureka Client 的配置是否正确
- `defaultZone` 地址是否正确
- 网络是否连通

### 3. 服务频繁上下线

**原因**：
- 心跳间隔设置过短
- 网络不稳定

**解决**：调整心跳间隔和超时时间。

## 下一步

Eureka Server 创建完成后，我们需要创建服务提供者和消费者，让它们注册到 Eureka Server。

---

<div align="center">

⬅️ [上一章：项目初始化](../02-环境搭建/02-项目初始化.md) | 🏠 [返回目录](../../../README.md) | [下一章：Eureka 服务提供者与消费者](./02-Eureka-服务提供者与消费者.md) ➡️

</div>

