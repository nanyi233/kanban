/**
 * Project Kanban Board - Main Application
 * Drag & drop project management with priority levels
 */

// ========================================
// Configuration & State
// ========================================

const API_BASE = '';
const MATURITY_INFO = {
    seed: { emoji: '🌱', label: 'Seed', description: '种子想法' },
    sprout: { emoji: '🌿', label: 'Sprout', description: '开始萌芽' },
    tree: { emoji: '🌳', label: 'Tree', description: '随时开工' }
};

const FILE_ICONS = {
    directory: '📁',
    '.md': '📝',
    '.txt': '📄',
    '.pdf': '📕',
    '.doc': '📘',
    '.docx': '📘',
    '.xls': '📊',
    '.xlsx': '📊',
    '.ppt': '📙',
    '.pptx': '📙',
    '.xmind': '🧠',
    '.mp4': '🎬',
    '.mp3': '🎵',
    '.png': '🖼️',
    '.jpg': '🖼️',
    '.jpeg': '🖼️',
    '.gif': '🖼️',
    '.zip': '📦',
    '.rar': '📦',
    '.py': '🐍',
    '.js': '📜',
    '.html': '🌐',
    '.css': '🎨',
    default: '📄'
};

// Application state
let projects = { P0: [], P1: [], P2: [] };
let draggedCard = null;
let selectedCard = null;

// ========================================
// Initialization
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadProjects();
    setupEventListeners();
});

function initTheme() {
    const savedTheme = localStorage.getItem('kanban-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function setupEventListeners() {
    // Close context menu on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.context-menu')) {
            closeContextMenu();
        }
    });

    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeHelp();
            closeContextMenu();
        }
    });

    // Context menu item clicks
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', handleMaturityChange);
    });
}

// ========================================
// API Functions
// ========================================

async function loadProjects() {
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/api/projects`);
        if (!response.ok) throw new Error('Failed to load projects');
        
        projects = await response.json();
        renderAllColumns();
        updateStats();
        showToast('✅ 项目加载成功', 'success');
    } catch (error) {
        console.error('Error loading projects:', error);
        showToast('❌ 加载失败，请确保服务器已启动', 'error');
    } finally {
        hideLoading();
    }
}

async function moveProject(itemName, sourcePriority, targetPriority) {
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/api/move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                item_name: itemName,
                source_priority: sourcePriority,
                target_priority: targetPriority
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Update local state
            const itemIndex = projects[sourcePriority].findIndex(p => p.name === itemName);
            if (itemIndex > -1) {
                const [item] = projects[sourcePriority].splice(itemIndex, 1);
                item.priority = targetPriority;
                projects[targetPriority].push(item);
            }
            
            renderAllColumns();
            updateStats();
            playDropSound();
            showToast(`✅ 已移动到 ${targetPriority}`, 'success');
        } else {
            showToast(`❌ 移动失败: ${result.error}`, 'error');
            await loadProjects(); // Reload to sync state
        }
    } catch (error) {
        console.error('Error moving project:', error);
        showToast('❌ 移动失败，请重试', 'error');
        await loadProjects();
    } finally {
        hideLoading();
    }
}

async function updateProjectMaturity(priority, currentName, newMaturity) {
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/api/update_maturity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                priority: priority,
                current_name: currentName,
                new_maturity: newMaturity
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(`✅ 成熟度已更新`, 'success');
            await loadProjects(); // Reload to get new names
        } else {
            showToast(`❌ 更新失败: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Error updating maturity:', error);
        showToast('❌ 更新失败，请重试', 'error');
    } finally {
        hideLoading();
    }
}

