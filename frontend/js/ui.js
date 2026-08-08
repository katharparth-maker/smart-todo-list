/**
 * TaskPilotAI – Reusable UI & Component Injection Engine
 * File: frontend/js/ui.js
 *
 * Responsibilities:
 *   - Connect search-bar.html and header search inputs to the task system
 *   - Search across task title, description, category, and priority
 *   - Auto-resolve navigation links (Dashboard, Tasks, Planner, Profile, Logout)
 *   - Automatically highlight the active route based on current URL
 *   - Fully manage mobile sidebar drawer opening/closing and dynamic overlay
 *   - Fully functional Notification Panel (open/close, mark single/all read, unread count, click-outside, Escape)
 *   - Dynamic component loading, modal dialogs, and non-crashing error handling
 */

import { getTasks, openTaskModal } from './tasks.js';

// In-memory cache for fetched component HTML strings
const componentCache = new Map();

// LocalStorage key for persisted notification state
export const NOTIFS_STORAGE_KEY = 'taskpilot_notifications';

/**
 * Default notification items to seed the notification system.
 */
const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Task deadline approaching',
    message: 'Project documentation is due today at 4:00 PM.',
    time: '10 minutes ago',
    unread: true,
    icon: 'notifications'
  },
  {
    id: 'notif-2',
    title: 'Task completed',
    message: 'Great! You completed your Python assignment.',
    time: '1 hour ago',
    unread: false,
    icon: 'check_circle'
  },
  {
    id: 'notif-3',
    title: 'AI recommendation',
    message: 'TaskPilot AI has a new productivity suggestion for you.',
    time: '2 hours ago',
    unread: true,
    icon: 'auto_awesome'
  },
  {
    id: 'notif-4',
    title: 'Weekly productivity summary',
    message: 'Your weekly productivity score is 87%.',
    time: 'Yesterday',
    unread: false,
    icon: 'schedule'
  }
];

/**
 * Get all notifications from localStorage.
 * @returns {Array<Object>}
 */
