/**
 * TaskPilotAI – Smart Planner & Interactive Calendar Module
 * File: frontend/js/planner.js
 *
 * Responsibilities:
 *   - Interactive monthly calendar navigation (Previous Month, Next Month, Today)
 *   - Date selection and synchronization with daily timeline view
 *   - Render visual task dots on dates with scheduled tasks
 *   - Display task list & hourly timeline events for the selected date
 *   - Shared task data source: localStorage key 'taskpilot_tasks'
 *   - Full support for both components/calendar.html and pages/planner.html
 */

import { getTasks, saveTasks, toggleTaskStatus, openTaskModal, createTask } from './tasks.js';
import { showToast, loadAndRenderApiReminders } from './ui.js';
import { createReminderViaAPI } from './api.js';


const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

// Active State
let currentViewDate = new Date();
let selectedDate = new Date();

/**
 * Format a Date object into YYYY-MM-DD string.
 * @param {Date} date
 * @returns {string}
 */
export function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get all tasks scheduled for a specific date (YYYY-MM-DD).
 * @param {string} dateKey - 'YYYY-MM-DD'
 * @returns {Array<Object>}
 */
export function getTasksForDate(dateKey) {
  const allTasks = getTasks();
  return allTasks.filter(t => t.dueDate === dateKey);
}

/**
 * Check if a date has any tasks scheduled.
 * @param {string} dateKey
 * @returns {boolean}
 */
export function hasTasksOnDate(dateKey) {
  return getTasksForDate(dateKey).length > 0;
}

/**
 * Render the interactive 42-cell monthly calendar grid.
 * Works on both components/calendar.html (#calendar-grid) and planner.html mini-calendar.
 */
export function renderCalendar() {
  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();

  // 1. Update Month/Year Header Labels
  const monthYearHeaders = Array.from(document.querySelectorAll('#calendar-month-year, .mini-calendar-header, main h3')).filter(el => {
    return el.id === 'calendar-month-year' || el.classList.contains('mini-calendar-header') || el.textContent.includes('2026');
  });
  monthYearHeaders.forEach(el => {
    el.textContent = `${MONTH_NAMES[month]} ${year}`;
  });

  const calendarGrid = document.getElementById('calendar-grid');
  const miniGrid = document.querySelector('main .grid.grid-cols-7.gap-1.text-center.font-body-sm');

  const targetGrids = [calendarGrid, miniGrid].filter(Boolean);

  if (targetGrids.length === 0) return;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  // Determine starting weekday (0 = Monday in ISO/European calendar convention used in TaskPilot)
  let startDayOfWeek = firstDay.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday becomes index 6

  const realToday = new Date();
  const realTodayKey = formatDateKey(realToday);
  const selectedKey = formatDateKey(selectedDate);

  targetGrids.forEach(grid => {
    grid.innerHTML = '';

    // A. Days from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const cellDate = new Date(year, month - 1, dayNum);
      grid.appendChild(createDateCell(cellDate, true, realTodayKey, selectedKey));
    }

    // B. Days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const cellDate = new Date(year, month, i);
      grid.appendChild(createDateCell(cellDate, false, realTodayKey, selectedKey));
    }

    // C. Days of next month to complete 42 cells (6 full rows)
    let nextMonthDay = 1;
    while (grid.children.length < 42) {
      const cellDate = new Date(year, month + 1, nextMonthDay++);
      grid.appendChild(createDateCell(cellDate, true, realTodayKey, selectedKey));
    }
  });

  // Synchronize the selected date view (task list & timeline)
  updateSelectedDateView();
}

/**
 * Generate a single interactive date cell button for the calendar grid.
 * @param {Date} dateObj
 * @param {boolean} isMuted - If the date belongs to prev/next month
 * @param {string} realTodayKey
 * @param {string} selectedKey
 * @returns {HTMLButtonElement}
 */
