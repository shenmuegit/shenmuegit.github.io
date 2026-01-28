---
layout: default
title: MyBatis 源码教程
nav_order: 2
has_children: true
permalink: /docs/mybatis-source/
---

# MyBatis 源码深度解析

欢迎来到 MyBatis 源码深度解析教程！本教程将带你深入 MyBatis 源码，从项目启动到 SQL 执行，逐层剖析其内部实现原理。

## 📊 教程概览

| 指标 | 数值 |
|------|------|
| 总文章数 | 5 篇 |
| 预计总时长 | 3 小时 |
| 难度 | 🔴 高级 |
| MyBatis 版本 | 3.5.x |

## 📚 章节列表

### 🏗️ 架构与启动
- [全局架构概览](./01-全局架构概览/) - 整体架构、核心模块、设计思想
- [配置解析与启动](./02-配置解析与启动/) - XMLConfigBuilder、Configuration

### 🔧 核心机制
- [Mapper 代理机制](./03-Mapper代理机制/) - MapperProxy、JDK 动态代理
- [SQL 执行流程](./04-SQL执行流程/) - Executor、StatementHandler

### 📦 结果处理
- [结果集映射](./05-结果集映射/) - ResultSetHandler、TypeHandler

## 📖 阅读建议

每篇文章采用**三层结构**：

| 层次 | 内容 | 适合人群 |
|:----:|------|---------|
| **第一层** | 宏观架构、流程图 | 快速了解整体流程 |
| **第二层** | 模块职责、接口定义 | 理解各组件作用 |
| **第三层** | 源码分析、设计模式 | 深入理解实现细节 |

## 🚀 开始学习

👉 [**开始第一篇：全局架构概览**](./01-全局架构概览/01-MyBatis全局架构.md)