export function getNotifications() {
  try {
    const raw = localStorage.getItem(NOTIFS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(NOTIFS_STORAGE_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
      return [...DEFAULT_NOTIFICATIONS];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('[TaskPilot UI] Failed to load notifications:', err);
    return [...DEFAULT_NOTIFICATIONS];
  }
}

/**
 * Save notifications array to localStorage.
 * @param {Array<Object>} notifs
 */
export function saveNotifications(notifs) {
  try {
    localStorage.setItem(NOTIFS_STORAGE_KEY, JSON.stringify(notifs));
  } catch (err) {
    console.error('[TaskPilot UI] Failed to save notifications:', err);
  }
}

/**
 * Mark a single notification as read by ID.
 * @param {string} id
 */
export function markNotificationAsRead(id) {
  const notifs = getNotifications();
  const item = notifs.find(n => n.id === id);
  if (item && item.unread) {
    item.unread = false;
    saveNotifications(notifs);
    refreshAllNotificationPanels();
  }
}

/**
 * Mark all notifications as read.
 */
export function markAllNotificationsAsRead() {
  const notifs = getNotifications();
  let changed = false;
  notifs.forEach(n => {
    if (n.unread) {
      n.unread = false;
      changed = true;
    }
  });

  if (changed) {
    saveNotifications(notifs);
    refreshAllNotificationPanels();
    showToast('All notifications marked as read', 'success');
  }
}

/**
 * Refresh unread counts, badges, and list items across any notification panels in the DOM.
 */
export function refreshAllNotificationPanels() {
  const notifs = getNotifications();
  const unreadCount = notifs.filter(n => n.unread).length;

  const badges = document.querySelectorAll(
    '#unread-badge, button[aria-label*="Notification"] span.bg-error, button:has(span[data-icon="notifications"]) span.bg-error, .notif-badge'
  );

  badges.forEach(badge => {
    if (unreadCount === 0) {
      badge.classList.add('hidden');
      badge.style.display = 'none';
    } else {
      badge.classList.remove('hidden');
      badge.style.display = '';
    }
  });

  const triggers = document.querySelectorAll(
    '#notif-trigger, button[aria-label*="Notification"], button:has(span[data-icon="notifications"])'
  );
  triggers.forEach(btn => {
    btn.setAttribute('aria-label', `Notifications, ${unreadCount} unread`);
  });

  const lists = document.querySelectorAll('#notif-list');
  lists.forEach(listContainer => {
    renderNotificationListHTML(listContainer, notifs);
  });
}

/**
 * Render notification items inside a container element.
 * @param {HTMLElement} listContainer
 * @param {Array<Object>} notifs
 */
function renderNotificationListHTML(listContainer, notifs) {
  if (!listContainer) return;

  if (notifs.length === 0) {
    listContainer.innerHTML = `
      <div class="p-6 text-center text-secondary font-body-sm">
        <span class="material-symbols-outlined text-[32px] text-outline mb-1 block">notifications_paused</span>
        You're all caught up!
      </div>
    `;
    return;
  }

  listContainer.innerHTML = notifs.map(n => `
    <div class="notif-item ${n.unread ? 'unread bg-off-white-bg bg-[#F7F7F2]' : 'bg-[#FFFFFF]'} p-4 border-b border-gray-border hover:bg-gray-50 transition-colors cursor-pointer group relative flex gap-3" role="menuitem" tabindex="0" data-id="${n.id}">
      <div class="flex-shrink-0 mt-0.5">
        <span class="material-symbols-outlined ${n.unread ? 'text-primary-container text-[#172033]' : 'text-forest-green text-[#166534]'}">${n.icon || 'notifications'}</span>
      </div>
      <div class="flex-grow pr-4 min-w-0">
        <p class="${n.unread ? 'font-label-md text-label-md text-primary-container font-bold' : 'font-body-sm text-body-sm text-primary font-medium'} mb-1">${escapeHTML(n.title)}</p>
        <p class="font-body-sm text-body-sm text-secondary-gray text-[#64748B] mb-1 line-clamp-2">${escapeHTML(n.message)}</p>
        <p class="font-label-sm text-label-sm text-secondary-gray text-[#64748B] opacity-70 text-[11px]">${escapeHTML(n.time)}</p>
      </div>
      ${n.unread ? '<div class="absolute top-4 right-4 w-2 h-2 bg-forest-green bg-[#166534] rounded-full unread-dot"></div>' : ''}
    </div>
  `).join('');

  const itemEls = listContainer.querySelectorAll('.notif-item');
  itemEls.forEach(item => {
    item.onclick = (e) => {
      e.stopPropagation();
      const notifId = item.getAttribute('data-id');
      markNotificationAsRead(notifId);
    };
  });
}

/**
 * Connect the search bar component and header search inputs to the task system.
 * Searches across: title, description, category, priority.
 * Displays matching task results or "No tasks found."
 * @param {HTMLElement|Document} [root=document]
 */
export function initSearchBarEvents(root = document) {
  const searchInputs = root.querySelectorAll(
    '#task-search-input, input[type="search"], #search-component input, header input[placeholder*="Search"]'
  );

  searchInputs.forEach(input => {
    // Avoid double attaching on tasks.html filter input handled in tasks.js
    if (window.location.pathname.includes('tasks.html') && input.closest('.md\\:w-48, .flex-1')) {
      return;
    }

    const searchComponent = input.closest('#search-component') || input.parentElement;
    let dropdown = searchComponent?.querySelector('#search-results-dropdown');
    let resultsListbox = searchComponent?.querySelector('#search-results-listbox');
    let noResultsMsg = searchComponent?.querySelector('#no-results-msg');
    let clearBtn = searchComponent?.querySelector('#clear-search-btn');

    // Create dynamic dropdown container if not present in the DOM for header search bars
    if (!dropdown && searchComponent) {
      if (!searchComponent.classList.contains('relative')) {
        searchComponent.classList.add('relative');
      }

      dropdown = document.createElement('div');
      dropdown.id = 'search-results-dropdown';
      dropdown.className = 'hidden absolute top-full left-0 right-0 mt-1.5 bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg shadow-dropdown z-50 overflow-hidden min-w-[320px] max-w-[440px]';
      dropdown.setAttribute('role', 'region');
      dropdown.setAttribute('aria-label', 'Search results');

      dropdown.innerHTML = `
        <ul class="max-h-[320px] overflow-y-auto py-1" id="search-results-listbox" role="listbox"></ul>
        <div class="hidden p-4 text-center text-[#64748B] font-body-sm" id="no-results-msg">
          <span class="material-symbols-outlined text-[24px] text-outline mb-1 block">search_off</span>
          No tasks found.
        </div>
      `;

      searchComponent.appendChild(dropdown);
      resultsListbox = dropdown.querySelector('#search-results-listbox');
      noResultsMsg = dropdown.querySelector('#no-results-msg');
    }

    let selectedIndex = -1;
    let currentResults = [];

    const renderResults = (query) => {
      if (!resultsListbox || !dropdown || !noResultsMsg) return;

      resultsListbox.innerHTML = '';
      selectedIndex = -1;

      const q = (query || '').trim().toLowerCase();
      if (!q) {
        dropdown.classList.add('hidden');
        return;
      }

      const allTasks = getTasks();
      currentResults = allTasks.filter(task => {
        const matchTitle = (task.title || '').toLowerCase().includes(q);
        const matchDesc = (task.description || '').toLowerCase().includes(q);
        const matchCategory = (task.category || '').toLowerCase().includes(q);
        const matchPriority = (task.priority || '').toLowerCase().includes(q);
        return matchTitle || matchDesc || matchCategory || matchPriority;
      });

      if (currentResults.length > 0) {
        dropdown.classList.remove('hidden');
        noResultsMsg.classList.add('hidden');
        resultsListbox.classList.remove('hidden');

        currentResults.forEach((task, index) => {
          const isCompleted = task.status === 'completed';
          const priorityBadges = {
            High: 'bg-[#FEE2E2] text-[#991B1B]',
            Medium: 'bg-[#FEF9C3] text-[#854D0E]',
            Low: 'bg-[#DCFCE7] text-[#166534]'
          };
          const badgeClass = priorityBadges[task.priority] || priorityBadges.Medium;

          const categoryIcons = {
            Study: 'school',
            Work: 'work',
            Personal: 'person',
            Project: 'folder',
            Projects: 'folder',
            Learning: 'code',
            College: 'menu_book'
          };
          const icon = categoryIcons[task.category] || 'task';

          const li = document.createElement('li');
          li.setAttribute('role', 'option');
          li.setAttribute('id', `result-option-${index}`);
          li.className = 'px-3 py-2.5 cursor-pointer flex items-center justify-between border-b border-[#E5E7EB] last:border-b-0 hover:bg-[#F7F7F2] transition-colors aria-selected:bg-[#F7F7F2]';

          li.innerHTML = `
            <div class="flex items-start gap-2.5 overflow-hidden min-w-0 pr-2">
              <span class="material-symbols-outlined text-[#64748B] text-body-lg mt-0.5" style="font-size: 18px;">${icon}</span>
              <div class="flex flex-col min-w-0">
                <span class="font-label-md text-on-surface font-bold truncate block ${isCompleted ? 'line-through text-[#64748B]' : ''}">${escapeHTML(task.title)}</span>
                <span class="font-body-sm text-[#64748B] text-xs flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span class="px-1.5 py-0.2 bg-[#F4F4EF] text-[#172033] rounded text-[10px] font-medium">${escapeHTML(task.category || 'General')}</span>
                  <span class="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${badgeClass}">${task.priority}</span>
                  ${task.dueDate ? `<span>• ${task.dueDate}</span>` : ''}
                </span>
              </div>
            </div>
            <div class="font-label-sm text-[#64748B] text-xs whitespace-nowrap pl-2">
              ${task.dueTime || ''}
            </div>
          `;

          li.addEventListener('click', () => {
            input.value = task.title;
            dropdown.classList.add('hidden');
            openTaskModal(task);
          });

          resultsListbox.appendChild(li);
        });
      } else {
        dropdown.classList.remove('hidden');
        resultsListbox.classList.add('hidden');
        noResultsMsg.classList.remove('hidden');
      }
    };

    // Input search typing listener
    input.addEventListener('input', (e) => {
      const val = e.target.value;
      if (clearBtn) {
        if (val) {
          clearBtn.classList.remove('hidden');
          clearBtn.classList.add('flex');
        } else {
          clearBtn.classList.add('hidden');
          clearBtn.classList.remove('flex');
        }
      }
      renderResults(val);
    });

    // Clear search button listener
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        input.value = '';
        input.focus();
        clearBtn.classList.add('hidden');
        clearBtn.classList.remove('flex');
        renderResults('');
      });
    }

    // Keyboard navigation
    input.addEventListener('keydown', (e) => {
      if (dropdown && dropdown.classList.contains('hidden')) return;
      if (currentResults.length === 0) return;

      const items = resultsListbox ? resultsListbox.querySelectorAll('li[role="option"]') : [];

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % currentResults.length;
        updateSelection(items, selectedIndex, input);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = selectedIndex <= 0 ? currentResults.length - 1 : selectedIndex - 1;
        updateSelection(items, selectedIndex, input);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < currentResults.length) {
          const task = currentResults[selectedIndex];
          input.value = task.title;
          dropdown.classList.add('hidden');
          openTaskModal(task);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (dropdown) dropdown.classList.add('hidden');
      }
    });

    // Focus listener
    input.addEventListener('focus', () => {
      if (input.value.trim()) {
        renderResults(input.value);
      }
    });
  });
}

