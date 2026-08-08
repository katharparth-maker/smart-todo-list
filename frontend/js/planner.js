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

import { getTasks, saveTasks, toggleTaskStatus, openTaskModal } from './tasks.js';
import { showToast } from './ui.js';

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
  const monthYearHeaders = document.querySelectorAll('#calendar-month-year, .mini-calendar-header, main h3:contains("2026")');
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

/**
 * Wire calendar navigation and date buttons across the document.
 * @param {HTMLElement|Document} [root=document]
 */
export function setupPlannerListeners(root = document) {
  // 1. Previous Month Buttons
  const prevButtons = root.querySelectorAll(
    'button[aria-label="Previous month"], button[onclick*="prevMonth"], main button:has(span:contains("chevron_left"))'
  );
  prevButtons.forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      prevMonth();
    };
  });

  // 2. Next Month Buttons
  const nextButtons = root.querySelectorAll(
    'button[aria-label="Next month"], button[onclick*="nextMonth"], main button:has(span:contains("chevron_right"))'
  );
  nextButtons.forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      nextMonth();
    };
  });

  // 3. Today Buttons
  const todayButtons = root.querySelectorAll(
    'button[aria-label="Today"], button[onclick*="goToToday"], button:contains("Today")'
  );
  todayButtons.forEach(btn => {
    if (btn.textContent.trim().toLowerCase() === 'today') {
      btn.onclick = (e) => {
        e.preventDefault();
        goToToday();
      };
    }
  });

  // 4. Add Schedule Button on planner.html
  const addScheduleButtons = root.querySelectorAll('button:contains("Add Schedule"), button:contains("Create Task")');
  addScheduleButtons.forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      openTaskModal({
        dueDate: formatDateKey(selectedDate),
        dueTime: '10:00'
      });
    };
  });
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
