# 🧠 JVM 内存模型

<p align="center">
  <img src="https://img.shields.io/badge/难度-入门~进阶-blue" alt="难度">
  <img src="https://img.shields.io/badge/总时长-2小时-green" alt="总时长">
  <img src="https://img.shields.io/badge/文章数-1篇-orange" alt="文章数">
  <img src="https://img.shields.io/badge/JDK-21-red" alt="JDK版本">
</p>

欢迎来到 JVM 内存模型系列！本系列将深入介绍 JDK 21 的 JVM 内存模型，从内存区域划分到对象布局，从垃圾回收机制到 Java 内存模型（JMM），帮助初学者全面理解 Java 程序的内存管理机制。

---

## 📚 文章目录

| 序号 | 标题 | 核心内容 | 时长 |
|:----:|------|----------|:----:|
| 1 | [JDK 21 内存模型全面解析](./docs/01-JDK21内存模型全面解析.md) | JVM 内存区域、对象布局、GC、JMM | 2小时 |

---

## 📋 前置要求

- 🔧 **Java 基础**：具备 Java 编程基础
- 📚 **开发经验**：有一定的项目开发经验更佳
- 🧠 **阅读兴趣**：对 JVM 底层原理有探索兴趣

---

## 🛠️ 涵盖内容

**内存区域**
- 堆（Heap）、栈（Stack）、方法区（Method Area）
- 元空间（Metaspace）、程序计数器（PC Register）
- 直接内存（Direct Memory）

**对象内存**
- 对象头（Object Header）
- 实例数据（Instance Data）
- 对齐填充（Padding）

**垃圾回收**
- 分代收集理论
- 标记-清除、标记-复制、标记-整理
- G1、ZGC、Shenandoah 等收集器

**Java 内存模型（JMM）**
- 主内存与工作内存
- happens-before 关系
- volatile、synchronized 语义

**JDK 21 新特性**
- 分代 ZGC
- 虚拟线程对内存的影响
- 其他内存相关改进

---

## 🚀 快速开始

<p align="center">
  <a href="./docs/01-JDK21内存模型全面解析.md">
    <strong>📖 开始阅读：JDK 21 内存模型全面解析 →</strong>
  </a>
</p>

---

<p align="center">
  <a href="../">⬅️ 返回博客主站</a>
</p>