/**
 * Update selection styling for keyboard navigation in search results listbox.
 * @param {NodeList} items
 * @param {number} index
 * @param {HTMLInputElement} input
 */
function updateSelection(items, index, input) {
  items.forEach((item, i) => {
    if (i === index) {
      item.setAttribute('aria-selected', 'true');
      item.classList.add('bg-[#F7F7F2]');
      item.scrollIntoView({ block: 'nearest' });
      input.setAttribute('aria-activedescendant', item.id);
    } else {
      item.setAttribute('aria-selected', 'false');
      item.classList.remove('bg-[#F7F7F2]');
    }
  });
}

/**
 * Determine the correct relative base path to the components directory.
 * @returns {string}
 */
export function getComponentBasePath() {
  const path = window.location.pathname.replace(/\\/g, '/');
  if (path.includes('/pages/')) {
    return '../components/';
  }
  return './components/';
}

/**
 * Determine the correct relative base path to the pages directory.
 * @returns {string}
 */
export function getPagesBasePath() {
  const path = window.location.pathname.replace(/\\/g, '/');
  if (path.includes('/pages/')) {
    return './';
  }
  return 'pages/';
}

/**
 * Determine current page filename.
 * @returns {string}
 */
export function getCurrentPageFile() {
  const path = window.location.pathname.replace(/\\/g, '/');
  const filename = path.split('/').pop();
  if (!filename || filename === '' || filename === 'frontend') {
    return 'index.html';
  }
  return filename.toLowerCase();
}

