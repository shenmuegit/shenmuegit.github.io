// Parallel GC 实现

class ParallelGC extends BaseGC {
    constructor(memoryModel) {
        super(memoryModel);
        this.markedObjects = new Set();
        this.currentStepIndex = 0;
        this.gcSteps = [];
        this.workerThreads = 4; // 模拟工作线程数
    }
    
    // Minor GC（新生代）
    executeMinorGC() {
        this.isRunning = true;
        this.markedObjects.clear();
        this.currentStepIndex = 0;
        this.gcSteps = ['initial-mark', 'parallel-mark', 'copy', 'sweep'];
        this.onPhaseChanged('marking');
    }
    
    // Major GC（老年代）
    executeMajorGC() {
        this.isRunning = true;
        this.markedObjects.clear();
        this.currentStepIndex = 0;
        this.gcSteps = ['initial-mark', 'parallel-mark', 'parallel-compact', 'sweep'];
        this.onPhaseChanged('marking');
    }
    
    // 并行标记
    parallelMark() {
        const gcRoots = this.memoryModel.getGCRoots();
        const allObjects = this.memoryModel.getAllObjects();
        
        // 将对象分区，模拟多线程并行标记
        const partitions = [];
        const partitionSize = Math.ceil(allObjects.length / this.workerThreads);
        for (let i = 0; i < allObjects.length; i += partitionSize) {
            partitions.push(allObjects.slice(i, i + partitionSize));
        }
        
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
        
        // 并行处理各个分区（模拟）
        partitions.forEach(partition => {
            partition.forEach(obj => {
                if (visited.has(obj.id)) {
                    this.markedObjects.add(obj.id);
                }
            });
        });
    }
    
    // 并行复制
    parallelCopy() {
        const heap = this.memoryModel.heap;
        const edenObjects = [...heap.eden];
        const survivorObjects = [...(heap.currentSurvivor === 0 ? heap.survivor0 : heap.survivor1)];
        const allSourceObjects = [...edenObjects, ...survivorObjects];
        
        const targetSurvivor = heap.currentSurvivor === 0 ? 1 : 0;
        heap.switchSurvivor();
        
        // 分区并行复制（模拟）
        const partitionSize = Math.ceil(allSourceObjects.length / this.workerThreads);
        for (let i = 0; i < allSourceObjects.length; i += partitionSize) {
            const partition = allSourceObjects.slice(i, i + partitionSize);
            partition.forEach(obj => {
                if (this.markedObjects.has(obj.id)) {
                    if (obj.age >= 15) {
                        heap.promoteToOld(obj);
                    } else {
                        heap.moveToSurvivor(obj);
                    }
                }
            });
        }
        
        heap.eden = [];
        if (targetSurvivor === 0) {
            heap.survivor0 = [];
        } else {
            heap.survivor1 = [];
        }
    }
    
    // 并行整理
    parallelCompact() {
        const heap = this.memoryModel.heap;
        const oldObjects = [...heap.old];
        const aliveObjects = oldObjects.filter(obj => this.markedObjects.has(obj.id));
        
        // 分区并行整理（模拟）
        const partitionSize = Math.ceil(aliveObjects.length / this.workerThreads);
        const compacted = [];
        for (let i = 0; i < aliveObjects.length; i += partitionSize) {
            const partition = aliveObjects.slice(i, i + partitionSize);
            compacted.push(...partition);
        }
        
        heap.old = compacted;
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
                this.parallelMark();
                break;
            case 'parallel-mark':
                this.onPhaseChanged('marking');
                break;
            case 'copy':
                this.onPhaseChanged('copying');
                this.parallelCopy();
                break;
            case 'parallel-compact':
                this.onPhaseChanged('compacting');
                this.parallelCompact();
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
        this.parallelMark();
    }
    
    sweep() {
        this.sweepPhase();
    }
    
    copy() {
        this.parallelCopy();
    }
    
    compact() {
        this.parallelCompact();
    }
}
