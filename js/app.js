// Auth Check
if (localStorage.getItem('kmc_auth') !== 'true' && !window.location.href.includes('login.html')) {
    window.location.href = 'login.html';
}

function logout() {
    localStorage.removeItem('kmc_auth');
    window.location.href = 'login.html';
}

// Display Date
document.getElementById('date-string').innerText = new Date().toLocaleDateString('sk-SK', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
});

// Load Data
async function loadDashboardData() {
    try {
        const response = await fetch('data/tasks.json');
        let data = await response.json();

        // Merge with local tasks (for manual additions)
        const localTasks = JSON.parse(localStorage.getItem('kmc_manual_tasks') || '[]');
        const allTasks = [...data.tasks, ...localTasks];

        // Update Vitals
        document.getElementById('uptime-val').innerText = data.vitals.uptime;
        document.getElementById('ram-val').innerText = data.vitals.memory;

        // Render Tasks
        const taskList = document.getElementById('task-list');
        taskList.innerHTML = allTasks.map(task => `
            <div class="task-item">
                <span class="priority-tag priority-${task.priority.toLowerCase()}">${task.priority}</span>
                <span style="${task.status === 'Completed' ? 'text-decoration: line-through; opacity: 0.5;' : ''}">
                    ${task.text}
                </span>
            </div>
        `).join('');

        // Render Projects
        const projectList = document.getElementById('project-list');
        projectList.innerHTML = data.projects.map(project => `
            <div class="project-card" style="margin-bottom: 20px;">
                <h3>${project.name}</h3>
                <p>${project.description}</p>
                <a href="${project.url}" target="_blank" class="project-link">Otvoriť GitHub ></a>
            </div>
        `).join('');

    } catch (error) {
        console.error('Chyba pri načítaní dát:', error);
    }
}

// Modal Logic
function showAddTask() {
    document.getElementById('task-modal').style.display = 'flex';
}

function hideAddTask() {
    document.getElementById('task-modal').style.display = 'none';
}

function saveNewTask() {
    const text = document.getElementById('new-task-text').value;
    const priority = document.getElementById('new-task-priority').value;

    if (!text) return;

    const newTask = {
        id: Date.now(),
        text: text,
        priority: priority,
        status: 'In Progress'
    };

    const localTasks = JSON.parse(localStorage.getItem('kmc_manual_tasks') || '[]');
    localTasks.push(newTask);
    localStorage.setItem('kmc_manual_tasks', JSON.stringify(localTasks));

    hideAddTask();
    loadDashboardData();
    
    // Signal to Karol (via console or similar)
    console.log("TASK_ADDED_MANUALLY");
}

loadDashboardData();
// Refresh every 30 seconds
setInterval(loadDashboardData, 30000);