/**
 * Automatically resolve and fix href links across all navbar and sidebar elements.
 * @param {HTMLElement|Document} [root=document]
 */
export function setupNavigationLinks(root = document) {
  const isPagesDir = window.location.pathname.replace(/\\/g, '/').includes('/pages/');
  const prefix = isPagesDir ? './' : 'pages/';

  const navLinks = root.querySelectorAll('nav a, aside a, header a, footer a');

  navLinks.forEach(link => {
    const rawText = link.textContent.trim().toLowerCase();
    const icon = link.querySelector('.material-symbols-outlined')?.textContent?.trim().toLowerCase() || '';
    const href = link.getAttribute('href');

    if (!href || href === '#' || href === '') {
      if (rawText.includes('dashboard') || icon === 'dashboard' || rawText === 'my day') {
        link.setAttribute('href', `${prefix}dashboard.html`);
      } else if (rawText.includes('tasks') || rawText === 'task' || icon === 'task' || icon === 'task_alt') {
        link.setAttribute('href', `${prefix}tasks.html`);
      } else if (rawText.includes('planner') || rawText.includes('upcoming') || icon === 'calendar_month' || icon === 'today') {
        link.setAttribute('href', `${prefix}planner.html`);
      } else if (rawText.includes('profile') || icon === 'person') {
        link.setAttribute('href', `${prefix}profile.html`);
      } else if (rawText.includes('log out') || rawText.includes('logout') || icon === 'logout') {
        link.setAttribute('href', `${prefix}login.html`);
      } else if (rawText.includes('login')) {
        link.setAttribute('href', `${prefix}login.html`);
      } else if (rawText.includes('get started') || rawText.includes('sign up')) {
        link.setAttribute('href', `${prefix}signup.html`);
      }
    }

    if (link.classList.contains('brand-link') || rawText === 'taskpilot ai' || rawText === 'taskpilotai') {
      link.setAttribute('href', `${prefix}dashboard.html`);
    }
  });
}

