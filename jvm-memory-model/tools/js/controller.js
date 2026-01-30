// 交互控制与事件处理

class VisualizationController {
    constructor() {
        this.memoryModel = null;
        this.currentGC = null;
        this.visualizer = null;
        this.selectedObjectId = null;
        this.gcTypeMap = {
            'serial': SerialGC,
            'parallel': ParallelGC,
            'cms': CMSGC,
            'g1': G1GC,
            'zgc': ZGC,
            'shenandoah': ShenandoahGC
        };
    }
    
    // 初始化所有组件
    initialize() {
        const canvas = document.getElementById('memory-canvas');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }
        
        canvas.width = 800;
        canvas.height = 700;
        
        this.memoryModel = new MemoryModel();
        this.visualizer = new MemoryVisualizer(canvas);
        
        // 绑定事件监听器
        document.getElementById('allocate-btn').addEventListener('click', () => this.handleAllocate());
        document.getElementById('create-refs-btn').addEventListener('click', () => this.handleCreateRefs());
        document.getElementById('gc-btn').addEventListener('click', () => this.handleGC());
        document.getElementById('next-step-btn').addEventListener('click', () => this.handleNextStep());
        document.getElementById('reset-btn').addEventListener('click', () => this.handleReset());
        document.getElementById('gc-selector').addEventListener('change', (e) => this.handleGCTypeChange(e.target.value));
        
        // 初始化默认 GC 类型
        const defaultGCType = document.getElementById('gc-selector').value;
        this.handleGCTypeChange(defaultGCType);
        
