---
layout: default
title: Spring Cloud Config
parent: 配置中心
grand_parent: Spring Cloud 教程
nav_order: 1
---

# Spring Cloud Config

> 📊 **难度**：🟡 进阶 | ⏱️ **阅读时间**：30 分钟
> 
> 📝 **本章摘要**：学习 Spring Cloud Config 配置中心，实现配置的集中管理、动态刷新和加密。

## 🎯 学习目标

学完本章后，你将能够：
- 创建 Config Server
- 配置 Git/本地存储
- 创建 Config Client
- 实现配置动态刷新
- 配置加密

---

## Config Server 简介

Spring Cloud Config 提供了集中化的外部配置管理，支持配置服务（Config Server）和配置客户端（Config Client）。

### 主要功能

- **集中管理配置**：所有服务的配置集中存储在配置服务器
- **环境隔离**：支持不同环境（dev、test、prod）的配置
- **动态刷新**：支持配置的动态刷新，无需重启服务
- **版本控制**：配置存储在 Git 仓库，支持版本管理
- **加密解密**：支持敏感信息的加密存储

## 创建 Config Server

### 1. 创建 Config Server 模块

在父项目中添加新模块 `config-server`。

### 2. 添加依赖

在 `config-server/pom.xml` 中添加依赖：

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-config-server</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
</dependencies>
```

### 3. 创建主类

创建 `ConfigServerApplication.java`：

```java
package com.example.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.config.server.EnableConfigServer;

@SpringBootApplication
@EnableConfigServer  // 启用 Config Server
public class ConfigServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConfigServerApplication.class, args);
    }
}
```

### 4. 配置 application.yml

#### 使用 Git 仓库存储配置

```yaml
server:
  port: 8888

spring:
  application:
    name: config-server
  cloud:
    config:
      server:
        git:
          # Git 仓库地址
          uri: https://github.com/your-username/config-repo.git
          # 分支
          default-label: main
          # 搜索路径（可选）
          search-paths: '{application}'
          # 用户名和密码（如果需要认证）
          username: your-username
          password: your-password
```

#### 使用本地文件系统存储配置

```yaml
server:
  port: 8888

spring:
  application:
    name: config-server
  profiles:
    active: native
  cloud:
    config:
      server:
        native:
          # 本地配置文件路径
          search-locations: classpath:/config
```

### 5. 创建配置文件仓库

如果使用 Git 仓库，需要创建一个 Git 仓库来存储配置文件。

**配置文件命名规则**：
- `{application}-{profile}.yml` 或 `{application}-{profile}.properties`
- `{application}.yml` 或 `{application}.properties`

例如：
- `service-provider-dev.yml`：service-provider 服务的开发环境配置
- `service-provider-prod.yml`：service-provider 服务的生产环境配置
- `service-provider.yml`：service-provider 服务的默认配置

**示例配置文件 `service-provider-dev.yml`**：

```yaml
server:
  port: 8081

spring:
  application:
    name: service-provider

eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/

# 自定义配置
custom:
  message: "Hello from Config Server (Dev)"
  version: "1.0.0-dev"
```

### 6. 启动 Config Server

```bash
cd config-server
mvn spring-boot:run
```

### 7. 访问配置

Config Server 提供了 REST API 来访问配置：

- `GET /{application}/{profile}[/{label}]`：获取指定应用的配置
- `GET /{application}-{profile}.yml`：以 YAML 格式获取配置
- `GET /{application}-{profile}.properties`：以 Properties 格式获取配置

例如：
- http://localhost:8888/service-provider/dev
- http://localhost:8888/service-provider-dev.yml

## 创建 Config Client

### 1. 添加依赖

在 `service-provider/pom.xml` 中添加依赖：

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-config-client</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

### 2. 配置 bootstrap.yml

创建 `bootstrap.yml` 文件（优先级高于 `application.yml`）：

```yaml
spring:
  application:
    name: service-provider  # 应用名称，对应配置文件中的 {application}
  cloud:
    config:
      uri: http://localhost:8888  # Config Server 地址
      profile: dev  # 环境，对应配置文件中的 {profile}
      label: main  # Git 分支，默认为 main
