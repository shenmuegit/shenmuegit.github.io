# 🔭 可观测性实战

<p align="center">
  <img src="https://img.shields.io/badge/难度-🟡进阶-yellow" alt="难度">
  <img src="https://img.shields.io/badge/总时长-1.25小时-green" alt="总时长">
  <img src="https://img.shields.io/badge/文章数-3篇-orange" alt="文章数">
  <img src="https://img.shields.io/badge/OpenObserve-Latest-7C3AED" alt="OpenObserve">
  <img src="https://img.shields.io/badge/Vector-Latest-00ADD8" alt="Vector">
</p>

欢迎来到可观测性实战系列！本教程将带你在 Kubernetes 上部署 OpenObserve 和 Vector，构建完整的日志采集与分析平台。

---

## 📍 学习路线图

| 阶段 | OpenObserve 部署 | Vector 部署 | 集成排错 |
|:----:|:----------------:|:-----------:|:--------:|
| 时长 | 25 分钟 | 30 分钟 | 20 分钟 |
| 链接 | [开始学习](./docs/01-OpenObserve部署/01-架构设计与部署.md) | [开始学习](./docs/02-Vector部署/01-DaemonSet配置与部署.md) | [开始学习](./docs/03-集成排错/01-验证与排错指南.md) |

---

## 📚 文章目录

| 序号 | 文章 | 核心内容 | 时长 |
|:----:|------|---------|:----:|
| 1 | [架构设计与 OpenObserve 部署](./docs/01-OpenObserve部署/01-架构设计与部署.md) | 整体架构、Helm 部署、基础配置 | 25 分钟 |
| 2 | [Vector DaemonSet 配置与部署](./docs/02-Vector部署/01-DaemonSet配置与部署.md) | Helm 部署、配置详解、数据流验证 | 30 分钟 |
| 3 | [集成验证与排错指南](./docs/03-集成排错/01-验证与排错指南.md) | 端到端测试、FAQ、性能建议 | 20 分钟 |

---

## 🎯 学习目标

学完本系列后，你将能够：

- ✅ 理解 OpenObserve + Vector 的日志采集架构
- ✅ 在 Kubernetes 上部署 OpenObserve Standalone 模式
- ✅ 配置 Vector DaemonSet 采集节点日志
- ✅ 掌握 Vector 的 Sources、Transforms、Sinks 配置
- ✅ 排查常见的日志采集问题

---

## 🛠️ 技术栈

| 组件 | 用途 | 部署方式 |
|------|------|---------|
| **OpenObserve** | 日志存储与查询 | Helm (Standalone) |
| **Vector** | 日志采集与转发 | Helm (DaemonSet) |
| **MinIO** | 对象存储后端 | 外部服务（后续博客） |
| **Kubernetes** | 容器编排平台 | - |

---

## 📋 前置要求

- 🔧 **Kubernetes 集群**：可以是 Minikube、Kind、或生产集群
- ⎈ **Helm 3.x**：已安装并配置
- 🖥️ **kubectl**：已配置集群访问
- 📦 **存储**：节点上有日志文件（`/var/logs/`）

---

## 🚀 快速开始

<p align="center">
  <a href="./docs/01-OpenObserve部署/01-架构设计与部署.md">
    <strong>📖 开始第一篇：架构设计与 OpenObserve 部署 →</strong>
  </a>
</p>

---

<p align="center">
  <a href="../README.md">⬅️ 返回博客主站</a>
</p>

