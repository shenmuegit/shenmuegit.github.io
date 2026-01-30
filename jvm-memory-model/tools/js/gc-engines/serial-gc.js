// Serial GC 实现

class SerialGC extends BaseGC {
    constructor(memoryModel) {
        super(memoryModel);
        this.markedObjects = new Set();
        this.currentStepIndex = 0;
        this.gcSteps = [];
    }
    
    // Minor GC（新生代）
    executeMinorGC() {
        this.isRunning = true;
        this.markedObjects.clear();
        this.currentStepIndex = 0;
        this.gcSteps = ['initial-mark', 'mark', 'copy', 'sweep'];
        this.onPhaseChanged('marking');
    }
    
    // Major GC（老年代）
    executeMajorGC() {
        this.isRunning = true;
        this.markedObjects.clear();
        this.currentStepIndex = 0;
        this.gcSteps = ['initial-mark', 'mark', 'compact', 'sweep'];
        this.onPhaseChanged('marking');
    }
    
    // 标记阶段
    markPhase() {
        const gcRoots = this.memoryModel.getGCRoots();
        const allObjects = this.memoryModel.getAllObjects();
        
        function markReachable(obj, visited) {
            if (visited.has(obj.id)) return;
            visited.add(obj.id);
            this.markedObjects.add(obj.id);
            
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
        gcRoots.forEach(rootId => {
            const rootObj = allObjects.find(o => o.id === rootId);
            if (rootObj) {
                markReachable.call(this, rootObj, visited);
            }
        });
    }
    
    // 复制阶段（用于新生代）
    copyPhase() {
        const heap = this.memoryModel.heap;
        const edenObjects = [...heap.eden];
        const survivorObjects = [...(heap.currentSurvivor === 0 ? heap.survivor0 : heap.survivor1)];
        const allSourceObjects = [...edenObjects, ...survivorObjects];
        
        const targetSurvivor = heap.currentSurvivor === 0 ? 1 : 0;
        heap.switchSurvivor();
        
        allSourceObjects.forEach(obj => {
            if (this.markedObjects.has(obj.id)) {
                if (obj.age >= 15) {
                    heap.promoteToOld(obj);
                } else {
                    heap.moveToSurvivor(obj);
                }
            }
        });
        
        heap.eden = [];
        if (targetSurvivor === 0) {
            heap.survivor0 = [];
        } else {
            heap.survivor1 = [];
        }
    }
    
    // 整理阶段（用于老年代）
    compactPhase() {
        const heap = this.memoryModel.heap;
        const oldObjects = [...heap.old];
        const aliveObjects = oldObjects.filter(obj => this.markedObjects.has(obj.id));
        
        heap.old = aliveObjects;
    }
    
    // 清除阶段
    sweepPhase() {
        const heap = this.memoryModel.heap;
        const allObjects = heap.getAllObjects();
        const toRemove = [];
        
        allObjects.forEach(obj => {
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
            return false;
        }
        
        const step = this.gcSteps[this.currentStepIndex];
        
        switch(step) {
            case 'initial-mark':
                this.onPhaseChanged('marking');
                this.markPhase();
                break;
            case 'mark':
                this.onPhaseChanged('marking');
                break;
            case 'copy':
                this.onPhaseChanged('copying');
                this.copyPhase();
                break;
            case 'compact':
                this.onPhaseChanged('compacting');
                this.compactPhase();
                break;
            case 'sweep':
                this.onPhaseChanged('sweeping');
                this.sweepPhase();
                break;
        }
        
        this.currentStepIndex++;
        
        if (this.currentStepIndex >= this.gcSteps.length) {
            this.onGCCompleted();
            return false;
        }
        
        return true;
    }
    
    mark() {
        this.markPhase();
    }
    
    sweep() {
        this.sweepPhase();
    }
    
    copy() {
        this.copyPhase();
    }
    
    compact() {
        this.compactPhase();
    }
}