function createDateCell(dateObj, isMuted, realTodayKey, selectedKey) {
  const dateKey = formatDateKey(dateObj);
  const isToday = dateKey === realTodayKey;
  const isSelected = dateKey === selectedKey;
  const tasks = getTasksForDate(dateKey);
  const hasTasks = tasks.length > 0;

  const btn = document.createElement('button');
  btn.className = 'w-9 h-9 md:w-10 md:h-10 rounded-full flex flex-col items-center justify-center mx-auto relative transition-all focus:outline-none focus:ring-2 focus:ring-tp-forest focus:ring-offset-1 font-body-sm text-body-sm';
  btn.setAttribute('role', 'gridcell');
  btn.setAttribute('aria-label', dateKey);
  btn.setAttribute('data-date', dateKey);

  if (isMuted) {
    btn.classList.add('text-tp-gray-muted', 'opacity-40', 'hover:bg-gray-50');
  } else {
    btn.classList.add('text-tp-navy', 'hover:bg-gray-100');
  }

  // Today indicator (Border accent)
  if (isToday && !isSelected) {
    btn.classList.add('border', 'border-tp-forest', 'text-tp-forest', 'font-bold');
  }

  // Selected state
  if (isSelected) {
    btn.classList.add('bg-tp-forest', '!bg-[#166534]', 'text-white', '!text-white', 'font-bold', 'shadow-sm');
    btn.classList.remove('text-tp-navy', 'text-tp-gray-muted', 'hover:bg-gray-100', 'hover:bg-gray-50', 'opacity-40');
    btn.setAttribute('aria-selected', 'true');
  } else {
    btn.setAttribute('aria-selected', 'false');
  }

  const daySpan = document.createElement('span');
  daySpan.textContent = dateObj.getDate();
  btn.appendChild(daySpan);

  // Task Indicator Dot on Due Dates
  if (hasTasks) {
    const dot = document.createElement('span');
    dot.className = `w-1.5 h-1.5 rounded-full absolute bottom-1 ${isSelected ? 'bg-white' : 'bg-tp-forest bg-[#166534]'}`;
    btn.appendChild(dot);
  }

  btn.onclick = (e) => {
    e.preventDefault();
    selectDate(dateObj, isMuted);
  };

  return btn;
}

/**
 * Handle date selection and update view.
 * @param {Date} dateObj
 * @param {boolean} [isMuted=false]
 */
export function selectDate(dateObj, isMuted = false) {
  selectedDate = new Date(dateObj);

  // If selecting a muted date from another month, navigate to that month
  if (isMuted) {
    currentViewDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
  }

  renderCalendar();
}

/**
 * Navigate to the previous month.
 */
export function prevMonth() {
  currentViewDate.setMonth(currentViewDate.getMonth() - 1);
  renderCalendar();
}

/**
 * Navigate to the next month.
 */
export function nextMonth() {
  currentViewDate.setMonth(currentViewDate.getMonth() + 1);
  renderCalendar();
}

/**
 * Reset calendar view and selection to Today.
 */
export function goToToday() {
  const now = new Date();
  currentViewDate = new Date(now.getFullYear(), now.getMonth(), 1);
  selectedDate = new Date(now);
  renderCalendar();
}

/**
 * Synchronize the selected date display, task list, and timeline grid.
 */
export function updateSelectedDateView() {
  if (!selectedDate) return;

  const dateKey = formatDateKey(selectedDate);
  const dayName = DAY_NAMES[selectedDate.getDay()];
  const monthName = MONTH_NAMES[selectedDate.getMonth()];
  const dayNum = selectedDate.getDate();

  const formattedDateStr = `${dayName}, ${monthName} ${dayNum}`;

  // 1. Update Date Display Headers
  const dateDisplays = document.querySelectorAll(
    '#selected-date-display, main .flex.items-center.gap-xs.ml-sm.font-label-md.text-primary, #planner-selected-date'
  );
  dateDisplays.forEach(el => {
    // Preserve any leading icon
    const icon = el.querySelector('.material-symbols-outlined');
    if (icon) {
      el.innerHTML = '';
      el.appendChild(icon);
      el.appendChild(document.createTextNode(` ${formattedDateStr}`));
    } else {
      el.textContent = formattedDateStr;
    }
  });

  const tasksForSelectedDate = getTasksForDate(dateKey);

  // 2. Update Calendar Component Bottom Area (calendar.html)
  updateCalendarComponentTaskList(tasksForSelectedDate, formattedDateStr);

  // 3. Update Timeline Grid on planner.html
  updatePlannerTimeline(tasksForSelectedDate);
}

