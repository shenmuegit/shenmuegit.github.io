# 🔄 Java 多线程与同步

<p align="center">
  <img src="https://img.shields.io/badge/难度-入门~高级-blue" alt="难度">
  <img src="https://img.shields.io/badge/总时长-3小时-green" alt="总时长">
  <img src="https://img.shields.io/badge/文章数-1篇-orange" alt="文章数">
  <img src="https://img.shields.io/badge/Java-8~21-red" alt="Java版本">
</p>

欢迎来到 Java 多线程与同步系列！本系列将从多线程基础概念开始，深入探讨 CPU 缓存系统、伪共享问题、原子操作、CAS 机制、Lock-free 编程、内存屏障等核心概念，帮助开发者全面理解 Java 多线程编程的底层原理。

---

## 📚 文章目录

| 序号 | 标题 | 核心内容 | 时长 |
|:----:|------|----------|:----:|
| 1 | [一文讲清楚Java多线程与同步](./docs/01-一文讲清楚Java多线程与同步.md) | 多线程基础、CPU缓存、伪共享、原子操作、CAS、Lock-free、内存屏障 | 3小时 |

---

## 📋 前置要求

- 🔧 **Java 基础**：具备 Java 编程基础，了解基本的多线程概念
- 📚 **开发经验**：有一定的并发编程经验更佳
- 🧠 **阅读兴趣**：对 JVM 底层原理和 CPU 架构有探索兴趣

---

## 🛠️ 涵盖内容

**多线程基础**
- 逻辑线程 vs 硬件线程
- 执行流、线程生命周期
- 线程、核心、函数的关系

**CPU 缓存系统**
- 多级缓存结构
- Cache Line（缓存行）
- MESI 协议与缓存一致性

**伪共享问题**
- 伪共享的定义与原因
- 性能影响分析
- 解决方案（Padding、@Contended、数据分离）

**原子操作与 CAS**
- 原子操作概念
- CAS（Compare-And-Swap）机制
- JVM 实现与 CPU 指令级分析
- ABA 问题与解决方案

**Lock-free 编程**
- Lock-free 概念与优势
- Lock-free 数据结构实现
- 性能分析与适用场景

**内存屏障与指令重排序**
- 指令重排序原理
- 内存屏障类型与作用
- volatile、synchronized、final 的内存屏障语义
- JVM 实现与 CPU 指令级分析

**同步原语实践**
- synchronized、ReentrantLock、volatile、Atomic 类对比
- 高性能计数器实现
- 无锁数据结构实践

---

## 🚀 快速开始

<p align="center">
  <a href="./docs/01-一文讲清楚Java多线程与同步.md">
    <strong>📖 开始阅读：一文讲清楚Java多线程与同步 →</strong>
  </a>
</p>

---

<p align="center">
  <a href="../">⬅️ 返回博客主站</a>
</p>

