/**
 * TaskPilotAI – Application Entry Point & Bootstrap
 * File: frontend/js/main.js
 *
 * Responsibilities:
 *   - Bootstrap the application on DOMContentLoaded
 *   - Auto-resolve navigation links (Dashboard, Tasks, Planner, Profile, Logout)
 *   - Highlight active page matching current URL
 *   - Initialize mobile sidebar drawer and mobile overlay
 *   - Manage universal click-outside & Escape key handlers for dropdowns, sidebars, and notifications
 *   - Initialize reusable components via ui.js
 *   - Initialize authentication form validation on login.html & signup.html via auth.js
 *   - Initialize task CRUD, search, filtering, and dashboard statistics via tasks.js
 *   - Manage notification panel state and actions via ui.js
 */

import {
  loadComponents,
  setupNavigationLinks,
  setActiveNavLink,
  initSidebarEvents,
  initDropdownEvents,
  initNotificationComponent,
  loadAndRenderApiReminders,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  initGlobalInteractions,
  showToast,
  toggleModal
} from './ui.js';


import {
  initAuthForms,
  initPasswordToggles,
  getSession,
  signOut,
  loadDashboardUserInfo
} from './auth.js';

import {
  initTaskManagement,
  loadAndRenderApiTasks,
  openTaskModal
} from './tasks.js';

import {
  initPlanner
} from './planner.js';

import {
  initRealtimeSubscriptions,
  destroyRealtimeChannels
} from './realtime.js';


/**
 * Route guard – redirect unauthenticated users to login.
 * Auth pages (login, signup) are explicitly excluded from protection.
 * @returns {Promise<boolean>} true if the page should continue loading, false if redirected.
 */
async function guardProtectedRoute() {
  try {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    const AUTH_PAGES = ['login.html', 'signup.html', 'index.html', ''];

    if (AUTH_PAGES.includes(page)) {
      // On auth pages: if already logged in, go straight to dashboard
      const session = await getSession();
      if (session && (page === 'login.html' || page === 'signup.html')) {
        window.location.href = 'dashboard.html';
        return false;
      }
      return true;
    }

    // Protected page – require a valid session
    const session = await getSession();
    if (!session) {
      window.location.href = '../pages/login.html';
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[TaskPilotAI] Session guard fallback:', err);
    return true;
  }
}

/**
 * Wire all logout buttons in the document (including dynamically loaded components).
 */
function initLogoutButtons() {
  // Target every element that carries a logout icon or explicit id
  const logoutSelectors = [
    '#logout-btn',
    '[data-action="logout"]',
    'button:has(span[data-icon="logout"])',
    'button:has(.material-symbols-outlined:not([data-icon]))'
  ];

  // Simpler, reliable approach: find all buttons/anchors whose text or icon says "logout"
  document.querySelectorAll('button, a').forEach(el => {
    const icon = el.querySelector('.material-symbols-outlined');
    const hasLogoutIcon = icon && (icon.textContent.trim() === 'logout' || icon.getAttribute('data-icon') === 'logout');
    const hasLogoutText = el.textContent.trim().toLowerCase() === 'logout';

    if (hasLogoutIcon || hasLogoutText) {
      el.addEventListener('click', async (e) => {
        e.preventDefault();
        await signOut();
      });
    }
  });
}

/**
 * Main application bootstrap function.
 */
export async function initApp() {
  try {
    // 0. Route guard – must run before anything else
    const canProceed = await guardProtectedRoute();
    if (!canProceed) return;

    // Load and display authenticated user info on dashboard
    await loadDashboardUserInfo();

    // 1. Setup navigation links across static and dynamic elements
    setupNavigationLinks(document);

    // 2. Auto-discover and dynamically inject reusable components
    await loadComponents(document);

    // 3. Highlight the active page navigation item
    setActiveNavLink(document);

    // 4. Initialize mobile sidebar drawer and overlay mechanics
    initSidebarEvents();

    // 5. Initialize dropdowns & notification panel
    initDropdownEvents();
    await loadAndRenderApiReminders();


    // 6. Initialize auth forms (email/password validation, strength meter, toggles)
    initAuthForms(document);

    // 7. Initialize task management (CRUD, live search, category tabs, dashboard stats)
    initTaskManagement();

    // 7.5. Initialize planner & schedule forms (reminders, interactive calendar)
    initPlanner();


    // 8. Setup universal Escape key and modal listeners
    setupGlobalKeyboardListeners();

    // 9. Wire logout buttons (including those injected by loadComponents)
    initLogoutButtons();

    // 10. Start Supabase Realtime subscriptions (non-blocking, errors don't crash the page)
    initRealtimeSubscriptions({
      onTaskChange: loadAndRenderApiTasks,
      onReminderChange: loadAndRenderApiReminders
    }).catch(err => console.warn('[TaskPilotAI] Realtime init failed (non-fatal):', err));

    // 11. Cleanup realtime channels on page unload to prevent memory leaks
    window.addEventListener('pagehide', () => {
      destroyRealtimeChannels();
    }, { once: true });

    console.info(
      `%c[TaskPilotAI]%c Bootstrap complete for: ${window.location.pathname.split('/').pop() || 'index.html'}`,
      'color: #166534; font-weight: bold;',
      'color: #64748B;'
    );
  } catch (err) {
    console.error('[TaskPilotAI] Application bootstrap encountered an error:', err);
  }
}

/**
 * Handle universal Escape key listeners for modals, sidebars, notifications, and dropdowns.
 */
function setupGlobalKeyboardListeners() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // 1. Dismiss any open modals
      const openModals = document.querySelectorAll(
        '.modal-bg:not(.hidden), [id$="Modal"]:not(.hidden), [id$="-modal"]:not(.hidden)'
      );
      openModals.forEach(modal => {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
      });

      // 2. Dismiss any open dropdowns and notification panels
      const dropdowns = document.querySelectorAll(
        '#user-dropdown:not(.hidden), #notification-panel:not(.hidden), #notif-panel:not(.hidden), #search-results-dropdown:not(.hidden)'
      );
      dropdowns.forEach(d => d.classList.add('hidden'));

      // 3. Dismiss mobile sidebar if open
      const sidebar = document.getElementById('sidebar');
      const mobileDrawer = document.getElementById('mobile-drawer');
      const overlay = document.getElementById('mobile-drawer-overlay') || document.getElementById('mobile-overlay');

      if (sidebar && sidebar.classList.contains('open')) {
        sidebar.classList.add('-translate-x-full');
        sidebar.classList.remove('translate-x-0', 'open');
      }

      if (mobileDrawer && !mobileDrawer.classList.contains('hidden')) {
        mobileDrawer.classList.add('hidden');
      }

      if (overlay && !overlay.classList.contains('hidden')) {
        overlay.classList.add('hidden');
        overlay.setAttribute('aria-hidden', 'true');
      }

      document.body.style.overflow = '';
    }
  });

  // Universal modal backdrop click dismissal
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-bg') || e.target.classList.contains('modal-backdrop')) {
      e.target.classList.add('hidden');
      e.target.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  });
}

// Auto-bootstrap when loaded as a module in the browser
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initApp());
  } else {
    initApp();
  }
}

// Expose on window for inline scripts and templates
if (typeof window !== 'undefined') {
  window.TaskPilot = {
    initApp,
    showToast,
    toggleModal,
    openTaskModal,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setupNavigationLinks,
    setActiveNavLink
  };
}
