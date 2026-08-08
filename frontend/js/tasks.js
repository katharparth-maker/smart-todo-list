/**
 * TaskPilotAI – Task Management Module
 * File: frontend/js/tasks.js
 *
 * Responsibilities:
 *   - CRUD operations for tasks stored in localStorage (key: 'taskpilot_tasks')
 *   - Comprehensive search matching across title, description, category, and priority
 *   - Priority tabs, category filtering, and task completion state toggles
 *   - Dynamic task creation & editing modal
 *   - Real-time synchronization of task lists and summary statistics
 *     across tasks.html, dashboard.html, and search-bar.html
 */

import { showToast, toggleModal } from './ui.js';

export const STORAGE_KEY = 'taskpilot_tasks';

/**
 * Default seed tasks to ensure rich initial experience if localStorage is empty.
 */
const DEFAULT_TASKS = [
  {
    id: 'task-1',
    title: 'Complete project documentation',
    description: 'Finalize the technical specs and API documentation for the V2 release.',
    priority: 'High',
    category: 'Project',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '16:00',
    status: 'pending',
    isAiSuggested: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'task-2',
    title: 'Review Python assignment',
    description: 'Review unit test coverage and refactor asynchronous handlers.',
    priority: 'Medium',
    category: 'Study',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '19:00',
    status: 'pending',
    isAiSuggested: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'task-3',
    title: 'Prepare presentation',
    description: 'Create slide deck for executive product strategy alignment.',
    priority: 'High',
    category: 'Work',
    dueDate: getRelativeDateString(1),
    dueTime: '10:00',
    status: 'pending',
    isAiSuggested: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'task-4',
    title: 'Practice coding problems',
    description: 'Solve dynamic programming and graph algorithms on LeetCode.',
    priority: 'Low',
    category: 'Study',
    dueDate: getRelativeDateString(2),
    dueTime: '18:00',
    status: 'pending',
    isAiSuggested: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'task-5',
    title: 'Team meeting',
    description: 'Weekly sync to discuss sprint progress and blockers.',
    priority: 'Medium',
    category: 'Project',
    dueDate: getRelativeDateString(3),
    dueTime: '14:00',
    status: 'pending',
    isAiSuggested: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'task-6',
    title: 'Buy groceries',
    description: 'Weekly organic pantry restocking and fresh produce.',
    priority: 'Low',
    category: 'Personal',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '09:15',
    status: 'completed',
    isAiSuggested: false,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString()
  }
];

/**
 * Helper to compute date string formatted YYYY-MM-DD offset by days.
 * @param {number} offsetDays
 * @returns {string}
 */
function getRelativeDateString(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

/**
 * Retrieve all tasks from localStorage.
 * Initializes with DEFAULT_TASKS if no data exists.
 * @returns {Array<Object>}
 */
export function getTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TASKS));
      return [...DEFAULT_TASKS];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('[TaskPilot Tasks] Failed to parse localStorage tasks:', err);
    return [...DEFAULT_TASKS];
  }
}

/**
 * Save array of tasks to localStorage.
 * @param {Array<Object>} tasks
 */
export function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error('[TaskPilot Tasks] Failed to save tasks to localStorage:', err);
  }
}

/**
 * Create a new task.
 * @param {Object} taskData - { title, description, priority, category, dueDate, dueTime }
 * @returns {Object} Newly created task
 */
export function createTask(taskData) {
  const tasks = getTasks();
  const newTask = {
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    title: taskData.title.trim(),
    description: (taskData.description || '').trim(),
    priority: taskData.priority || 'Medium',
    category: taskData.category || 'Personal',
    dueDate: taskData.dueDate || new Date().toISOString().split('T')[0],
    dueTime: taskData.dueTime || '12:00',
    status: 'pending',
    isAiSuggested: Boolean(taskData.isAiSuggested),
    createdAt: new Date().toISOString()
  };

  tasks.unshift(newTask);
  saveTasks(tasks);
  refreshCurrentPageTasks();
  showToast('Task created successfully', 'success');
  return newTask;
}

