// G1 GC 实现

class G1GC extends BaseGC {
    constructor(memoryModel) {
        super(memoryModel);
        this.markedObjects = new Set();
        this.currentStepIndex = 0;
        this.gcSteps = [];
        this.regions = [];
        this.regionSize = 0;
    }
    
    // 创建 Region
    createRegions(heapSize, regionSize = 1024) {
        this.regionSize = regionSize;
        this.regions = [];
        const numRegions = Math.floor(heapSize / regionSize);
        
        for (let i = 0; i < numRegions; i++) {
            this.regions.push({
                id: i,
                type: 'free', // free, eden, survivor, old, humongous
                objects: [],
                liveBytes: 0,
                garbageBytes: 0
            });
        }
    }
    
    // Young GC
    executeYoungGC() {
        this.isRunning = true;
        this.markedObjects.clear();
        this.currentStepIndex = 0;
        this.gcSteps = ['initial-mark', 'root-region-scan', 'concurrent-mark', 'remark', 'cleanup', 'copy'];
        this.onPhaseChanged('marking');
    }
    
    // Mixed GC
    executeMixedGC() {
        this.isRunning = true;
        this.markedObjects.clear();
        this.currentStepIndex = 0;
        this.gcSteps = ['initial-mark', 'concurrent-mark', 'remark', 'cleanup', 'evacuation'];
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
    
    // 清理阶段（计算 Region 回收价值）
    cleanup() {
        this.regions.forEach(region => {
            let liveBytes = 0;
            let garbageBytes = 0;
            
            region.objects.forEach(obj => {
                if (this.markedObjects.has(obj.id)) {
                    liveBytes += obj.size;
                } else {
                    garbageBytes += obj.size;
                }
            });
            
            region.liveBytes = liveBytes;
            region.garbageBytes = garbageBytes;
        });
    }
    
    // 选择要回收的 Region
    selectRegionsToCollect() {
        // 按垃圾比例排序，选择回收价值高的 Region
        return this.regions
            .filter(r => r.garbageBytes > 0)
            .sort((a, b) => (b.garbageBytes / (b.liveBytes + b.garbageBytes)) - (a.garbageBytes / (a.liveBytes + a.garbageBytes)))
            .slice(0, Math.min(8, this.regions.length)); // 最多选择 8 个 Region
    }
    
    // 复制/转移阶段
    evacuation() {
        const regionsToCollect = this.selectRegionsToCollect();
        const heap = this.memoryModel.heap;
        
        regionsToCollect.forEach(region => {
            const aliveObjects = region.objects.filter(obj => this.markedObjects.has(obj.id));
            
            aliveObjects.forEach(obj => {
                if (obj.age >= 15) {
                    heap.promoteToOld(obj);
                } else {
                    heap.moveToSurvivor(obj);
                }
            });
            
            // 移除死亡对象
            region.objects.filter(obj => !this.markedObjects.has(obj.id)).forEach(obj => {
                this.memoryModel.allObjects.delete(obj.id);
            });
            
            region.objects = [];
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
            case 'root-region-scan':
                this.onPhaseChanged('marking');
                break;
            case 'concurrent-mark':
                this.onPhaseChanged('marking');
                this.concurrentMark();
                break;
            case 'remark':
                this.onPhaseChanged('marking');
                this.concurrentMark();
                break;
            case 'cleanup':
                this.onPhaseChanged('sweeping');
                this.cleanup();
                break;
            case 'copy':
            case 'evacuation':
                this.onPhaseChanged('copying');
                this.evacuation();
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
    
    sweep() {
        this.cleanup();
    }
    
    copy() {
        this.evacuation();
    }
}