async function openItem(path) {
    try {
        const response = await fetch(`${API_BASE}/api/open`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            showToast(`❌ 打开失败: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Error opening item:', error);
        showToast('❌ 打开失败', 'error');
    }
}

// ========================================
// Rendering Functions
// ========================================

function renderAllColumns() {
    ['P0', 'P1', 'P2'].forEach(priority => {
        renderColumn(priority);
    });
}

function renderColumn(priority) {
    const container = document.getElementById(`cards-${priority.toLowerCase()}`);
    const items = projects[priority] || [];
    
    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <p class="empty-state-text">暂无项目<br>拖拽卡片到这里</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = items.map((item, index) => createCardHTML(item, index)).join('');
    
    // Add event listeners to cards
    container.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
        card.addEventListener('dblclick', handleDoubleClick);
        card.addEventListener('contextmenu', handleContextMenu);
    });
}

function createCardHTML(item, index) {
    const icon = getFileIcon(item);
    const maturityBadge = getMaturityBadge(item.maturity);
    const sizeStr = item.size ? formatFileSize(item.size) : '';
    const typeStr = item.type === 'directory' ? '文件夹' : (item.extension || '文件');
    
    return `
        <div class="project-card" 
             draggable="true"
             data-name="${escapeHtml(item.name)}"
             data-priority="${item.priority}"
             data-path="${escapeHtml(item.path)}"
             data-maturity="${item.maturity || ''}"
             data-type="${item.type}"
             style="animation-delay: ${index * 0.05}s">
            <div class="card-header">
                <span class="card-icon">${icon}</span>
                <div class="card-info">
                    <div class="card-name">${escapeHtml(item.clean_name)}</div>
                </div>
            </div>
            <div class="card-footer">
                <div class="card-meta">
                    <span class="meta-tag">${typeStr}</span>
                    ${sizeStr ? `<span class="meta-tag">${sizeStr}</span>` : ''}
                </div>
                ${maturityBadge}
            </div>
        </div>
    `;
}

function getFileIcon(item) {
    if (item.type === 'directory') return FILE_ICONS.directory;
    return FILE_ICONS[item.extension] || FILE_ICONS.default;
}

function getMaturityBadge(maturity) {
    if (!maturity || !MATURITY_INFO[maturity]) return '';
    const info = MATURITY_INFO[maturity];
    return `<span class="maturity-badge maturity-${maturity}">${info.emoji} ${info.label}</span>`;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateStats() {
    document.getElementById('count-p0').textContent = projects.P0.length;
    document.getElementById('count-p1').textContent = projects.P1.length;
    document.getElementById('count-p2').textContent = projects.P2.length;
    document.getElementById('count-total').textContent = 
        projects.P0.length + projects.P1.length + projects.P2.length;
}

// ========================================
// Drag & Drop Handlers
// ========================================

function handleDragStart(e) {
    draggedCard = e.target;
    draggedCard.classList.add('dragging');
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({
        name: draggedCard.dataset.name,
        priority: draggedCard.dataset.priority
    }));
}

function handleDragEnd(e) {
    if (draggedCard) {
        draggedCard.classList.remove('dragging');
    }
    draggedCard = null;
    
    // Remove all drag-over states
    document.querySelectorAll('.card-container').forEach(container => {
        container.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    try {
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        const targetContainer = e.currentTarget;
        const targetColumn = targetContainer.closest('.kanban-column');
        const targetPriority = targetColumn.dataset.priority;
        
        if (data.priority !== targetPriority) {
            moveProject(data.name, data.priority, targetPriority);
        }
    } catch (error) {
        console.error('Drop error:', error);
    }
}

// ========================================
// Event Handlers
// ========================================

function handleDoubleClick(e) {
    const card = e.currentTarget;
    const path = card.dataset.path;
    if (path) {
        openItem(path);
    }
}

function handleContextMenu(e) {
    e.preventDefault();
    
    selectedCard = e.currentTarget;
    const contextMenu = document.getElementById('context-menu');
    
    // Position the menu
    const x = e.clientX;
    const y = e.clientY;
    
    // Ensure menu stays within viewport
    contextMenu.style.left = `${Math.min(x, window.innerWidth - 200)}px`;
    contextMenu.style.top = `${Math.min(y, window.innerHeight - 250)}px`;
    
    contextMenu.classList.add('active');
}

function handleMaturityChange(e) {
    if (!selectedCard) return;
    
    const newMaturity = e.currentTarget.dataset.maturity;
    const priority = selectedCard.dataset.priority;
    const currentName = selectedCard.dataset.name;
    
    closeContextMenu();
    
    if (newMaturity === 'none') {
        updateProjectMaturity(priority, currentName, null);
    } else {
        updateProjectMaturity(priority, currentName, newMaturity);
    }
}

function closeContextMenu() {
    document.getElementById('context-menu').classList.remove('active');
    selectedCard = null;
}

// ========================================
// Filter Functions
// ========================================

function filterProjects() {
    const searchText = document.getElementById('search-input').value.toLowerCase();
    const maturityFilter = document.getElementById('maturity-filter').value;
    const typeFilter = document.getElementById('type-filter').value;
    
    document.querySelectorAll('.project-card').forEach(card => {
        const name = card.dataset.name.toLowerCase();
        const maturity = card.dataset.maturity;
        const type = card.dataset.type;
        
        let visible = true;
        
        // Search filter
        if (searchText && !name.includes(searchText)) {
            visible = false;
        }
        
        // Maturity filter
        if (maturityFilter !== 'all') {
            if (maturityFilter === 'none' && maturity) {
                visible = false;
            } else if (maturityFilter !== 'none' && maturity !== maturityFilter) {
                visible = false;
            }
        }
        
        // Type filter
        if (typeFilter !== 'all' && type !== typeFilter) {
            visible = false;
        }
        
        card.classList.toggle('hidden', !visible);
    });
}

// ========================================
// Theme Functions
// ========================================

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('kanban-theme', newTheme);
    
    const themeBtn = document.querySelector('.btn-theme');
    themeBtn.textContent = newTheme === 'dark' ? '☀️ 主题' : '🌙 主题';
}

// ========================================
// UI Helper Functions
// ========================================

function showHelp() {
    document.getElementById('help-modal').classList.add('active');
}

function closeHelp() {
    document.getElementById('help-modal').classList.remove('active');
}

function showLoading() {
    document.getElementById('loading').classList.add('active');
}

function hideLoading() {
    document.getElementById('loading').classList.remove('active');
}

function showToast(message, type = '') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast active ' + type;
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

function playDropSound() {
    // Use the new sound effects system if available
    if (window.SoundEffects && window.SoundEffects.playDrop) {
        window.SoundEffects.playDrop();
    }
}

// ========================================
// Keyboard Shortcuts
// ========================================

document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + R to refresh
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        loadProjects();
    }
    
    // Ctrl/Cmd + F to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('search-input').focus();
    }
    
    // ? to show help
    if (e.key === '?' && !e.target.matches('input, textarea')) {
        showHelp();
    }
});