/**
 * Update an existing task.
 * @param {string} id - Task ID
 * @param {Object} updates - Updated fields
 * @returns {Object|null}
 */
export function updateTask(id, updates) {
  const tasks = getTasks();
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return null;

  tasks[index] = {
    ...tasks[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  saveTasks(tasks);
  refreshCurrentPageTasks();
  showToast('Task updated successfully', 'success');
  return tasks[index];
}

/**
 * Delete a task by ID.
 * @param {string} id
 * @returns {boolean}
 */
export function deleteTask(id) {
  const tasks = getTasks();
  const filtered = tasks.filter(t => t.id !== id);
  if (filtered.length === tasks.length) return false;

  saveTasks(filtered);
  refreshCurrentPageTasks();
  showToast('Task deleted', 'info');
  return true;
}

/**
 * Toggle task completion state between 'completed' and 'pending'.
 * @param {string} id
 * @returns {Object|null}
 */
export function toggleTaskStatus(id) {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === id);
  if (!task) return null;

  const isCompleted = task.status === 'completed';
  task.status = isCompleted ? 'pending' : 'completed';
  task.completedAt = isCompleted ? null : new Date().toISOString();

  saveTasks(tasks);
  refreshCurrentPageTasks();
  showToast(isCompleted ? 'Task marked pending' : 'Task completed! 🎉', 'success');
  return task;
}

/**
 * Search tasks across all 4 key fields: title, description, category, and priority.
 * @param {string} query - Search term
 * @param {Array<Object>} [taskList=getTasks()] - Task list to filter
 * @returns {Array<Object>} Matching task objects
 */
export function searchTasks(query, taskList = getTasks()) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return taskList;

  return taskList.filter(task => {
    const titleMatch = (task.title || '').toLowerCase().includes(q);
    const descMatch = (task.description || '').toLowerCase().includes(q);
    const categoryMatch = (task.category || '').toLowerCase().includes(q);
    const priorityMatch = (task.priority || '').toLowerCase().includes(q);

    return titleMatch || descMatch || categoryMatch || priorityMatch;
  });
}

/**
 * Calculate summary statistics for the dashboard and tasks page.
 * @param {Array<Object>} [tasks]
 * @returns {{ total: number, today: number, completed: number, pending: number, overdue: number, score: number }}
 */
export function calculateTaskStatistics(tasks = getTasks()) {
  const todayStr = new Date().toISOString().split('T')[0];

  let total = tasks.length;
  let today = 0;
  let completed = 0;
  let pending = 0;
  let overdue = 0;

  tasks.forEach(task => {
    const isTaskCompleted = task.status === 'completed';

    if (isTaskCompleted) {
      completed++;
    } else {
      pending++;
      if (task.dueDate && task.dueDate < todayStr) {
        overdue++;
      }
    }

    if (task.dueDate === todayStr) {
      today++;
    }
  });

  const score = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, today, completed, pending, overdue, score };
}

/**
 * Filter tasks based on search query, category, priority, and status.
 * @param {Array<Object>} tasks
 * @param {{ search?: string, category?: string, priority?: string, status?: string }} filters
 * @returns {Array<Object>}
 */
export function filterTasks(tasks, filters = {}) {
  const search = (filters.search || '').trim().toLowerCase();
  const category = (filters.category || 'All').trim().toLowerCase();
  const priority = (filters.priority || 'All').trim().toLowerCase();
  const status = (filters.status || 'All').trim().toLowerCase();

  return tasks.filter(task => {
    // 1. Category Filter
    if (category !== 'all') {
      const taskCat = (task.category || '').toLowerCase();
      if (category === 'projects') {
        if (!taskCat.includes('project')) return false;
      } else if (taskCat !== category) {
        return false;
      }
    }

    // 2. Priority Filter
    if (priority !== 'all') {
      if ((task.priority || '').toLowerCase() !== priority) return false;
    }

    // 3. Status Filter
    if (status !== 'all') {
      if ((task.status || '').toLowerCase() !== status) return false;
    }

    // 4. Search Filter (Title, Description, Category, Priority)
    if (search) {
      const matchTitle = (task.title || '').toLowerCase().includes(search);
      const matchDesc = (task.description || '').toLowerCase().includes(search);
      const matchCat = (task.category || '').toLowerCase().includes(search);
      const matchPriority = (task.priority || '').toLowerCase().includes(search);
      if (!matchTitle && !matchDesc && !matchCat && !matchPriority) return false;
    }

    return true;
  });
}

