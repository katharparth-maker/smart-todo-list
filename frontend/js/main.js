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
  markNotificationAsRead,
  markAllNotificationsAsRead,
  initGlobalInteractions,
  showToast,
  toggleModal
} from './ui.js';

import {
  initAuthForms,
  initPasswordToggles
} from './auth.js';

import {
  initTaskManagement,
  openTaskModal
} from './tasks.js';

/**
 * Main application bootstrap function.
 */
export async function initApp() {
  try {
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

    // 6. Initialize auth forms (email/password validation, strength meter, toggles)
    initAuthForms(document);

    // 7. Initialize task management (CRUD, live search, category tabs, dashboard stats)
    initTaskManagement();

    // 8. Setup universal Escape key and modal listeners
    setupGlobalKeyboardListeners();

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