/**
 * Render task items inside components/calendar.html task list.
 * @param {Array<Object>} tasks
 * @param {string} formattedDateStr
 */
function updateCalendarComponentTaskList(tasks, formattedDateStr) {
  const badge = document.getElementById('task-count-badge');
  const taskList = document.getElementById('task-list');
  const emptyState = document.getElementById('empty-state');

  if (!taskList) return;

  taskList.innerHTML = '';

  if (tasks.length > 0) {
    if (badge) {
      badge.textContent = `${tasks.length} Task${tasks.length > 1 ? 's' : ''}`;
      badge.classList.remove('hidden');
    }
    if (emptyState) emptyState.classList.add('hidden');
    taskList.classList.remove('hidden');

    tasks.forEach(task => {
      const isCompleted = task.status === 'completed';
      const taskEl = document.createElement('div');
      taskEl.className = 'flex items-center justify-between p-2 rounded bg-white border border-tp-gray-border shadow-sm hover:bg-gray-50 transition-colors';
      taskEl.innerHTML = `
        <div class="flex flex-col min-w-0 pr-2">
          <span class="font-label-sm text-label-sm text-on-surface-variant text-[11px]">${task.dueTime || 'All Day'} • ${escapeHTML(task.category || 'General')}</span>
          <span class="font-body-sm text-body-sm text-tp-navy font-medium truncate ${isCompleted ? 'line-through text-on-surface-variant' : ''}">${escapeHTML(task.title)}</span>
        </div>
        <button class="text-tp-gray-muted hover:text-tp-forest transition-colors p-1" aria-label="Toggle task status" data-id="${task.id}">
          <span class="material-symbols-outlined text-[20px] ${isCompleted ? 'text-tp-forest' : ''}">
            ${isCompleted ? 'check_circle' : 'radio_button_unchecked'}
          </span>
        </button>
      `;

      const checkBtn = taskEl.querySelector('button');
      if (checkBtn) {
        checkBtn.onclick = (e) => {
          e.preventDefault();
          toggleTaskStatus(task.id);
          renderCalendar();
        };
      }

      taskList.appendChild(taskEl);
    });
  } else {
    if (badge) badge.classList.add('hidden');
    taskList.classList.add('hidden');
    if (emptyState) emptyState.classList.remove('hidden');
  }
}

/**
 * Render real tasks onto the hourly timeline grid on planner.html.
 * @param {Array<Object>} tasks
 */
