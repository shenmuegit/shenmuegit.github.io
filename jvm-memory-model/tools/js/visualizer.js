// Canvas 渲染逻辑

// 颜色编码常量
const COLORS = {
    NORMAL: '#CCCCCC',      // 灰色：普通对象
    REACHABLE: '#4CAF50',   // 绿色：可达对象
    UNREACHABLE: '#F44336', // 红色：不可达对象
    MOVING: '#FFC107',      // 黄色：正在移动的对象
    GC_ROOT: '#2196F3',     // 蓝色：GC Roots
    EDEN: '#E3F2FD',
    SURVIVOR0: '#BBDEFB',
    SURVIVOR1: '#90CAF9',
    OLD: '#64B5F6',
    STACK: '#FFF9C4',
    METASPACE: '#F3E5F5'
};

class MemoryVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.selectedObjectId = null;
        this.animationQueue = [];
    }
    
    // 绘制堆内存区域
    drawHeap(heap, x, y, width, height) {
        const ctx = this.ctx;
        const edenHeight = height * 0.4;
        const survivorHeight = height * 0.2;
        const oldHeight = height * 0.4;
        
        // Eden 区
        ctx.fillStyle = COLORS.EDEN;
        ctx.fillRect(x, y, width, edenHeight);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, edenHeight);
        ctx.fillStyle = '#000';
        ctx.font = '14px Arial';
        ctx.fillText('Eden', x + 10, y + 20);
        ctx.fillText(`Objects: ${heap.eden.length}`, x + 10, y + 40);
        
        // Survivor 0
        ctx.fillStyle = COLORS.SURVIVOR0;
        ctx.fillRect(x, y + edenHeight, width / 2, survivorHeight);
        ctx.strokeRect(x, y + edenHeight, width / 2, survivorHeight);
        ctx.fillStyle = '#000';
        ctx.fillText('Survivor 0', x + 10, y + edenHeight + 20);
        ctx.fillText(`Objects: ${heap.survivor0.length}`, x + 10, y + edenHeight + 40);
        
        // Survivor 1
        ctx.fillStyle = COLORS.SURVIVOR1;
        ctx.fillRect(x + width / 2, y + edenHeight, width / 2, survivorHeight);
        ctx.strokeRect(x + width / 2, y + edenHeight, width / 2, survivorHeight);
        ctx.fillStyle = '#000';
        ctx.fillText('Survivor 1', x + width / 2 + 10, y + edenHeight + 20);
        ctx.fillText(`Objects: ${heap.survivor1.length}`, x + width / 2 + 10, y + edenHeight + 40);
        
        // Old 区
        ctx.fillStyle = COLORS.OLD;
        ctx.fillRect(x, y + edenHeight + survivorHeight, width, oldHeight);
        ctx.strokeRect(x, y + edenHeight + survivorHeight, width, oldHeight);
        ctx.fillStyle = '#000';
        ctx.fillText('Old Generation', x + 10, y + edenHeight + survivorHeight + 20);
        ctx.fillText(`Objects: ${heap.old.length}`, x + 10, y + edenHeight + survivorHeight + 40);
    }
    
    // 绘制栈内存区域
    drawStack(stack, x, y, width, height) {
        const ctx = this.ctx;
        const threadHeight = height / Math.max(stack.threads.length, 1);
        
        stack.threads.forEach((thread, index) => {
            const threadY = y + index * threadHeight;
            ctx.fillStyle = COLORS.STACK;
            ctx.fillRect(x, threadY, width, threadHeight);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, threadY, width, threadHeight);
            ctx.fillStyle = '#000';
            ctx.font = '12px Arial';
            ctx.fillText(`Thread ${thread.id}`, x + 10, threadY + 20);
            ctx.fillText(`Frames: ${thread.stackFrames.length}`, x + 10, threadY + 40);
        });
    }
    
    // 绘制对象
    drawObjects(objects, heap, reachableSet, gcRoots) {
        const ctx = this.ctx;
        const objectSize = 20;
        
        objects.forEach(obj => {
            let color = COLORS.NORMAL;
            if (gcRoots.includes(obj.id)) {
                color = COLORS.GC_ROOT;
            } else if (reachableSet.has(obj.id)) {
                color = COLORS.REACHABLE;
            } else {
                color = COLORS.UNREACHABLE;
            }
            
            if (this.selectedObjectId === obj.id) {
                ctx.strokeStyle = '#FF0000';
                ctx.lineWidth = 3;
            } else {
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
            }
            
            const pos = this.getObjectPosition(obj, heap);
            if (pos) {
                ctx.fillStyle = color;
                ctx.fillRect(pos.x, pos.y, objectSize, objectSize);
                ctx.strokeRect(pos.x, pos.y, objectSize, objectSize);
                
                // 显示对象 ID（简化）
                ctx.fillStyle = '#000';
                ctx.font = '10px Arial';
                ctx.fillText(obj.id.substring(4), pos.x + 2, pos.y + 15);
            }
        });
    }
    
    // 获取对象在 Canvas 上的位置
    getObjectPosition(obj, heap) {
        const heapX = 50;
        const heapY = 100;
        const heapWidth = 400;
        const heapHeight = 500;
        
        const edenHeight = heapHeight * 0.4;
        const survivorHeight = heapHeight * 0.2;
        const oldHeight = heapHeight * 0.4;
        
        let baseX, baseY, areaWidth, areaHeight;
        let index = -1;
        
        if (obj.location === 'eden') {
            baseX = heapX;
            baseY = heapY;
            areaWidth = heapWidth;
            areaHeight = edenHeight;
            index = heap.eden.indexOf(obj);
        } else if (obj.location === 'survivor0') {
            baseX = heapX;
            baseY = heapY + edenHeight;
            areaWidth = heapWidth / 2;
            areaHeight = survivorHeight;
            index = heap.survivor0.indexOf(obj);
        } else if (obj.location === 'survivor1') {
            baseX = heapX + heapWidth / 2;
            baseY = heapY + edenHeight;
            areaWidth = heapWidth / 2;
            areaHeight = survivorHeight;
            index = heap.survivor1.indexOf(obj);
        } else if (obj.location === 'old') {
            baseX = heapX;
            baseY = heapY + edenHeight + survivorHeight;
            areaWidth = heapWidth;
            areaHeight = oldHeight;
            index = heap.old.indexOf(obj);
        } else {
            return null;
        }
        
        if (index === -1) return null;
        
        const objectsPerRow = Math.floor(areaWidth / 25);
        const row = Math.floor(index / objectsPerRow);
        const col = index % objectsPerRow;
        
        return {
            x: baseX + col * 25 + 5,
            y: baseY + row * 25 + 50
        };
    }
    
    // 绘制引用连线
    drawReferences(objects, heap, gcRoots, selectedObjectId, maxEdges, allEdges) {
        const ctx = this.ctx;
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        
        let edgesToDraw = [];
        
        if (shouldDrawFullEdges(allEdges.length, maxEdges)) {
            edgesToDraw = allEdges;
        } else {
            edgesToDraw = getKeyEdges(objects, gcRoots, selectedObjectId, maxEdges);
        }
        
        edgesToDraw.forEach(edge => {
            const fromObj = objects.find(o => o.id === edge.from);
            const toObj = objects.find(o => o.id === edge.to);
            
            if (fromObj && toObj) {
                const fromPos = this.getObjectPosition(fromObj, heap);
                const toPos = this.getObjectPosition(toObj, heap);
                
                if (fromPos && toPos) {
                    ctx.beginPath();
                    ctx.moveTo(fromPos.x + 10, fromPos.y + 10);
                    ctx.lineTo(toPos.x + 10, toPos.y + 10);
                    ctx.stroke();
                }
            }
        });
    }
    
    // 绘制 GC Roots
    drawGCRoots(gcRoots) {
        const ctx = this.ctx;
        ctx.fillStyle = COLORS.GC_ROOT;
        ctx.font = 'bold 14px Arial';
        ctx.fillText('GC Roots:', 50, 50);
        
        gcRoots.forEach((rootId, index) => {
            ctx.fillText(rootId.substring(4), 150 + index * 60, 50);
        });
    }
    
    // 绘制当前 GC 阶段高亮
    drawGCPhase(phase, heap) {
        const ctx = this.ctx;
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 3;
        
        if (phase === 'marking') {
            // 高亮所有区域
            ctx.strokeRect(50, 100, 400, 500);
        } else if (phase === 'copying') {
            // 高亮 Survivor 区域
            ctx.strokeRect(50, 300, 200, 100);
        } else if (phase === 'compacting') {
            // 高亮 Old 区域
            ctx.strokeRect(50, 500, 400, 100);
        } else if (phase === 'sweeping') {
            // 高亮所有区域
            ctx.strokeRect(50, 100, 400, 500);
        }
    }
    
    // 对象飞入动画
    async animateObjectAllocation(obj, targetPos, threadStartPos) {
        return new Promise((resolve) => {
            const startX = threadStartPos.x;
            const startY = threadStartPos.y;
            const endX = targetPos.x;
            const endY = targetPos.y;
            const duration = 500;
            const startTime = performance.now();
            
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const currentX = startX + (endX - startX) * progress;
                const currentY = startY + (endY - startY) * progress;
                
                // 这里需要在动画过程中重绘
                // 实际实现中需要保存动画状态并在 render 中绘制
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    }
    
    // 对象移动动画
    async animateObjectMove(obj, fromPos, toPos) {
        return new Promise((resolve) => {
            const startX = fromPos.x;
            const startY = fromPos.y;
            const endX = toPos.x;
            const endY = toPos.y;
            const duration = 800;
            const startTime = performance.now();
            
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const currentX = startX + (endX - startX) * progress;
                const currentY = startY + (endY - startY) * progress;
                
                // 这里需要在动画过程中重绘
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    }
    
    // 更新对象颜色（根据可达性）
    updateColors(objects, reachableSet, gcRoots) {
        // 颜色更新在 drawObjects 中处理
    }
    
    // 渲染完整场景
    render(memoryModel, currentGC, selectedObjectId) {
        this.selectedObjectId = selectedObjectId;
        this.currentHeap = memoryModel.heap;
        
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);
        
        // 绘制堆内存
        this.drawHeap(memoryModel.heap, 50, 100, 400, 500);
        
        // 绘制栈内存
        this.drawStack(memoryModel.stack, 500, 100, 200, 300);
        
        // 计算可达性
        const reachableSet = memoryModel.getReachableObjects();
        const gcRoots = memoryModel.getGCRoots();
        
        // 绘制对象
        const allObjects = memoryModel.getAllObjects();
        this.drawObjects(allObjects, memoryModel.heap, reachableSet, gcRoots);
        
        // 绘制引用连线
        const allEdges = [];
        allObjects.forEach(obj => {
            if (obj.references) {
                obj.references.forEach(refId => {
                    allEdges.push({ from: obj.id, to: refId });
                });
            }
        });
        this.drawReferences(allObjects, memoryModel.heap, gcRoots, selectedObjectId, 200, allEdges);
        
        // 绘制 GC Roots
        this.drawGCRoots(gcRoots);
        
        // 绘制 GC 阶段高亮
        if (currentGC && currentGC.currentPhase !== 'idle') {
            this.drawGCPhase(currentGC.currentPhase, memoryModel.heap);
        }
    }
}