/**
 * Automatically highlight active navigation link matching current URL.
 * @param {HTMLElement|Document} [root=document]
 */
export function setActiveNavLink(root = document) {
  const currentFile = getCurrentPageFile();

  const pageMap = {
    'dashboard.html': ['dashboard', 'my day'],
    'tasks.html': ['tasks', 'task'],
    'planner.html': ['planner', 'upcoming'],
    'profile.html': ['profile'],
    'login.html': ['login', 'log in'],
    'signup.html': ['signup', 'sign up', 'create account']
  };

  const navLinks = root.querySelectorAll('nav a, aside a');

  navLinks.forEach(link => {
    const href = (link.getAttribute('href') || '').toLowerCase();
    const linkFile = href.split('/').pop();
    const rawText = link.textContent.trim().toLowerCase();
    const icon = link.querySelector('.material-symbols-outlined')?.textContent?.trim().toLowerCase() || '';

    let isMatch = false;

    if (linkFile === currentFile && linkFile !== '' && linkFile !== '#') {
      isMatch = true;
    } else if (pageMap[currentFile]) {
      const matchKeywords = pageMap[currentFile];
      isMatch = matchKeywords.some(kw => rawText.includes(kw) || icon === kw);
    }

    if (isMatch) {
      link.classList.add('active', 'bg-secondary-container', 'text-on-secondary-container', 'font-bold');
      link.classList.remove('text-on-surface-variant');
      link.setAttribute('aria-current', 'page');

      const iconSpan = link.querySelector('.material-symbols-outlined');
      if (iconSpan) iconSpan.classList.add('fill');
    } else if (link.getAttribute('href') && link.getAttribute('href') !== '#') {
      link.classList.remove('active', 'bg-secondary-container', 'text-on-secondary-container', 'font-bold');
      link.classList.add('text-on-surface-variant');
      link.removeAttribute('aria-current');

      const iconSpan = link.querySelector('.material-symbols-outlined');
      if (iconSpan) iconSpan.classList.remove('fill');
    }
  });
}

/**
 * Ensure a mobile overlay element exists in the DOM.
 * @returns {HTMLElement}
 */
export function getOrCreateMobileOverlay() {
  let overlay = document.getElementById('mobile-drawer-overlay') || document.getElementById('mobile-overlay');

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'mobile-drawer-overlay';
    overlay.className = 'fixed inset-0 bg-primary/50 backdrop-blur-sm z-40 hidden transition-opacity duration-300';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);
  }

  return overlay;
}

/**
 * Initialize mobile sidebar drawer open/close mechanics with overlay & Escape listener.
 * @param {HTMLElement} [sidebarNode]
 */