function updatePlannerTimeline(tasks) {
  const timelineHours = document.querySelectorAll('.timeline-grid .timeline-hour');
  if (timelineHours.length === 0) return;

  // Clear existing dynamically injected events from timeline cells (keep static hour lines)
  timelineHours.forEach(hourDiv => {
    const existingEvents = hourDiv.querySelectorAll('.timeline-event');
    existingEvents.forEach(ev => ev.remove());
  });

  // Hour tracks mapping: 08 AM to 06 PM
  // Index 0 = 08 AM, Index 1 = 09 AM, Index 2 = 10 AM, ..., Index 10 = 06 PM
  const hourMap = {
    '08': 0, '09': 1, '10': 2, '11': 3, '12': 4,
    '13': 5, '14': 6, '15': 7, '16': 8, '17': 9, '18': 10
  };

  tasks.forEach(task => {
    let hourKey = '09';
    if (task.dueTime) {
      hourKey = task.dueTime.split(':')[0].padStart(2, '0');
    }

    const hourIndex = hourMap[hourKey] !== undefined ? hourMap[hourKey] : 1;
    const targetHourCell = timelineHours[hourIndex] || timelineHours[1];

    if (targetHourCell) {
      const priorityBorderColors = {
        High: '#EF4444',
        Medium: '#FBBF24',
        Low: '#166534'
      };
      const borderColor = priorityBorderColors[task.priority] || '#166534';

      const eventEl = document.createElement('div');
      eventEl.className = 'timeline-event top-2 h-[50px] cursor-pointer hover:shadow-level-2 transition-all group';
      eventEl.style.borderLeftColor = borderColor;
      eventEl.setAttribute('data-id', task.id);

      eventEl.innerHTML = `
        <div class="flex justify-between items-start">
          <div class="font-label-md text-primary truncate font-bold group-hover:text-secondary transition-colors ${task.status === 'completed' ? 'line-through opacity-70' : ''}">${escapeHTML(task.title)}</div>
          <div class="flex gap-1 items-center">
            <span class="w-2 h-2 rounded-full" style="background-color: ${borderColor};"></span>
          </div>
        </div>
        <div class="flex justify-between items-center mt-1 text-xs text-on-surface-variant">
          <span>${task.dueTime || '10:00'} - ${getEndTime(task.dueTime || '10:00')}</span>
          <span class="bg-surface-container px-1.5 py-0.5 rounded text-[10px] font-medium">${escapeHTML(task.category || 'General')}</span>
        </div>
      `;

      eventEl.onclick = (e) => {
        e.preventDefault();
        openTaskModal(task);
      };

      targetHourCell.appendChild(eventEl);
    }
  });
}

/**
 * Calculate simple 1-hour end time for timeline display.
 * @param {string} start
 * @returns {string}
 */
function getEndTime(start) {
  const parts = start.split(':');
  let h = parseInt(parts[0], 10);
  const m = parts[1] || '00';
  h = (h + 1) % 24;
  return `${String(h).padStart(2, '0')}:${m}`;
}

function getSuggestedPlanItems() {
  return [
    { title: 'Read documentation', dueTime: '10:00', category: 'Study', priority: 'Medium' },
    { title: 'Lunch & Walk', dueTime: '13:00', category: 'Personal', priority: 'Low' },
    { title: 'Email triage', dueTime: '15:00', category: 'Work', priority: 'Medium' }
  ];
}

export function applySuggestedPlan() {
  const suggestions = getSuggestedPlanItems();
  const baseDate = formatDateKey(selectedDate || new Date());
  const existingTasks = getTasks();
  let createdCount = 0;

  suggestions.forEach(item => {
    const exists = existingTasks.some(task =>
      task.title === item.title &&
      task.dueDate === baseDate &&
      task.dueTime === item.dueTime
    );

    if (!exists) {
      createTask({
        title: item.title,
        category: item.category,
        priority: item.priority,
        dueDate: baseDate,
        dueTime: item.dueTime,
        isAiSuggested: true
      });
      createdCount += 1;
    }
  });

  if (createdCount > 0) {
    showToast(`Applied suggested plan with ${createdCount} task${createdCount > 1 ? 's' : ''}.`, 'success');
    renderCalendar();
  } else {
    showToast('Suggested plan is already in your tasks.', 'info');
  }
}

export function startFocusSession() {
  const todayKey = formatDateKey(selectedDate || new Date());
  const tasks = getTasksForDate(todayKey).filter(task => task.status !== 'completed');

  if (tasks.length === 0) {
    showToast('No pending focus task found for today.', 'warning');
    return;
  }

  const priorityOrder = { High: 3, Medium: 2, Low: 1 };
  tasks.sort((a, b) => {
    const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    if (priorityDiff !== 0) return priorityDiff;
    return (a.dueTime || '').localeCompare(b.dueTime || '');
  });

  const focusTask = tasks[0];
  showToast(`Focus started on “${focusTask.title}”.`, 'success', 5000);
}

