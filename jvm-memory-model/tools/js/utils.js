// 工具函数

// 生成唯一对象 ID
let objectIdCounter = 0;
function generateId() {
    return 'obj_' + (++objectIdCounter);
}

// 计算对象可达性（从 GC Roots 开始遍历）
function calculateReachability(gcRoots, allObjects) {
    const reachable = new Set();
    const visited = new Set();
    
    function traverse(obj) {
        if (visited.has(obj.id)) return;
        visited.add(obj.id);
        reachable.add(obj.id);
        
        if (obj.references) {
            obj.references.forEach(ref => {
                const targetObj = allObjects.find(o => o.id === ref);
                if (targetObj) {
                    traverse(targetObj);
                }
            });
        }
    }
    
    gcRoots.forEach(root => {
        const rootObj = allObjects.find(o => o.id === root);
        if (rootObj) {
            traverse(rootObj);
        }
    });
    
    return reachable;
}

// 判断是否绘制全量边（基于边数阈值）
function shouldDrawFullEdges(totalEdges, maxEdges) {
    return totalEdges <= maxEdges;
}

// 获取关键边（GC Roots 引用 + 选中对象邻居）
function getKeyEdges(allObjects, gcRoots, selectedObjectId, maxEdges) {
    const keyEdges = [];
    const added = new Set();
    
    // GC Roots 的引用
    gcRoots.forEach(rootId => {
        const rootObj = allObjects.find(o => o.id === rootId);
        if (rootObj && rootObj.references) {
            rootObj.references.forEach(refId => {
                const edgeKey = `${rootId}-${refId}`;
                if (!added.has(edgeKey)) {
                    keyEdges.push({ from: rootId, to: refId });
                    added.add(edgeKey);
                }
            });
        }
    });
    
    // 选中对象的一跳邻居
    if (selectedObjectId) {
        const selectedObj = allObjects.find(o => o.id === selectedObjectId);
        if (selectedObj && selectedObj.references) {
            selectedObj.references.forEach(refId => {
                const edgeKey = `${selectedObjectId}-${refId}`;
                if (!added.has(edgeKey) && keyEdges.length < maxEdges) {
                    keyEdges.push({ from: selectedObjectId, to: refId });
                    added.add(edgeKey);
                }
            });
        }
    }
    
    return keyEdges;
}

// 延迟函数（用于慢速展示）
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 格式化字节数显示
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
