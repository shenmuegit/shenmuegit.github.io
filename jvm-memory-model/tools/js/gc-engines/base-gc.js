// GC 基类

class BaseGC {
    constructor(memoryModel) {
        this.memoryModel = memoryModel;
        this.currentPhase = 'idle'; // idle, marking, sweeping, copying, compacting
        this.isRunning = false;
        this.phaseCallbacks = [];
    }
    
    // 标记阶段（抽象方法，子类实现）
    mark() {
        throw new Error('mark() method must be implemented by subclass');
    }
    
    // 清除阶段（抽象方法，子类实现）
    sweep() {
        throw new Error('sweep() method must be implemented by subclass');
    }
    
    // 复制阶段（抽象方法，子类实现）
    copy() {
        throw new Error('copy() method must be implemented by subclass');
    }
    
    // 整理阶段（抽象方法，子类实现）
    compact() {
        throw new Error('compact() method must be implemented by subclass');
    }
    
    // 执行单步操作（抽象方法，子类实现）
    executeStep() {
        throw new Error('executeStep() method must be implemented by subclass');
    }
    
    // 重置 GC 状态
    reset() {
        this.currentPhase = 'idle';
        this.isRunning = false;
    }
    
    // 触发阶段变化事件
    onPhaseChanged(phase) {
        this.currentPhase = phase;
        this.phaseCallbacks.forEach(callback => callback(phase));
    }
    
    // 注册阶段变化回调
    addPhaseCallback(callback) {
        this.phaseCallbacks.push(callback);
    }
    
    // 触发 GC 完成事件
    onGCCompleted() {
        this.isRunning = false;
        this.currentPhase = 'idle';
    }
}