export function initSidebarEvents(sidebarNode) {
  const sidebar = sidebarNode || document.getElementById('sidebar') || document.querySelector('aside');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const overlay = getOrCreateMobileOverlay();

  if (!sidebar && !mobileDrawer) return;

  function openSidebar() {
    if (sidebar) {
      sidebar.classList.remove('-translate-x-full', 'hidden');
      sidebar.classList.add('translate-x-0', 'open');
      sidebar.style.display = '';
    }
    if (mobileDrawer) {
      mobileDrawer.classList.remove('hidden');
    }
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    if (sidebar) {
      sidebar.classList.add('-translate-x-full');
      sidebar.classList.remove('translate-x-0', 'open');
      if (window.innerWidth < 768) {
        sidebar.classList.add('-translate-x-full');
      }
    }
    if (mobileDrawer) {
      mobileDrawer.classList.add('hidden');
    }
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  const menuButtons = document.querySelectorAll(
    '#mobile-menu-btn, #open-sidebar, [aria-label="Open sidebar"], header button.md\\:hidden, header button:has(.material-symbols-outlined)'
  );

  menuButtons.forEach(btn => {
    const icon = btn.querySelector('.material-symbols-outlined')?.textContent?.trim();
    if (btn.id === 'mobile-menu-btn' || btn.id === 'open-sidebar' || icon === 'menu' || btn.getAttribute('aria-label') === 'Open sidebar') {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        openSidebar();
      };
    }
  });

  const closeButtons = document.querySelectorAll(
    '#close-sidebar, [aria-label="Close sidebar"], aside button:has(span[data-icon="close"]), #mobile-drawer button'
  );

  closeButtons.forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeSidebar();
    };
  });

  overlay.onclick = (e) => {
    e.preventDefault();
    closeSidebar();
  };

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768 && overlay && !overlay.classList.contains('hidden')) {
      closeSidebar();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay && !overlay.classList.contains('hidden')) {
      closeSidebar();
    }
  });
}

/**
 * Universal Dropdown & Notification Panel Manager.
 */
export function initDropdownEvents() {
  const profileTriggers = document.querySelectorAll(
    '[aria-haspopup="true"]:not(#notif-trigger), [onclick*="user-dropdown"], header img.rounded-full'
  );

  profileTriggers.forEach(trigger => {
    const dropdown = document.getElementById('user-dropdown');
    if (!dropdown) return;

    trigger.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropdown.classList.toggle('hidden');
    };
  });

  initNotificationComponent();
  initSearchBarEvents(document);

  document.addEventListener('click', (e) => {
    const dropdowns = document.querySelectorAll(
      '#user-dropdown:not(.hidden), #notif-panel:not(.hidden), #notification-panel:not(.hidden), #search-results-dropdown:not(.hidden)'
    );

    dropdowns.forEach(dropdown => {
      const isInside = dropdown.contains(e.target);
      const isTrigger = e.target.closest('#notif-trigger, [aria-label*="Notification"], [aria-haspopup="true"], #task-search-input, input[type="search"]');
      if (!isInside && !isTrigger) {
        dropdown.classList.add('hidden');
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openPanels = document.querySelectorAll(
        '#user-dropdown:not(.hidden), #notif-panel:not(.hidden), #notification-panel:not(.hidden), #search-results-dropdown:not(.hidden)'
      );
      openPanels.forEach(p => p.classList.add('hidden'));
    }
  });
}

/**
 * Initialize notification trigger buttons, unread badge, and notification panel list.
 */
export function initNotificationComponent() {
  const notifTriggers = document.querySelectorAll(
    '#notif-trigger, button[aria-label*="Notification"], button:has(span[data-icon="notifications"]), header button:has(.material-symbols-outlined:contains("notifications"))'
  );

  notifTriggers.forEach(trigger => {
    let panel = document.getElementById('notif-panel') || document.getElementById('notification-panel');

    if (!panel) {
      const parentContainer = trigger.closest('.relative') || trigger.parentElement;
      if (parentContainer && !parentContainer.classList.contains('relative')) {
        parentContainer.classList.add('relative');
      }

      panel = document.createElement('div');
      panel.id = 'notif-panel';
      panel.className = 'absolute right-0 top-full mt-2 w-[360px] max-w-[90vw] bg-[#FFFFFF] border border-gray-border shadow-dropdown rounded-lg z-50 overflow-hidden hidden transform origin-top-right';
      panel.setAttribute('role', 'menu');
      panel.setAttribute('aria-labelledby', trigger.id || 'notif-trigger');

      panel.innerHTML = `
        <div class="flex justify-between items-center p-4 border-b border-gray-border bg-[#FFFFFF]">
          <h2 class="font-label-md text-label-md text-[#172033] font-bold">Notifications</h2>
          <button class="font-label-sm text-label-sm text-forest-green text-[#166534] hover:underline focus:outline-none cursor-pointer" id="mark-all-read">Mark all as read</button>
        </div>
        <div class="max-h-[380px] overflow-y-auto" id="notif-list"></div>
        <div class="p-3 bg-[#FFFFFF] border-t border-gray-border text-center">
          <a class="font-label-sm text-label-sm text-forest-green text-[#166534] hover:underline" href="${getPagesBasePath()}dashboard.html">View dashboard →</a>
        </div>
      `;

      if (parentContainer) {
        parentContainer.appendChild(panel);
      } else {
        document.body.appendChild(panel);
      }
    }

    trigger.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isHidden = panel.classList.contains('hidden');
      if (isHidden) {
        panel.classList.remove('hidden');
        trigger.setAttribute('aria-expanded', 'true');
        refreshAllNotificationPanels();
      } else {
        panel.classList.add('hidden');
        trigger.setAttribute('aria-expanded', 'false');
      }
    };
  });

  const markAllButtons = document.querySelectorAll('#mark-all-read');
  markAllButtons.forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      markAllNotificationsAsRead();
    };
  });

  refreshAllNotificationPanels();
}

