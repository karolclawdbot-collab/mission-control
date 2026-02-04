// Supabase Configuration
const SUPABASE_URL = 'https://zbbjwmlcuuuuwpyuajxs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiYmp3bWxjdXV1dXdweXVhanhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNDQ5MzEsImV4cCI6MjA4NTcyMDkzMX0.4rXBAtNlGzCEQJrZS7L1bEpPqpBkd_L3_2HRZ8qceAs';

// Bug fix: rename variable to avoid shadowing global 'supabase' object
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Auth Check
if (localStorage.getItem('kmc_auth') !== 'true' && !window.location.href.includes('login.html')) {
    window.location.href = 'login.html';
}

// Global functions
window.logout = function() {
    localStorage.removeItem('kmc_auth');
    window.location.href = 'login.html';
}

window.showAddTask = function(e) {
    if (e) e.preventDefault();
    document.getElementById('task-modal').style.display = 'flex';
    setTimeout(() => document.getElementById('new-task-text').focus(), 100);
}

window.hideAddTask = function() {
    document.getElementById('task-modal').style.display = 'none';
}

window.saveNewTask = async function() {
    const text = document.getElementById('new-task-text').value;
    const priority = document.getElementById('new-task-priority').value;

    if (!text) {
        alert("Prosím zadajte text úlohy.");
        return;
    }

    const { error } = await supabaseClient
        .from('tasks')
        .insert([{ text, priority, status: 'In Progress' }]);

    if (error) {
        console.error('Error saving task:', error);
        alert("Chyba pri ukladaní úlohy.");
    } else {
        document.getElementById('new-task-text').value = '';
        hideAddTask();
        loadDashboardData();
    }
}

window.deleteTask = async function(id) {
    if (confirm("Naozaj chcete vymazať túto úlohu?")) {
        const { error } = await supabaseClient
            .from('tasks')
            .delete()
            .eq('id', id);

        if (error) console.error('Error deleting task:', error);
        loadDashboardData();
    }
}

window.toggleTaskStatus = async function(id, currentStatus) {
    const newStatus = currentStatus === 'Completed' ? 'In Progress' : 'Completed';
    const { error } = await supabaseClient
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', id);

    if (error) console.error('Error updating task:', error);
    loadDashboardData();
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
        console.log("Loading tasks from Supabase...");
        const { data: tasks, error: taskError } = await supabaseClient
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });

        if (taskError) throw taskError;

        // Fetch static data (vitals, projects) from local JSON for now
        const response = await fetch('data/tasks.json');
        let staticData = { vitals: {}, projects: [] };
        if (response.ok) {
            staticData = await response.json();
        }

        // Update Vitals
        if (document.getElementById('uptime-val')) document.getElementById('uptime-val').innerText = staticData.vitals.uptime || 'N/A';
        if (document.getElementById('ram-val')) document.getElementById('ram-val').innerText = staticData.vitals.memory || 'N/A';

        // Render Tasks
        const taskList = document.getElementById('task-list');
        if (taskList) {
            taskList.innerHTML = tasks.map(task => `
                <div class="task-item">
                    <div style="flex: 1; display: flex; align-items: center;">
                        <span class="priority-tag priority-${task.priority.toLowerCase()}">${task.priority}</span>
                        <span style="${task.status === 'Completed' ? 'text-decoration: line-through; opacity: 0.5;' : ''}">
                            ${task.text}
                        </span>
                    </div>
                    <div class="task-actions" style="display: flex; gap: 10px;">
                        <button onclick="toggleTaskStatus('${task.id}', '${task.status}')" style="width: auto; padding: 5px 10px; background: transparent; border: 1px solid #444; font-size: 0.7rem;">
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
            projectList.innerHTML = staticData.projects.map(project => `
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

// Subscription for Realtime
supabaseClient
  .channel('tasks_channel')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, payload => {
    console.log('Change received!', payload);
    loadDashboardData();
  })
  .subscribe();

loadDashboardData();
