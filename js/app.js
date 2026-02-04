// Auth Check
if (localStorage.getItem('kmc_auth') !== 'true' && !window.location.href.includes('login.html')) {
    window.location.href = 'login.html';
}

// Global functions for buttons
window.logout = function() {
    localStorage.removeItem('kmc_auth');
    window.location.href = 'login.html';
}

window.showAddTask = function(e) {
    if (e) e.preventDefault();
    console.log("Opening modal...");
    const modal = document.getElementById('task-modal');
    if (modal) {
        modal.style.display = 'flex';
        // Focus input
        setTimeout(() => document.getElementById('new-task-text').focus(), 100);
    }
}

window.hideAddTask = function() {
    document.getElementById('task-modal').style.display = 'none';
}

window.saveNewTask = function() {
    const text = document.getElementById('new-task-text').value;
    const priority = document.getElementById('new-task-priority').value;

    if (!text) {
        alert("Prosím zadajte text úlohy.");
        return;
    }

    const newTask = {
        id: 'manual_' + Date.now(),
        text: text,
        priority: priority,
        status: 'In Progress'
    };

    const localTasks = JSON.parse(localStorage.getItem('kmc_manual_tasks') || '[]');
    localTasks.push(newTask);
    localStorage.setItem('kmc_manual_tasks', JSON.stringify(localTasks));

    document.getElementById('new-task-text').value = '';
    hideAddTask();
    loadDashboardData();
}

window.deleteTask = function(id) {
    if (!id.toString().startsWith('manual_')) {
        alert("Systémové úlohy nie je možné vymazať manuálne.");
        return;
    }
    if (confirm("Naozaj chcete vymazať túto úlohu?")) {
        let localTasks = JSON.parse(localStorage.getItem('kmc_manual_tasks') || '[]');
        localTasks = localTasks.filter(t => t.id.toString() !== id.toString());
        localStorage.setItem('kmc_manual_tasks', JSON.stringify(localTasks));
        loadDashboardData();
    }
}

window.toggleTaskStatus = function(id) {
    if (!id.toString().startsWith('manual_')) {
        alert("Status systémových úloh sa mení automaticky.");
        return;
    }
    let localTasks = JSON.parse(localStorage.getItem('kmc_manual_tasks') || '[]');
    const task = localTasks.find(t => t.id.toString() === id.toString());
    if (task) {
        task.status = task.status === 'Completed' ? 'In Progress' : 'Completed';
        localStorage.setItem('kmc_manual_tasks', JSON.stringify(localTasks));
        loadDashboardData();
    }
}

// Display Date
const dateEl = document.getElementById('date-string');
if (dateEl) {
    dateEl.innerText = new Date().toLocaleDateString('sk-SK', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
}

// Load Data
async function loadDashboardData() {
    try {
        const response = await fetch('data/tasks.json');
        let data = { tasks: [], projects: [], vitals: {} };
        
        if (response.ok) {
            data = await response.json();
        }

        // Merge with local tasks
        const localTasks = JSON.parse(localStorage.getItem('kmc_manual_tasks') || '[]');
        const allTasks = [...data.tasks, ...localTasks];

        // Update Vitals
        if (document.getElementById('uptime-val')) document.getElementById('uptime-val').innerText = data.vitals.uptime || 'N/A';
        if (document.getElementById('ram-val')) document.getElementById('ram-val').innerText = data.vitals.memory || 'N/A';

        // Render Tasks
        const taskList = document.getElementById('task-list');
        if (taskList) {
            taskList.innerHTML = allTasks.map(task => `
                <div class="task-item">
                    <div style="flex: 1; display: flex; align-items: center;">
                        <span class="priority-tag priority-${task.priority.toLowerCase()}">${task.priority}</span>
                        <span style="${task.status === 'Completed' ? 'text-decoration: line-through; opacity: 0.5;' : ''}">
                            ${task.text}
                        </span>
                    </div>
                    <div class="task-actions" style="display: flex; gap: 10px;">
                        <button onclick="toggleTaskStatus('${task.id}')" style="width: auto; padding: 5px 10px; background: transparent; border: 1px solid #444; font-size: 0.7rem;">
                            ${task.status === 'Completed' ? 'Vrátiť' : 'Hotovo'}
                        </button>
                        <button onclick="deleteTask('${task.id}')" style="width: auto; padding: 5px 10px; background: rgba(255, 69, 58, 0.2); color: #ff453a; font-size: 0.7rem;">
                            Vymazať
                        </button>
                    </div>
                </div>
            `).join('');
        }

        // Render Projects
        const projectList = document.getElementById('project-list');
        if (projectList) {
            projectList.innerHTML = data.projects.map(project => `
                <div class="project-card" style="margin-bottom: 20px;">
                    <h3>${project.name}</h3>
                    <p>${project.description}</p>
                    <a href="${project.url}" target="_blank" class="project-link">Otvoriť GitHub ></a>
                </div>
            `).join('');
        }

    } catch (error) {
        console.error('Chyba pri načítaní dát:', error);
    }
}

loadDashboardData();
setInterval(loadDashboardData, 30000);

loadDashboardData();
// Refresh every 30 seconds
setInterval(loadDashboardData, 30000);
