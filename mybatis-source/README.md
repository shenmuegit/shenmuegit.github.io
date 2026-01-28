# 🔍 MyBatis 源码深度解析

<p align="center">
  <img src="https://img.shields.io/badge/难度-高级-red" alt="难度">
  <img src="https://img.shields.io/badge/总时长-3小时-green" alt="总时长">
  <img src="https://img.shields.io/badge/文章数-5篇-orange" alt="文章数">
  <img src="https://img.shields.io/badge/MyBatis-3.5.x-blue" alt="MyBatis">
</p>

欢迎来到 MyBatis 源码深度解析系列！本系列将带你深入 MyBatis 源码，从项目启动到 SQL 执行，逐层剖析其内部实现原理。

---

## 📍 学习路线图

| 阶段 | 主题 | 时长 | 核心内容 |
|:----:|------|:----:|---------|
| 1️⃣ | **全局架构概览** | 25 min | 整体架构、核心模块 |
| ➡️ | | | |
| 2️⃣ | **配置解析与启动** | 40 min | XMLConfigBuilder、Configuration |
| ➡️ | | | |
| 3️⃣ | **Mapper 代理机制** | 35 min | MapperProxy、动态代理 |
| ➡️ | | | |
| 4️⃣ | **SQL 执行流程** | 45 min | Executor、StatementHandler |
| ➡️ | | | |
| 5️⃣ | **结果集映射** | 35 min | ResultSetHandler、TypeHandler |

---

## 📚 文章目录

| 序号 | 文章 | 核心内容 | 时长 |
|:----:|------|---------|:----:|
| 1 | [全局架构概览](./docs/01-全局架构概览/01-MyBatis全局架构.md) | 整体架构、核心模块、设计思想 | 25 分钟 |
| 2 | [配置解析与启动](./docs/02-配置解析与启动/01-配置解析与启动.md) | XMLConfigBuilder、Configuration、SqlSessionFactory | 40 分钟 |
| 3 | [Mapper 代理机制](./docs/03-Mapper代理机制/01-Mapper代理机制.md) | MapperProxy、MapperMethod、JDK 动态代理 | 35 分钟 |
| 4 | [SQL 执行流程](./docs/04-SQL执行流程/01-SQL执行流程.md) | Executor、StatementHandler、ParameterHandler | 45 分钟 |
| 5 | [结果集映射](./docs/05-结果集映射/01-结果集映射.md) | ResultSetHandler、TypeHandler、自动映射 | 35 分钟 |

---

## 🎯 系列目标

学完本系列后，你将能够：

- ✅ 掌握 MyBatis 的整体架构和核心组件
- ✅ 理解配置文件解析和 Configuration 对象构建过程
- ✅ 深入理解 Mapper 接口的动态代理实现
- ✅ 掌握 SQL 执行的完整流程和各组件协作
- ✅ 理解结果集到 Java 对象的映射机制

---

## 📋 前置要求

- ☕ **Java 基础**：熟悉 Java 反射、动态代理
- 🔧 **MyBatis 使用经验**：了解基本的 MyBatis 配置和使用
- 📖 **设计模式**：了解工厂模式、代理模式、建造者模式
- 🗄️ **JDBC 基础**：了解 JDBC 的基本使用

---

## 📖 阅读建议

### 分层阅读

每篇文章采用**三层结构**，你可以根据需求选择阅读深度：

| 层次 | 内容 | 适合人群 |
|:----:|------|---------|
| **第一层** | 宏观架构、流程图 | 快速了解整体流程 |
| **第二层** | 模块职责、接口定义 | 理解各组件作用 |
| **第三层** | 源码分析、设计模式 | 深入理解实现细节 |

### 推荐路线

1. **快速浏览**：只读第一层，建立整体认知（约 30 分钟）
2. **深入理解**：读第一、二层，掌握核心概念（约 1.5 小时）
3. **源码精读**：全部阅读，深入源码细节（约 3 小时）

---

## 🔗 核心类速查

| 模块 | 核心类 | 职责 |
|------|--------|------|
| **session** | `SqlSessionFactory`, `SqlSession` | 会话管理 |
| **binding** | `MapperProxy`, `MapperMethod` | Mapper 接口代理 |
| **builder** | `XMLConfigBuilder`, `XMLMapperBuilder` | 配置解析 |
| **executor** | `Executor`, `BaseExecutor` | SQL 执行 |
| **statement** | `StatementHandler` | Statement 处理 |
| **parameter** | `ParameterHandler` | 参数处理 |
| **resultset** | `ResultSetHandler` | 结果集处理 |
| **type** | `TypeHandler` | 类型转换 |

---

## 🚀 快速开始

<p align="center">
  <a href="./docs/01-全局架构概览/01-MyBatis全局架构.md">
    <strong>📖 开始阅读第一篇：全局架构概览 →</strong>
  </a>
</p>

---

<p align="center">
  <a href="../README.md">⬅️ 返回博客主站</a>
</p>

