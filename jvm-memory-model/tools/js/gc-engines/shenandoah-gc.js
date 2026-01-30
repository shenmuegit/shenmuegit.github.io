// Shenandoah GC 实现

class ShenandoahGC extends BaseGC {
    constructor(memoryModel) {
        super(memoryModel);
        this.markedObjects = new Set();
        this.currentStepIndex = 0;
        this.gcSteps = [];
        this.connectionMatrix = new Map(); // Region ID -> Set of referenced Region IDs
        this.regions = [];
    }
    
    // 执行 Shenandoah GC
    executeShenandoah() {
        this.isRunning = true;
        this.markedObjects.clear();
        this.currentStepIndex = 0;
        this.gcSteps = ['initial-mark', 'concurrent-mark', 'final-mark', 'concurrent-evacuation', 'concurrent-update-refs'];
        this.onPhaseChanged('marking');
    }
    
    // 初始标记
    initialMark() {
        const gcRoots = this.memoryModel.getGCRoots();
        const allObjects = this.memoryModel.getAllObjects();
        
        gcRoots.forEach(rootId => {
            const rootObj = allObjects.find(o => o.id === rootId);
            if (rootObj) {
                this.markedObjects.add(rootObj.id);
            }
        });
    }
    
    // 并发标记
    concurrentMark() {
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
        Array.from(this.markedObjects).forEach(objId => {
            const obj = allObjects.find(o => o.id === objId);
            if (obj) {
                markReachable.call(this, obj, visited);
            }
        });
    }
    
    // 最终标记
    finalMark() {
        // 完成标记
        this.concurrentMark();
    }
    
    // 更新连接矩阵
    updateConnectionMatrix() {
        this.connectionMatrix.clear();
        const allObjects = this.memoryModel.getAllObjects();
        
        allObjects.forEach(obj => {
            if (obj.references && obj.references.length > 0) {
                const fromRegion = this.getObjectRegion(obj.id);
                if (fromRegion !== null) {
                    if (!this.connectionMatrix.has(fromRegion)) {
                        this.connectionMatrix.set(fromRegion, new Set());
                    }
                    
                    obj.references.forEach(refId => {
                        const toRegion = this.getObjectRegion(refId);
                        if (toRegion !== null && toRegion !== fromRegion) {
                            this.connectionMatrix.get(fromRegion).add(toRegion);
                        }
                    });
                }
            }
        });
    }
    
    // 获取对象所在 Region（简化处理）
    getObjectRegion(objId) {
        const obj = this.memoryModel.allObjects.get(objId);
        if (!obj) return null;
        
        const heap = this.memoryModel.heap;
        if (heap.eden.includes(obj)) return 'eden';
        if (heap.survivor0.includes(obj)) return 'survivor0';
        if (heap.survivor1.includes(obj)) return 'survivor1';
        if (heap.old.includes(obj)) return 'old';
        return null;
    }
    
    // 并发转移
    concurrentEvacuation() {
        const heap = this.memoryModel.heap;
        const oldObjects = [...heap.old];
        const toEvacuate = oldObjects.filter(obj => this.markedObjects.has(obj.id));
        
        // 并发转移存活对象（简化处理）
        toEvacuate.forEach(obj => {
            // 实际 Shenandoah 会并发移动对象
            // 这里简化处理，只更新位置信息
        });
    }
    
    // 并发更新引用
    concurrentUpdateRefs() {
        // 更新所有指向已移动对象的引用
        const allObjects = this.memoryModel.getAllObjects();
        
        allObjects.forEach(obj => {
            if (obj.references) {
                obj.references.forEach(refId => {
                    const targetObj = allObjects.find(o => o.id === refId);
                    if (targetObj && this.markedObjects.has(targetObj.id)) {
                        // 更新引用（简化处理）
                    }
                });
            }
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
                this.initialMark();
                break;
            case 'concurrent-mark':
                this.onPhaseChanged('marking');
                this.concurrentMark();
                break;
            case 'final-mark':
                this.onPhaseChanged('marking');
                this.finalMark();
                break;
            case 'concurrent-evacuation':
                this.onPhaseChanged('copying');
                this.updateConnectionMatrix();
                this.concurrentEvacuation();
                break;
            case 'concurrent-update-refs':
                this.onPhaseChanged('compacting');
                this.concurrentUpdateRefs();
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
        this.initialMark();
        this.concurrentMark();
    }
    
    copy() {
        this.concurrentEvacuation();
    }
    
    compact() {
        this.concurrentUpdateRefs();
    }
}