/**
 * Safe HTML string escaper.
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

function upsertReminderTaskLocally(reminder) {
  const task = reminder?.task;
  if (!task || !task.id) return;

  const tasks = getTasks();
  const priority = task.priority
    ? String(task.priority).charAt(0).toUpperCase() + String(task.priority).slice(1)
    : 'Medium';
  const frontendTask = {
    id: String(task.id),
    title: task.title || reminder.message || 'Task Reminder',
    description: task.description || '',
    priority,
    category: task.category || 'General',
    dueDate: task.due_date ? String(task.due_date).split('T')[0] : '',
    dueTime: task.due_time || '',
    status: task.status || 'pending',
    createdAt: task.created_at || new Date().toISOString()
  };

  const existingIndex = tasks.findIndex(t => String(t.id) === frontendTask.id);
  if (existingIndex >= 0) {
    tasks[existingIndex] = { ...tasks[existingIndex], ...frontendTask };
  } else {
    tasks.unshift(frontendTask);
  }
  saveTasks(tasks);
}

/**
 * Wire calendar navigation and date buttons across the document.
 * @param {HTMLElement|Document} [root=document]
 */
export function setupPlannerListeners(root = document) {
  // 1. Previous Month Buttons
  const prevButtons = Array.from(root.querySelectorAll(
    'button[aria-label="Previous month"], button[onclick*="prevMonth"], main button'
  )).filter(btn => {
    if (btn.getAttribute('aria-label') === 'Previous month') return true;
    if (btn.getAttribute('onclick')?.includes('prevMonth')) return true;
    const span = btn.querySelector('span');
    return span && span.textContent.trim().includes('chevron_left');
  });
  prevButtons.forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      prevMonth();
    };
  });

  // 2. Next Month Buttons
  const nextButtons = Array.from(root.querySelectorAll(
    'button[aria-label="Next month"], button[onclick*="nextMonth"], main button'
  )).filter(btn => {
    if (btn.getAttribute('aria-label') === 'Next month') return true;
    if (btn.getAttribute('onclick')?.includes('nextMonth')) return true;
    const span = btn.querySelector('span');
    return span && span.textContent.trim().includes('chevron_right');
  });
  nextButtons.forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      nextMonth();
    };
  });

  // 3. Today Buttons
  const todayButtons = Array.from(root.querySelectorAll(
    'button[aria-label="Today"], button[onclick*="goToToday"], button'
  )).filter(btn => {
    if (btn.getAttribute('aria-label') === 'Today') return true;
    if (btn.getAttribute('onclick')?.includes('goToToday')) return true;
    return btn.textContent.trim().toLowerCase() === 'today';
  });
  todayButtons.forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      goToToday();
    };
  });

  // 4. Add Schedule Button on planner.html
  const addScheduleButtons = Array.from(root.querySelectorAll('button')).filter(btn => {
    const text = btn.textContent.trim();
    return text.includes('Add Schedule');
  });
  addScheduleButtons.forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      const modal = document.getElementById('addScheduleModal');
      if (modal) {
        const dateInput = document.getElementById('schedule-date');
        if (dateInput && !dateInput.value) {
          dateInput.value = formatDateKey(selectedDate || new Date());
        }
        modal.classList.remove('hidden');
      }
    };
  });

  // 5. Apply Suggested Plan Button
  const applySuggestedBtn = root.querySelector('#btn-apply-suggested-plan') || Array.from(root.querySelectorAll('button')).find(btn => btn.textContent.trim().includes('Apply Suggested Plan'));
  if (applySuggestedBtn) {
    applySuggestedBtn.onclick = (e) => {
      e.preventDefault();
      applySuggestedPlan();
    };
  }

  // 6. Start Focus Button
  const startFocusBtn = root.querySelector('#btn-start-focus') || Array.from(root.querySelectorAll('button')).find(btn => btn.textContent.trim().includes('Start Focus'));
  if (startFocusBtn) {
    startFocusBtn.onclick = (e) => {
      e.preventDefault();
      startFocusSession();
    };
  }
}

/**
 * Bind submission handler for addScheduleModal (creates a real reminder via API).
 */