        // 初始渲染
        this.render();
    }
    
    // 处理对象分配请求
    async handleAllocate() {
        const countInput = document.getElementById('object-count-input');
        const count = parseInt(countInput.value) || 1;
        
        const threadId = 'main'; // 简化处理，使用主线程
        
        for (let i = 0; i < count; i++) {
            const obj = this.memoryModel.allocateObject('Object', 64, threadId);
            
            // 飞入动画（简化处理）
            await delay(100);
            this.render();
        }
        
        this.updateStats();
        this.updateInfoPanel('已分配 ' + count + ' 个对象到 Eden 区');
    }
    
    // 处理引用创建请求
    handleCreateRefs() {
        const outDegreeInput = document.getElementById('out-degree-input');
        const maxEdgesInput = document.getElementById('max-edges-input');
        const k = parseFloat(outDegreeInput.value) || 1;
        const maxEdges = parseInt(maxEdgesInput.value) || 200;
        
        const allObjects = this.memoryModel.getAllObjects();
        const N = allObjects.length;
        const totalEdges = Math.min(Math.floor(N * k), maxEdges);
        
        // 随机创建引用
        let created = 0;
        let attempts = 0;
        const maxAttempts = totalEdges * 10; // 防止无限循环
        
        while (created < totalEdges && allObjects.length > 1 && attempts < maxAttempts) {
            attempts++;
            const fromIndex = Math.floor(Math.random() * allObjects.length);
            const toIndex = Math.floor(Math.random() * allObjects.length);
            
            if (fromIndex !== toIndex) {
                const fromObj = allObjects[fromIndex];
                const toObj = allObjects[toIndex];
                
                if (!fromObj.references || !fromObj.references.includes(toObj.id)) {
                    this.memoryModel.createReference(fromObj.id, toObj.id);
                    created++;
                }
            }
        }
        
        this.render();
        this.updateStats();
        this.updateInfoPanel('已创建 ' + created + ' 条引用关系');
    }
    
    // 处理 GC 执行请求
    handleGC() {
        if (!this.currentGC) {
            this.updateInfoPanel('请先选择 GC 类型');
            return;
        }
        
        if (this.currentGC instanceof SerialGC || this.currentGC instanceof ParallelGC) {
            // 判断是 Minor GC 还是 Major GC
            const heap = this.memoryModel.heap;
            if (heap.eden.length > 0 || heap.survivor0.length > 0 || heap.survivor1.length > 0) {
                if (this.currentGC instanceof SerialGC) {
                    this.currentGC.executeMinorGC();
                } else {
                    this.currentGC.executeMinorGC();
                }
            } else if (heap.old.length > 0) {
                if (this.currentGC instanceof SerialGC) {
                    this.currentGC.executeMajorGC();
                } else {
                    this.currentGC.executeMajorGC();
                }
            }
        } else if (this.currentGC instanceof CMSGC) {
            this.currentGC.executeCMS();
        } else if (this.currentGC instanceof G1GC) {
            this.currentGC.executeYoungGC();
        } else if (this.currentGC instanceof ZGC) {
            this.currentGC.executeZGC();
        } else if (this.currentGC instanceof ShenandoahGC) {
            this.currentGC.executeShenandoah();
        }
        
        this.updateInfoPanel('GC 已启动，点击"下一步"执行各个阶段');
    }
    
    // 处理下一步操作
    async handleNextStep() {
        if (!this.currentGC || !this.currentGC.isRunning) {
            this.updateInfoPanel('请先执行 GC');
            return;
        }
        
        const hasMore = this.currentGC.executeStep();
        
        // 慢速展示
        await delay(800);
        
        this.render();
        this.updateStats();
        
        if (hasMore) {
            const phaseNames = {
                'marking': '标记阶段',
                'copying': '复制阶段',
                'compacting': '整理阶段',
                'sweeping': '清除阶段'
            };
            this.updateInfoPanel('当前阶段: ' + (phaseNames[this.currentGC.currentPhase] || this.currentGC.currentPhase));
        } else {
            this.updateInfoPanel('GC 执行完成');
        }
    }
    
    // 处理重置请求
    handleReset() {
        this.memoryModel.reset();
        if (this.currentGC) {
            this.currentGC.reset();
        }
        this.selectedObjectId = null;
        this.render();
        this.updateStats();
        this.updateInfoPanel('已重置所有状态');
    }
    
    // 处理 GC 类型切换
    handleGCTypeChange(gcType) {
        const GCClass = this.gcTypeMap[gcType];
        if (GCClass) {
            this.currentGC = new GCClass(this.memoryModel);
            this.updateInfoPanel('已切换到 ' + gcType.toUpperCase() + ' GC');
        }
    }
    
    // 更新说明栏
    updateInfoPanel(description) {
        const descElement = document.getElementById('step-description');
        if (descElement) {
            descElement.textContent = description;
        }
    }
    
    // 更新统计信息
    updateStats() {
        const statsElement = document.getElementById('stats-display');
        if (!statsElement) return;
        
        const heap = this.memoryModel.heap;
        const allObjects = this.memoryModel.getAllObjects();
        const reachableSet = this.memoryModel.getReachableObjects();
        
        const stats = {
            totalObjects: allObjects.length,
            edenObjects: heap.eden.length,
            survivor0Objects: heap.survivor0.length,
            survivor1Objects: heap.survivor1.length,
            oldObjects: heap.old.length,
            reachableObjects: reachableSet.size,
            unreachableObjects: allObjects.length - reachableSet.size,
            gcRoots: this.memoryModel.getGCRoots().length
        };
        
        statsElement.innerHTML = `
            <div>总对象数: ${stats.totalObjects}</div>
            <div>Eden: ${stats.edenObjects} | Survivor0: ${stats.survivor0Objects} | Survivor1: ${stats.survivor1Objects} | Old: ${stats.oldObjects}</div>
            <div>可达对象: ${stats.reachableObjects} | 不可达对象: ${stats.unreachableObjects}</div>
            <div>GC Roots: ${stats.gcRoots}</div>
        `;
    }
    
    // 渲染场景
    render() {
        if (this.visualizer && this.memoryModel) {
            this.visualizer.render(this.memoryModel, this.currentGC, this.selectedObjectId);
        }
    }
}