/**
 * Fetch and cache raw HTML of a component template.
 * @param {string} componentNameOrPath
 * @returns {Promise<string>}
 */
export async function fetchComponentTemplate(componentNameOrPath) {
  let url = componentNameOrPath;

  if (!url.endsWith('.html')) {
    url = `${getComponentBasePath()}${componentNameOrPath}.html`;
  } else if (!url.startsWith('./') && !url.startsWith('../') && !url.startsWith('/')) {
    url = `${getComponentBasePath()}${componentNameOrPath}`;
  }

  if (componentCache.has(url)) {
    return componentCache.get(url);
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status} (${response.statusText})`);
    }
    const htmlText = await response.text();
    componentCache.set(url, htmlText);
    return htmlText;
  } catch (err) {
    console.error(`[TaskPilot UI] Failed to fetch component from "${url}":`, err);
    throw err;
  }
}

/**
 * Parse fetched HTML and extract clean component node.
 * @param {string} htmlText
 * @param {string} componentName
 * @returns {HTMLElement|DocumentFragment}
 */
export function extractComponentNode(htmlText, componentName) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');
  const cleanName = componentName.replace(/\.html$/, '').toLowerCase();

  let targetNode = null;

  switch (cleanName) {
    case 'navbar':
      targetNode = doc.querySelector('header') || doc.body.firstElementChild;
      break;
    case 'sidebar':
      targetNode = doc.querySelector('aside#sidebar') || doc.querySelector('aside') || doc.body.firstElementChild;
      break;
    case 'footer':
      targetNode = doc.querySelector('footer') || doc.body.firstElementChild;
      break;
    case 'task-card':
      targetNode = doc.querySelector('.task-card') || doc.querySelector('article') || doc.body.firstElementChild;
      break;
    case 'calendar':
      targetNode = doc.querySelector('#calendar-grid')?.closest('.bg-white') || doc.body.firstElementChild;
      break;
    case 'ai-recommendation':
      targetNode = doc.querySelector('#ai-recommendation-card') || doc.querySelector('[data-recommendation-type]') || doc.body.firstElementChild;
      break;
    case 'notification':
      targetNode = doc.querySelector('#notification-component') || doc.querySelector('.relative') || doc.body.firstElementChild;
      break;
    case 'search-bar':
      targetNode = doc.querySelector('#search-component') || doc.querySelector('[role="search"]') || doc.body.firstElementChild;
      break;
    case 'button':
      targetNode = doc.querySelector('.btn') || doc.body.firstElementChild;
      break;
    default:
      targetNode = doc.body.firstElementChild;
  }

  if (!targetNode) {
    const frag = document.createDocumentFragment();
    while (doc.body.firstChild) {
      frag.appendChild(doc.body.firstChild);
    }
    return frag;
  }

  return document.importNode(targetNode, true);
}

/**
 * Load and inject a single component into a target container element.
 * @param {HTMLElement|string} target
 * @param {string} componentNameOrPath
 * @param {Object} [options]
 * @returns {Promise<HTMLElement|null>}
 */
export async function loadComponent(target, componentNameOrPath, options = {}) {
  const container = typeof target === 'string' ? document.querySelector(target) : target;
  if (!container) return null;

  const componentName = componentNameOrPath || container.getAttribute('data-component');
  if (!componentName) return null;

  try {
    const templateHtml = await fetchComponentTemplate(componentName);
    const componentNode = extractComponentNode(templateHtml, componentName);
    if (!componentNode) throw new Error(`Could not extract DOM for component "${componentName}"`);

    if (container.dataset) {
      Object.keys(container.dataset).forEach(key => {
        if (key !== 'component') componentNode.dataset[key] = container.dataset[key];
      });
    }

    if (container.dataset.title) {
      const titleEl = componentNode.querySelector('#navbar-page-title') || componentNode.querySelector('h1, h2');
      if (titleEl) titleEl.textContent = container.dataset.title;
    }

    const mode = options.mode || container.getAttribute('data-mode') || 'replace';
    if (mode === 'replace') {
      container.parentNode.replaceChild(componentNode, container);
    } else if (mode === 'prepend') {
      container.insertBefore(componentNode, container.firstChild);
    } else {
      container.innerHTML = '';
      container.appendChild(componentNode);
    }

    setupNavigationLinks(componentNode);
    setActiveNavLink(componentNode);
    initGlobalInteractions(componentNode);

    return componentNode;
  } catch (err) {
    console.error(`[TaskPilot UI] Failed to load component "${componentName}":`, err);
    return null;
  }
}

/**
 * Scan DOM and automatically inject all elements with [data-component].
 * @param {HTMLElement|Document} [root=document]
 * @returns {Promise<HTMLElement[]>}
 */
export async function loadComponents(root = document) {
  const elements = Array.from(root.querySelectorAll('[data-component]'));
  if (elements.length === 0) return [];

  const loadPromises = elements.map(el => {
    const componentName = el.getAttribute('data-component');
    return loadComponent(el, componentName);
  });

  const results = await Promise.all(loadPromises);
  initGlobalInteractions(root);
  return results.filter(Boolean);
}

/**
 * Show a standardized global toast notification.
 * @param {string} message
 * @param {string} [type='success']
 * @param {number} [duration=3000]
 */
export function showToast(message = 'Action completed successfully', type = 'success', duration = 3000) {
  let toast = document.getElementById('toast');

  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  const iconMap = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info'
  };

  const icon = iconMap[type] || 'check_circle';

  toast.innerHTML = `
    <span class="material-symbols-outlined text-secondary" style="font-size: 20px;">${icon}</span>
    <span class="font-label-md text-label-md" id="toast-message">${escapeHTML(message)}</span>
  `;

  toast.classList.remove('hidden', 'translate-y-20', 'opacity-0');
  toast.style.display = 'flex';

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-20');
    setTimeout(() => {
      toast.style.display = 'none';
    }, 300);
  }, duration);
}

/**
 * Toggle modal dialog visibility by ID.
 * @param {string} modalId
 * @param {boolean} [show]
 */
export function toggleModal(modalId, show) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  const isHidden = modal.classList.contains('hidden');
  const shouldShow = show !== undefined ? show : isHidden;

  if (shouldShow) {
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  } else {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

/**
 * Helper to escape HTML safely.
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
 * Bind global interaction listeners across the page.
 * @param {HTMLElement|Document} [root=document]
 */
export function initGlobalInteractions(root = document) {
  setupNavigationLinks(root);
  setActiveNavLink(root);
  initSidebarEvents();
  initDropdownEvents();
}

// Expose on window for inline scripts and templates
if (typeof window !== 'undefined') {
  window.TaskPilotUI = {
    loadComponent,
    loadComponents,
    getComponentBasePath,
    getPagesBasePath,
    getCurrentPageFile,
    setupNavigationLinks,
    setActiveNavLink,
    initSidebarEvents,
    initDropdownEvents,
    initNotificationComponent,
    initSearchBarEvents,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    showToast,
    toggleModal,
    initGlobalInteractions
  };
}