export function initAddScheduleForm() {
  const form = document.getElementById('addScheduleForm');
  if (!form) {
    console.warn('[TaskPilot Planner] #addScheduleForm not found in DOM');
    return;
  }

  console.log('[TaskPilot Planner] Initialized #addScheduleForm submit listener');

  form.onsubmit = async (e) => {
    e.preventDefault();
    console.log('[TaskPilot Planner] #addScheduleForm submit event fired');

    const titleInput = document.getElementById('schedule-title');
    const dateInput = document.getElementById('schedule-date');
    const timeInput = document.getElementById('schedule-time');
    const categoryInput = document.getElementById('schedule-category');
    const priorityInput = form.querySelector('input[name="priority"]:checked');
    const submitBtn = document.getElementById('btn-save-schedule') || form.querySelector('button[type="submit"]');

    console.log('[TaskPilot Planner] Input values:', {
      title: titleInput?.value,
      date: dateInput?.value,
      time: timeInput?.value
    });

    if (!titleInput || !titleInput.value.trim()) {
      if (titleInput) titleInput.focus();
      return;
    }

    const originalBtnHTML = submitBtn ? submitBtn.innerHTML : 'Save';
    const prevError = form.querySelector('#schedule-modal-error');
    if (prevError) prevError.remove();

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
        Saving...
      `;
    }

    try {
      const dateVal = (dateInput && dateInput.value) ? dateInput.value : formatDateKey(selectedDate || new Date());
      const timeVal = (timeInput && timeInput.value) ? timeInput.value : '09:00';
      const selectedPriority = (priorityInput?.value || 'Normal').toLowerCase();

      const reminderPayload = {
        title: titleInput.value.trim(),
        due_date: dateVal,
        due_time: timeVal,
        category: categoryInput?.value || 'General',
        priority: selectedPriority === 'high' ? 'high' : 'medium',
        status: 'pending'
      };

      console.log('[TaskPilot Planner] Calling createReminderViaAPI with payload:', reminderPayload);

      const created = await createReminderViaAPI(reminderPayload);
      console.log('[TaskPilot Planner] createReminderViaAPI success:', created);
      upsertReminderTaskLocally(created);
      renderCalendar();

      showToast('Reminder created successfully! 🎉', 'success');

      // Reset form and close modal
      form.reset();
      const modal = document.getElementById('addScheduleModal');
      if (modal) modal.classList.add('hidden');

      // Refresh reminders list in the UI
      await loadAndRenderApiReminders();
    } catch (err) {
      console.error('[TaskPilot Planner] Reminder creation failed:', err);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHTML;
      }
      const errorBanner = document.createElement('div');
      errorBanner.id = 'schedule-modal-error';
      errorBanner.className = 'p-3 rounded-lg bg-error-container border border-error/30 text-on-error-container font-body-sm text-body-sm flex items-center gap-2';
      errorBanner.innerHTML = `
        <span class="material-symbols-outlined text-error text-[18px] shrink-0">error</span>
        <span>${escapeHTML(err.message || 'Failed to create reminder. Please try again.')}</span>
      `;
      form.insertBefore(errorBanner, form.querySelector('.border-t') || form.lastElementChild);
    }
  };
}



/**
 * Initialize the Planner & Calendar module on page load.
 */
export function initPlanner() {
  const isPlanner = window.location.pathname.includes('planner.html');
  const hasCalendar = Boolean(document.getElementById('calendar-grid') || document.querySelector('.timeline-grid'));

  if (isPlanner || hasCalendar) {
    renderCalendar();
    setupPlannerListeners(document);
    initAddScheduleForm();
  }
}


// Auto-bootstrap when loaded as a module in the browser
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initPlanner());
  } else {
    initPlanner();
  }
}

// Expose on window for inline handlers in calendar.html and planner.html
if (typeof window !== 'undefined') {
  window.prevMonth = prevMonth;
  window.nextMonth = nextMonth;
  window.goToToday = goToToday;
  window.selectDate = selectDate;
  window.renderCalendar = renderCalendar;
  window.TaskPilotPlanner = {
    renderCalendar,
    selectDate,
    prevMonth,
    nextMonth,
    goToToday,
    getTasksForDate,
    initPlanner
  };
}
