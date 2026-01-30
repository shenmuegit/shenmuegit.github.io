// CMS GC 实现

class CMSGC extends BaseGC {
    constructor(memoryModel) {
        super(memoryModel);
        this.markedObjects = new Set();
        this.currentStepIndex = 0;
        this.gcSteps = [];
        this.concurrentPhase = false;
    }
    
    // 执行 CMS GC
    executeCMS() {
        this.isRunning = true;
        this.markedObjects.clear();
        this.currentStepIndex = 0;
        this.gcSteps = ['initial-mark', 'concurrent-mark', 'remark', 'concurrent-sweep'];
        this.onPhaseChanged('marking');
    }
    
    // 初始标记（STW）
    initialMark() {
        const gcRoots = this.memoryModel.getGCRoots();
        const allObjects = this.memoryModel.getAllObjects();
        
        // 只标记 GC Roots 直接引用的对象
        gcRoots.forEach(rootId => {
            const rootObj = allObjects.find(o => o.id === rootId);
            if (rootObj) {
                this.markedObjects.add(rootObj.id);
                if (rootObj.references) {
                    rootObj.references.forEach(refId => {
                        this.markedObjects.add(refId);
                    });
                }
            }
        });
    }
    
    // 并发标记（不停顿）
    concurrentMark() {
        this.concurrentPhase = true;
        const allObjects = this.memoryModel.getAllObjects();
        const marked = new Set(this.markedObjects);
        
        // 从已标记对象开始，标记所有可达对象
        function markReachable(obj, visited) {
            if (visited.has(obj.id)) return;
            visited.add(obj.id);
            marked.add(obj.id);
            
            if (obj.references) {
                obj.references.forEach(refId => {
                    const targetObj = allObjects.find(o => o.id === refId);
                    if (targetObj) {
                        markReachable.call(this, targetObj, visited);
                    }
                });
            }
        }
        
        const visited = new Set();
        Array.from(marked).forEach(objId => {
            const obj = allObjects.find(o => o.id === objId);
            if (obj) {
                markReachable.call(this, obj, visited);
            }
        });
        
        this.markedObjects = marked;
    }
    
    // 重新标记（STW）
    remark() {
        this.concurrentPhase = false;
        // 修正并发标记期间的变化
        this.concurrentMark();
    }
    
    // 并发清除（不停顿）
    concurrentSweep() {
        this.concurrentPhase = true;
        const heap = this.memoryModel.heap;
        const oldObjects = [...heap.old];
        const toRemove = [];
        
        oldObjects.forEach(obj => {
            if (!this.markedObjects.has(obj.id)) {
                toRemove.push(obj);
            }
        });
        
        toRemove.forEach(obj => {
            heap.removeFromLocation(obj);
            this.memoryModel.allObjects.delete(obj.id);
        });
    }
    
    // 执行单步操作
    executeStep() {
        if (!this.isRunning || this.currentStepIndex >= this.gcSteps.length) {
            this.onGCCompleted();
            this.concurrentPhase = false;
            return false;
        }
        
        const step = this.gcSteps[this.currentStepIndex];
        
        switch(step) {
            case 'initial-mark':
                this.onPhaseChanged('marking');
                this.concurrentPhase = false;
                this.initialMark();
                break;
            case 'concurrent-mark':
                this.onPhaseChanged('marking');
                this.concurrentMark();
                break;
            case 'remark':
                this.onPhaseChanged('marking');
                this.concurrentPhase = false;
                this.remark();
                break;
            case 'concurrent-sweep':
                this.onPhaseChanged('sweeping');
                this.concurrentSweep();
                break;
        }
        
        this.currentStepIndex++;
        
        if (this.currentStepIndex >= this.gcSteps.length) {
            this.onGCCompleted();
            this.concurrentPhase = false;
            return false;
        }
        
        return true;
    }
    
    mark() {
        this.initialMark();
        this.concurrentMark();
    }
    
    sweep() {
        this.concurrentSweep();
    }
}
