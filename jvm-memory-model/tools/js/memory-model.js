// 内存模型核心逻辑

// Java 对象类
class JavaObject {
    constructor(id, type = 'Object', size = 64) {
        this.id = id;
        this.type = type;
        this.size = size;
        this.age = 0;
        this.location = 'eden'; // eden, survivor0, survivor1, old
        this.references = []; // 引用的对象 ID 数组
    }
    
    addReference(targetId) {
        if (!this.references.includes(targetId)) {
            this.references.push(targetId);
        }
    }
    
    removeReference(targetId) {
        const index = this.references.indexOf(targetId);
        if (index > -1) {
            this.references.splice(index, 1);
        }
    }
    
    getReferences() {
        return this.references;
    }
}

// 堆内存管理类
class HeapMemory {
    constructor() {
        this.eden = [];
        this.survivor0 = [];
        this.survivor1 = [];
        this.old = [];
        this.currentSurvivor = 0; // 0 或 1，表示当前使用的 Survivor
    }
    
    allocateInEden(obj) {
        obj.location = 'eden';
        this.eden.push(obj);
    }
    
    promoteToOld(obj) {
        // 从当前区域移除
        this.removeFromLocation(obj);
        obj.location = 'old';
        obj.age = 15; // 晋升年龄
        this.old.push(obj);
    }
    
    moveToSurvivor(obj) {
        this.removeFromLocation(obj);
        obj.age++;
        if (this.currentSurvivor === 0) {
            obj.location = 'survivor0';
            this.survivor0.push(obj);
        } else {
            obj.location = 'survivor1';
            this.survivor1.push(obj);
        }
    }
    
    removeFromLocation(obj) {
        if (obj.location === 'eden') {
            const index = this.eden.indexOf(obj);
            if (index > -1) this.eden.splice(index, 1);
        } else if (obj.location === 'survivor0') {
            const index = this.survivor0.indexOf(obj);
            if (index > -1) this.survivor0.splice(index, 1);
        } else if (obj.location === 'survivor1') {
            const index = this.survivor1.indexOf(obj);
            if (index > -1) this.survivor1.splice(index, 1);
        } else if (obj.location === 'old') {
            const index = this.old.indexOf(obj);
            if (index > -1) this.old.splice(index, 1);
        }
    }
    
    switchSurvivor() {
        this.currentSurvivor = this.currentSurvivor === 0 ? 1 : 0;
    }
    
    getAllObjects() {
        return [...this.eden, ...this.survivor0, ...this.survivor1, ...this.old];
    }
    
    clear() {
        this.eden = [];
        this.survivor0 = [];
        this.survivor1 = [];
        this.old = [];
    }
}

// 栈内存管理类
class StackMemory {
    constructor() {
        this.threads = [];
    }
    
    createThread(threadId) {
        const thread = {
            id: threadId,
            stackFrames: [],
            references: [] // 栈中引用的对象 ID
        };
        this.threads.push(thread);
        return thread;
    }
    
    addStackFrame(threadId, frame) {
        const thread = this.threads.find(t => t.id === threadId);
        if (thread) {
            thread.stackFrames.push(frame);
            if (frame.localVars) {
                frame.localVars.forEach(objId => {
                    if (!thread.references.includes(objId)) {
                        thread.references.push(objId);
                    }
                });
            }
        }
    }
    
    getThreadReferences() {
        const allRefs = [];
        this.threads.forEach(thread => {
            allRefs.push(...thread.references);
        });
        return allRefs;
    }
    
    clear() {
        this.threads = [];
    }
}

// 内存模型主类
class MemoryModel {
    constructor() {
        this.heap = new HeapMemory();
        this.stack = new StackMemory();
        this.metaspace = []; // 方法区对象（简化处理）
        this.gcRoots = []; // GC Roots 对象 ID 数组
        this.allObjects = new Map(); // 所有对象的映射表
        this.objectIdCounter = 0;
        // 创建默认线程
        this.stack.createThread('main');
    }
    
    allocateObject(type = 'Object', size = 64, threadId = null) {
        const id = 'obj_' + (++this.objectIdCounter);
        const obj = new JavaObject(id, type, size);
        this.allObjects.set(id, obj);
        this.heap.allocateInEden(obj);
        
        // 如果指定了线程，添加到线程引用（成为 GC Root）
        if (threadId) {
            const thread = this.stack.threads.find(t => t.id === threadId);
            if (thread) {
                thread.references.push(id);
                this.updateGCRoots();
            }
        }
        
        return obj;
    }
    
    createReference(fromId, toId) {
        const fromObj = this.allObjects.get(fromId);
        if (fromObj) {
            fromObj.addReference(toId);
        }
    }
    
    getGCRoots() {
        this.updateGCRoots();
        return this.gcRoots;
    }
    
    updateGCRoots() {
        this.gcRoots = this.stack.getThreadReferences();
        // 还可以添加静态变量引用等（简化处理）
    }
    
    getReachableObjects() {
        const allObjectsArray = Array.from(this.allObjects.values());
        const reachable = calculateReachability(this.gcRoots, allObjectsArray);
        return reachable;
    }
    
    getAllObjects() {
        return Array.from(this.allObjects.values());
    }
    
    reset() {
        this.heap.clear();
        this.stack.clear();
        this.metaspace = [];
        this.gcRoots = [];
        this.allObjects.clear();
        this.objectIdCounter = 0;
        // 重新创建默认线程
        this.stack.clear();
        this.stack.createThread('main');
    }
}