/**
 * Generate semantic HTML markup for a single task card matching task-card.html.
 * @param {Object} task
 * @returns {string} HTML string
 */
export function renderTaskCardHTML(task) {
  const isCompleted = task.status === 'completed';
  const priority = task.priority || 'Medium';

  const priorityStyles = {
    High: {
      badgeBg: 'bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]'
    },
    Medium: {
      badgeBg: 'bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047]'
    },
    Low: {
      badgeBg: 'bg-[#DCFCE7] text-[#166534] border border-[#A6F4B5]'
    }
  };

  const currentPriority = priorityStyles[priority] || priorityStyles.Medium;

  const categoryIcons = {
    Study: 'school',
    Work: 'work',
    Personal: 'person',
    Project: 'folder',
    Projects: 'folder',
    Learning: 'code',
    College: 'menu_book'
  };
  const catIcon = categoryIcons[task.category] || 'folder';

  const todayStr = new Date().toISOString().split('T')[0];
  let dateDisplay = 'Today';
  if (task.dueDate) {
    if (task.dueDate === todayStr) {
      dateDisplay = task.dueTime ? `Today ${formatTime(task.dueTime)}` : 'Today';
    } else {
      dateDisplay = `${task.dueDate} ${task.dueTime ? formatTime(task.dueTime) : ''}`;
    }
  }

  return `
    <div class="task-card bg-surface-container-lowest border border-outline-variant rounded-lg p-md flex items-start gap-md hover:bg-[#F1F1ED] transition-all shadow-level1 group relative ${isCompleted ? 'opacity-60 is-completed' : ''}" data-id="${task.id}" data-priority="${priority.toLowerCase()}" data-status="${task.status}">
      <input class="mt-1 w-5 h-5 rounded-DEFAULT border-outline-variant text-secondary focus:ring-secondary cursor-pointer task-checkbox-input" type="checkbox" ${isCompleted ? 'checked' : ''} aria-label="Toggle task completion"/>
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between mb-xs">
          <h3 class="task-title font-label-md text-label-md text-primary font-bold ${isCompleted ? 'line-through text-on-surface-variant' : ''}">${escapeHTML(task.title)}</h3>
          <div class="flex gap-xs items-center">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${currentPriority.badgeBg}">${priority}</span>
            <div class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-2">
              <button class="btn-edit-task p-1 text-on-surface-variant hover:text-secondary rounded hover:bg-surface-container-high transition-colors" title="Edit Task" aria-label="Edit Task">
                <span class="material-symbols-outlined" style="font-size: 16px;">edit</span>
              </button>
              <button class="btn-delete-task p-1 text-on-surface-variant hover:text-error rounded hover:bg-error-container/40 transition-colors" title="Delete Task" aria-label="Delete Task">
                <span class="material-symbols-outlined" style="font-size: 16px;">delete</span>
              </button>
            </div>
          </div>
        </div>
        ${task.description ? `<p class="task-desc font-body-sm text-body-sm text-on-surface-variant mb-sm line-clamp-1">${escapeHTML(task.description)}</p>` : ''}
        <div class="flex items-center gap-md text-on-surface-variant font-body-sm text-body-sm flex-wrap mt-1">
          <span class="flex items-center gap-xs"><span class="material-symbols-outlined text-[16px]">${catIcon}</span> ${escapeHTML(task.category || 'General')}</span>
          <span class="flex items-center gap-xs ${!isCompleted && task.dueDate < todayStr ? 'text-error font-medium' : ''}">
            <span class="material-symbols-outlined text-[16px]">schedule</span> ${dateDisplay}
          </span>
          ${task.isAiSuggested ? `
            <span class="flex items-center gap-xs border-l-2 border-secondary pl-xs text-secondary">
              <span class="material-symbols-outlined text-[14px]">auto_awesome</span> AI Suggested
            </span>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Format 24h time to 12h AM/PM.
 * @param {string} timeStr
 * @returns {string}
 */
function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  if (isNaN(hour)) return timeStr;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${m} ${ampm}`;
}

/**
 * Safe HTML escaping.
 * @param {string} str
 * @returns {string}
 */
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Active filter state for the tasks page.
 */
let currentFilterState = {
  category: 'All',
  search: '',
  priority: 'All',
  status: 'All'
};

/**
 * Initialize and render the Tasks page (frontend/pages/tasks.html).
 */
export function initTasksPage() {
  const isTasksPage = window.location.pathname.includes('tasks.html');
  if (!isTasksPage) return;

  renderTasksPage();
  setupTasksPageListeners();
}

/**
 * Render task summary stats and task list on tasks.html.
 */
export function renderTasksPage() {
  const allTasks = getTasks();
  const stats = calculateTaskStatistics(allTasks);

  // 1. Update Task Summary Cards
  updateTasksPageStats(stats);

  // 2. Filter tasks and render list
  const filtered = filterTasks(allTasks, currentFilterState);
  const taskListContainer = document.querySelector('main .flex.flex-col.gap-sm') || document.querySelector('#tasks-container');

  if (taskListContainer) {
    if (filtered.length === 0) {
      taskListContainer.innerHTML = `
        <div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg text-center flex flex-col items-center justify-center gap-sm my-md">
          <span class="material-symbols-outlined text-outline text-[40px]">task_alt</span>
          <h3 class="font-headline-sm text-headline-sm font-bold text-primary">No tasks found</h3>
          <p class="font-body-sm text-on-surface-variant max-w-sm">No tasks match your search or filter criteria. Try adjusting your query or creating a new task.</p>
        </div>
      `;
    } else {
      taskListContainer.innerHTML = filtered.map(t => renderTaskCardHTML(t)).join('');
    }

    bindTaskCardActions(taskListContainer);
  }
}

/**
 * Update the 4 stat cards on tasks.html.
 * @param {Object} stats
 */
function updateTasksPageStats(stats) {
  const statGrid = document.querySelector('main .grid.grid-cols-2.md\\:grid-cols-4');
  if (!statGrid) return;

  const statBoxes = statGrid.children;
  if (statBoxes.length >= 4) {
    const allVal = statBoxes[0].querySelector('.font-headline-lg, p:nth-child(2)');
    if (allVal) allVal.textContent = stats.total;

    const todayVal = statBoxes[1].querySelector('.font-headline-lg, p:nth-child(2)');
    if (todayVal) todayVal.textContent = stats.today;

    const compVal = statBoxes[2].querySelector('.font-headline-lg, p:nth-child(2)');
    if (compVal) compVal.textContent = stats.completed;

    const overVal = statBoxes[3].querySelector('.font-headline-lg, p:nth-child(2)');
    if (overVal) overVal.textContent = stats.overdue;
  }
}

/**
 * Setup search input, category tab clicks, and modal buttons on tasks.html.
 */
function setupTasksPageListeners() {
  // 1. Category Filter Tabs
  const tabButtons = document.querySelectorAll('main .flex.gap-sm.overflow-x-auto button, main .hide-scrollbar button');
  tabButtons.forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      tabButtons.forEach(b => {
        b.className = 'px-sm py-[6px] rounded-DEFAULT border border-outline-variant bg-surface-container-lowest text-on-surface-variant font-label-md text-label-md whitespace-nowrap hover:bg-surface-container-low transition-colors';
      });
      btn.className = 'px-sm py-[6px] rounded-DEFAULT border border-secondary bg-secondary-container text-on-secondary-container font-label-md text-label-md whitespace-nowrap font-bold';

      currentFilterState.category = btn.textContent.trim();
      renderTasksPage();
    };
  });

  // 2. Search Input on Tasks Page
  const searchInput = document.querySelector('main input[placeholder*="Search tasks..."]');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentFilterState.search = e.target.value;
      renderTasksPage();
    });
  }

  // 3. Add Task Button
  const addTaskButtons = document.querySelectorAll('button:has(span[data-icon="add"]), button:contains("Add Task"), button:contains("Create Task")');
  addTaskButtons.forEach(btn => {
    const text = btn.textContent.trim();
    if (text.includes('Add Task') || text.includes('Create Task') || text.includes('New Task')) {
      btn.onclick = (e) => {
        e.preventDefault();
        openTaskModal();
      };
    }
  });
}

/**
 * Initialize and render task statistics and task list on Dashboard (frontend/pages/dashboard.html).
 */
export function initDashboardTasks() {
  const isDashboard = window.location.pathname.includes('dashboard.html');
  if (!isDashboard) return;

  renderDashboardTasks();
  setupDashboardListeners();
}

/**
 * Render today's task list and update summary statistic numbers on dashboard.html.
 */
export function renderDashboardTasks() {
  const allTasks = getTasks();
  const stats = calculateTaskStatistics(allTasks);

  const summaryGrid = document.querySelector('main .grid.grid-cols-2.lg\\:grid-cols-4');
  if (summaryGrid && summaryGrid.children.length >= 4) {
    const cards = summaryGrid.children;
    const c1 = cards[0].querySelector('.font-headline-lg, p.font-bold');
    if (c1) c1.textContent = stats.today;

    const c2 = cards[1].querySelector('.font-headline-lg, p.font-bold');
    if (c2) c2.textContent = stats.completed;

    const c3 = cards[2].querySelector('.font-headline-lg, p.font-bold');
    if (c3) c3.textContent = stats.pending;

    const c4 = cards[3].querySelector('.font-headline-lg, p.font-bold');
    if (c4) c4.textContent = `${stats.score}%`;
  }

  const dashboardTaskList = document.querySelector('main ul.divide-y');
  if (dashboardTaskList) {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = allTasks.filter(t => t.dueDate === todayStr || t.status === 'pending');

    if (todayTasks.length === 0) {
      dashboardTaskList.innerHTML = `
        <li class="p-6 text-center text-on-surface-variant font-body-sm">
          No tasks scheduled for today. Create a new task to get started!
        </li>
      `;
    } else {
      dashboardTaskList.innerHTML = todayTasks.slice(0, 5).map(task => {
        const isCompleted = task.status === 'completed';
        const priorityColors = {
          High: 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]',
          Medium: 'bg-[#FEF9C3] text-[#854D0E] border-[#FDE047]',
          Low: 'bg-secondary-container text-on-secondary-container border-secondary-fixed-dim'
        };
        const badgeColor = priorityColors[task.priority] || priorityColors.Medium;

        return `
          <li class="p-4 hover:bg-surface-container-low transition-colors group flex items-start gap-3 ${isCompleted ? 'opacity-60 bg-surface-bright/50' : ''}" data-id="${task.id}">
            <input class="mt-1 w-5 h-5 rounded border-outline text-secondary focus:ring-secondary/20 cursor-pointer task-checkbox-input" type="checkbox" ${isCompleted ? 'checked' : ''} aria-label="Mark task as complete"/>
            <div class="flex-1 min-w-0">
              <p class="font-label-md text-primary truncate group-hover:text-secondary transition-colors ${isCompleted ? 'line-through text-on-surface-variant' : ''}">${escapeHTML(task.title)}</p>
              <div class="flex items-center gap-2 mt-1 text-xs text-on-surface-variant">
                <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">schedule</span> ${task.dueTime ? formatTime(task.dueTime) : 'Today'}</span>
                <span>•</span>
                <span class="px-2 py-0.5 rounded bg-surface-variant text-on-surface-variant font-medium">${escapeHTML(task.category || 'General')}</span>
              </div>
            </div>
            <span class="shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${badgeColor} border">${task.priority}</span>
          </li>
        `;
      }).join('');
    }

    bindTaskCardActions(dashboardTaskList);
  }
}

/**
 * Setup listeners on dashboard.html.
 */
function setupDashboardListeners() {
  const createButtons = document.querySelectorAll('button:contains("Create Task"), button:contains("New Task"), button:has(span[data-icon="add_task"])');
  createButtons.forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      openTaskModal();
    };
  });
}

/**
 * Bind interactive checkbox toggles, edit buttons, and delete buttons.
 * @param {HTMLElement} container
 */
function bindTaskCardActions(container) {
  if (!container) return;

  const checkboxes = container.querySelectorAll('.task-checkbox-input');
  checkboxes.forEach(cb => {
    cb.onchange = (e) => {
      e.stopPropagation();
      const card = cb.closest('[data-id]');
      if (!card) return;
      const taskId = card.getAttribute('data-id');
      toggleTaskStatus(taskId);
    };
  });

  const editButtons = container.querySelectorAll('.btn-edit-task');
  editButtons.forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const card = btn.closest('[data-id]');
      if (!card) return;
      const taskId = card.getAttribute('data-id');
      const task = getTasks().find(t => t.id === taskId);
      if (task) openTaskModal(task);
    };
  });

  const deleteButtons = container.querySelectorAll('.btn-delete-task');
  deleteButtons.forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const card = btn.closest('[data-id]');
      if (!card) return;
      const taskId = card.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this task?')) {
        deleteTask(taskId);
      }
    };
  });
}

/**
 * Open dynamic Add/Edit Task modal dialog.
 * @param {Object} [taskToEdit=null]
 */
export function openTaskModal(taskToEdit = null) {
  let modal = document.getElementById('taskPilotTaskModal');

  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'taskPilotTaskModal';
    modal.className = 'modal-bg fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm';
    modal.setAttribute('aria-hidden', 'true');
    document.body.appendChild(modal);
  }

  const isEdit = Boolean(taskToEdit);
  const todayStr = new Date().toISOString().split('T')[0];

  modal.innerHTML = `
    <div class="modal-container bg-surface-container-lowest border border-outline-variant rounded-xl shadow-modal w-full max-w-lg p-6 relative flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
      <div class="flex items-center justify-between pb-3 border-b border-outline-variant">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-secondary">${isEdit ? 'edit_note' : 'add_task'}</span>
          <h2 class="font-headline-sm text-headline-sm font-bold text-primary">${isEdit ? 'Edit Task' : 'Create New Task'}</h2>
        </div>
        <button class="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors" id="btn-close-task-modal" aria-label="Close modal">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <form id="taskPilotTaskForm" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <label class="font-label-sm text-label-sm text-navy font-semibold" for="modal-task-title">Task Title *</label>
          <input class="input-field rounded h-[44px] px-3 font-body-md text-body-md border border-outline-variant w-full focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10" id="modal-task-title" placeholder="e.g. Complete quarterly financial review" required type="text" value="${isEdit ? escapeHTML(taskToEdit.title) : ''}"/>
        </div>

        <div class="flex flex-col gap-1">
          <label class="font-label-sm text-label-sm text-navy font-semibold" for="modal-task-desc">Description</label>
          <textarea class="input-field rounded p-3 font-body-sm text-body-sm border border-outline-variant w-full focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10" id="modal-task-desc" rows="3" placeholder="Add any details, sub-tasks, or notes...">${isEdit ? escapeHTML(taskToEdit.description || '') : ''}</textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label class="font-label-sm text-label-sm text-navy font-semibold" for="modal-task-priority">Priority</label>
            <select class="input-field rounded h-[44px] px-3 font-body-md text-body-md border border-outline-variant w-full focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10" id="modal-task-priority">
              <option value="High" ${isEdit && taskToEdit.priority === 'High' ? 'selected' : ''}>🔥 High</option>
              <option value="Medium" ${!isEdit || taskToEdit.priority === 'Medium' ? 'selected' : ''}>⚡ Medium</option>
              <option value="Low" ${isEdit && taskToEdit.priority === 'Low' ? 'selected' : ''}>🌱 Low</option>
            </select>
          </div>

          <div class="flex flex-col gap-1">
            <label class="font-label-sm text-label-sm text-navy font-semibold" for="modal-task-category">Category</label>
            <select class="input-field rounded h-[44px] px-3 font-body-md text-body-md border border-outline-variant w-full focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10" id="modal-task-category">
              <option value="Work" ${isEdit && taskToEdit.category === 'Work' ? 'selected' : ''}>💼 Work</option>
              <option value="Project" ${!isEdit || taskToEdit.category === 'Project' ? 'selected' : ''}>📁 Project</option>
              <option value="Study" ${isEdit && taskToEdit.category === 'Study' ? 'selected' : ''}>🎓 Study</option>
              <option value="Personal" ${isEdit && taskToEdit.category === 'Personal' ? 'selected' : ''}>👤 Personal</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label class="font-label-sm text-label-sm text-navy font-semibold" for="modal-task-date">Due Date</label>
            <input class="input-field rounded h-[44px] px-3 font-body-md text-body-md border border-outline-variant w-full focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10" id="modal-task-date" type="date" value="${isEdit ? taskToEdit.dueDate : todayStr}"/>
          </div>

          <div class="flex flex-col gap-1">
            <label class="font-label-sm text-label-sm text-navy font-semibold" for="modal-task-time">Due Time</label>
            <input class="input-field rounded h-[44px] px-3 font-body-md text-body-md border border-outline-variant w-full focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10" id="modal-task-time" type="time" value="${isEdit && taskToEdit.dueTime ? taskToEdit.dueTime : '17:00'}"/>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant mt-2">
          <button type="button" class="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-md text-label-md" id="btn-cancel-task-modal">Cancel</button>
          <button type="submit" class="px-5 py-2 rounded-lg bg-secondary text-on-secondary hover:bg-secondary/90 transition-colors font-label-md text-label-md flex items-center gap-1 shadow-sm">
            <span class="material-symbols-outlined text-[18px]">check</span>
            ${isEdit ? 'Update Task' : 'Save Task'}
          </button>
        </div>
      </form>
    </div>
  `;

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  const closeBtn = modal.querySelector('#btn-close-task-modal');
  const cancelBtn = modal.querySelector('#btn-cancel-task-modal');
  const form = modal.querySelector('#taskPilotTaskForm');

  function closeModal() {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (closeBtn) closeBtn.onclick = closeModal;
  if (cancelBtn) cancelBtn.onclick = closeModal;

  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };

  form.onsubmit = (e) => {
    e.preventDefault();
    const titleInput = document.getElementById('modal-task-title');
    const descInput = document.getElementById('modal-task-desc');
    const prioritySelect = document.getElementById('modal-task-priority');
    const categorySelect = document.getElementById('modal-task-category');
    const dateInput = document.getElementById('modal-task-date');
    const timeInput = document.getElementById('modal-task-time');

    if (!titleInput.value.trim()) {
      titleInput.focus();
      return;
    }

    const payload = {
      title: titleInput.value.trim(),
      description: descInput.value.trim(),
      priority: prioritySelect.value,
      category: categorySelect.value,
      dueDate: dateInput.value,
      dueTime: timeInput.value
    };

    if (isEdit) {
      updateTask(taskToEdit.id, payload);
    } else {
      createTask(payload);
    }

    closeModal();
  };

  const titleField = document.getElementById('modal-task-title');
  if (titleField) setTimeout(() => titleField.focus(), 100);
}

/**
 * Re-render tasks and statistics on whichever page is currently loaded.
 */
export function refreshCurrentPageTasks() {
  renderTasksPage();
  renderDashboardTasks();
}

/**
 * Initialize task management across the active application page.
 */
export function initTaskManagement() {
  initTasksPage();
  initDashboardTasks();
}

// Expose on window for inline scripts and templates
if (typeof window !== 'undefined') {
  window.TaskPilotTasks = {
    getTasks,
    saveTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    calculateTaskStatistics,
    searchTasks,
    filterTasks,
    openTaskModal,
    initTaskManagement
  };
}