```

### 3. 使用配置

在代码中使用配置：

```java
package com.example.provider.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ConfigController {
    
    @Value("${custom.message}")
    private String message;
    
    @Value("${custom.version}")
    private String version;
    
    @GetMapping("/config")
    public String getConfig() {
        return "Message: " + message + ", Version: " + version;
    }
}
```

## 动态刷新配置

### 1. 启用刷新端点

在 `bootstrap.yml` 中配置：

```yaml
management:
  endpoints:
    web:
      exposure:
        include: refresh, health, info
```

### 2. 添加刷新注解

在需要刷新的 Bean 上添加 `@RefreshScope` 注解：

```java
package com.example.provider.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RefreshScope  // 启用配置刷新
public class ConfigController {
    
    @Value("${custom.message}")
    private String message;
    
    @GetMapping("/config")
    public String getConfig() {
        return "Message: " + message;
    }
}
```

### 3. 刷新配置

修改 Git 仓库中的配置文件，然后调用刷新端点：

```bash
curl -X POST http://localhost:8081/actuator/refresh
```

或者使用 Postman 发送 POST 请求到 `http://localhost:8081/actuator/refresh`。

## 配置加密

### 1. 安装 JCE

Spring Cloud Config 使用 JCE（Java Cryptography Extension）进行加密。需要下载并安装 JCE：

- 下载地址：https://www.oracle.com/java/technologies/javase-jce8-downloads.html
- 解压后替换 `$JAVA_HOME/jre/lib/security/` 目录下的文件

### 2. 配置加密密钥

在 `config-server/application.yml` 中配置：

```yaml
encrypt:
  key: my-secret-key  # 加密密钥
```

### 3. 加密配置值

使用 Config Server 的加密端点：

```bash
# 加密
curl http://localhost:8888/encrypt -d "my-secret-value"

# 返回加密后的值
# {cipher}xxxxxxxxxxxxxxxxxxxxx
```

### 4. 使用加密值

在配置文件中使用加密值：

```yaml
database:
  password: "{cipher}xxxxxxxxxxxxxxxxxxxxx"
```

Config Server 会自动解密。

## 多环境配置

### 配置文件组织

在 Git 仓库中按环境组织配置文件：

```
config-repo/
├── service-provider/
│   ├── application.yml          # 默认配置
│   ├── application-dev.yml      # 开发环境
│   ├── application-test.yml     # 测试环境
│   └── application-prod.yml     # 生产环境
└── service-consumer/
    ├── application.yml
    ├── application-dev.yml
    └── application-prod.yml
```

### 指定环境

在 `bootstrap.yml` 中指定环境：

```yaml
spring:
  cloud:
    config:
      profile: dev  # 开发环境
      # profile: test  # 测试环境
      # profile: prod  # 生产环境
```

或者使用启动参数：

```bash
mvn spring-boot:run -Dspring-boot.run.arguments=--spring.profiles.active=dev
```

## 高可用配置

### Config Server 集群

可以部署多个 Config Server 实例，提高可用性：

```yaml
# Config Server 1
server:
  port: 8888

# Config Server 2
server:
  port: 8889
```

### Config Client 配置多个 Server

```yaml
spring:
  cloud:
    config:
      uri: http://localhost:8888,http://localhost:8889
```

## 常见问题

### 1. 无法连接到 Config Server

**检查**：
- Config Server 是否启动
- `uri` 配置是否正确
- 网络是否连通

### 2. 配置不生效

**检查**：
- `bootstrap.yml` 配置是否正确
- 配置文件命名是否符合规则
- 是否添加了 `spring-cloud-config-client` 依赖

### 3. 刷新不生效

**检查**：
- 是否添加了 `@RefreshScope` 注解
- 是否启用了 `refresh` 端点
- 是否使用了 `@Value` 注解（`@ConfigurationProperties` 需要额外处理）

## 下一步

配置中心实现了配置的集中管理。接下来我们将学习 API 网关，实现统一的请求入口。

---

| ⬅️ 上一章 | 🏠 目录 | 下一章 ➡️ |
|:----------|:------:|----------:|
| [Eureka 服务提供者与消费者](../03-服务注册与发现/02-Eureka-服务提供者与消费者.md) | [返回目录](../../../) | [Spring Cloud Gateway](../05-服务网关/01-Spring-Cloud-Gateway.md) |

