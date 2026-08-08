/**
 * TaskPilotAI – Authentication & Form Validation Module
 * File: frontend/js/auth.js
 *
 * Responsibilities:
 *   - Client-side validation for login and signup forms:
 *       • Email format and presence validation
 *       • Password length, complexity, and presence validation
 *       • Confirm password equality validation
 *   - Real-time inline error rendering & clearance
 *   - Show / Hide password toggles with accessible icon updates
 *   - Live password strength calculation
 *   - Accessible loading states during authentication actions
 *   - Stubs and helpers prepared for future Supabase integration
 *
 * Note: Does not store plain passwords. Ready for Supabase client wiring.
 */

/**
 * Standard email format regex.
 */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Validate an email address string.
 * @param {string} email
 * @returns {{ isValid: boolean, message: string }}
 */
export function validateEmail(email) {
  const trimmed = (email || '').trim();
  if (!trimmed) {
    return { isValid: false, message: 'Email address is required.' };
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, message: 'Please enter a valid email address.' };
  }
  return { isValid: true, message: '' };
}

/**
 * Validate a password string.
 * @param {string} password
 * @param {boolean} [isSignup=false] - Apply stricter length/complexity for signup
 * @returns {{ isValid: boolean, message: string }}
 */
export function validatePassword(password, isSignup = false) {
  const val = password || '';
  if (!val) {
    return { isValid: false, message: 'Password is required.' };
  }
  if (isSignup) {
    if (val.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long.' };
    }
    if (!/[a-zA-Z]/.test(val) || !/\d/.test(val)) {
      return { isValid: false, message: 'Password must include both letters and numbers.' };
    }
  } else {
    if (val.length < 6) {
      return { isValid: false, message: 'Password must be at least 6 characters.' };
    }
  }
  return { isValid: true, message: '' };
}

/**
 * Validate password confirmation matching.
 * @param {string} password
 * @param {string} confirmPassword
 * @returns {{ isValid: boolean, message: string }}
 */
export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) {
    return { isValid: false, message: 'Please confirm your password.' };
  }
  if (password !== confirmPassword) {
    return { isValid: false, message: 'Passwords do not match.' };
  }
  return { isValid: true, message: '' };
}

/**
 * Validate full name input.
 * @param {string} name
 * @returns {{ isValid: boolean, message: string }}
 */
export function validateFullName(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) {
    return { isValid: false, message: 'Full name is required.' };
  }
  if (trimmed.length < 2) {
    return { isValid: false, message: 'Please enter at least 2 characters.' };
  }
  return { isValid: true, message: '' };
}

/**
 * Render a styled inline error message beneath an input container.
 * @param {HTMLInputElement} inputEl
 * @param {string} errorMessage
 */
export function showInputError(inputEl, errorMessage) {
  if (!inputEl) return;

  clearInputError(inputEl);

  // Border highlight
  inputEl.classList.add('border-error', '!border-[#EF4444]');
  inputEl.classList.remove('border-outline-variant', 'border-[#E5E7EB]');
  inputEl.setAttribute('aria-invalid', 'true');

  const container = inputEl.closest('.input-group, .relative, div') || inputEl.parentElement;

  const errorEl = document.createElement('p');
  errorEl.className = 'auth-error-msg font-body-sm text-body-sm text-[#EF4444] text-[12px] mt-1 flex items-center gap-1';
  errorEl.setAttribute('role', 'alert');
  errorEl.innerHTML = `<span class="material-symbols-outlined" style="font-size: 14px;">error</span><span>${errorMessage}</span>`;

  if (container) {
    container.parentElement?.appendChild(errorEl) || container.appendChild(errorEl);
  } else {
    inputEl.insertAdjacentElement('afterend', errorEl);
  }
}

/**
 * Clear any existing inline error message and reset input border.
 * @param {HTMLInputElement} inputEl
 */
export function clearInputError(inputEl) {
  if (!inputEl) return;

  inputEl.classList.remove('border-error', '!border-[#EF4444]');
  inputEl.classList.add('border-outline-variant');
  inputEl.removeAttribute('aria-invalid');

  const container = inputEl.closest('.input-group, .relative, div') || inputEl.parentElement;
  const parent = container?.parentElement || inputEl.parentElement;

  if (parent) {
    const existingErrors = parent.querySelectorAll('.auth-error-msg');
    existingErrors.forEach(err => err.remove());
  }

  if (container) {
    const existingErrors = container.querySelectorAll('.auth-error-msg');
    existingErrors.forEach(err => err.remove());
  }
}

/**
 * Clear all inline errors across a form.
 * @param {HTMLFormElement} form
 */
export function clearFormErrors(form) {
  if (!form) return;
  const errorMsgs = form.querySelectorAll('.auth-error-msg');
  errorMsgs.forEach(msg => msg.remove());

  const inputs = form.querySelectorAll('input');
  inputs.forEach(input => {
    input.classList.remove('border-error', '!border-[#EF4444]');
    input.removeAttribute('aria-invalid');
  });
}

/**
 * Set a submit button into an accessible loading state.
 * @param {HTMLButtonElement} button
 * @param {boolean} isLoading
 * @param {string} [loadingText='Please wait...']
 */
export function setFormLoading(button, isLoading, loadingText = 'Please wait...') {
  if (!button) return;

  if (isLoading) {
    button.disabled = true;
    button.dataset.originalHtml = button.innerHTML;
    button.classList.add('is-loading', 'opacity-80', 'cursor-not-allowed');

    button.innerHTML = `
      <span class="material-symbols-outlined animate-spin mr-2" style="font-size: 18px;">progress_activity</span>
      <span>${loadingText}</span>
    `;
  } else {
    button.disabled = false;
    button.classList.remove('is-loading', 'opacity-80', 'cursor-not-allowed');
    if (button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
    }
  }
}

/**
 * Attach show/hide password toggle functionality to all eye icons and buttons.
 * @param {HTMLElement|Document} [root=document]
 */
export function initPasswordToggles(root = document) {
  const toggleButtons = root.querySelectorAll(
    '.password-toggle, button:has(span.material-symbols-outlined:contains("visibility")), [onclick*="togglePassword"]'
  );

  // Standard handler function exposed globally and locally
  window.togglePassword = function (inputId, iconEl) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const isPassword = input.getAttribute('type') === 'password';
    input.setAttribute('type', isPassword ? 'text' : 'password');

    if (iconEl) {
      iconEl.textContent = isPassword ? 'visibility' : 'visibility_off';
    }
  };

  // Wire buttons inside password groups
  const passwordInputs = root.querySelectorAll('input[type="password"]');
  passwordInputs.forEach(input => {
    const parent = input.parentElement;
    if (!parent) return;

    const toggleBtn = parent.querySelector('button, .password-toggle');
    if (toggleBtn) {
      toggleBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const iconSpan = toggleBtn.querySelector('.material-symbols-outlined') || (toggleBtn.classList.contains('material-symbols-outlined') ? toggleBtn : null);
        window.togglePassword(input.id, iconSpan);
      };
    }
  });
}

/**
 * Calculate password strength score and update UI meter.
 * @param {string} password
 * @returns {'weak' | 'medium' | 'strong'}
 */
export function evaluatePasswordStrength(password) {
  const val = password || '';
  if (val.length === 0 || val.length < 8) {
    return 'weak';
  }
  const hasLetters = /[a-zA-Z]/.test(val);
  const hasNumbers = /\d/.test(val);
  const hasSpecial = /[^a-zA-Z0-9]/.test(val);

  if (hasLetters && hasNumbers && hasSpecial && val.length >= 10) {
    return 'strong';
  }
  if (hasLetters && hasNumbers) {
    return 'medium';
  }
  return 'weak';
}

/**
 * Attach live password strength meter listener.
 * @param {HTMLInputElement} passwordInput
 */
export function initPasswordStrengthMeter(passwordInput) {
  if (!passwordInput) return;

  const s1 = document.getElementById('strength-1');
  const s2 = document.getElementById('strength-2');
  const s3 = document.getElementById('strength-3');
  const sText = document.getElementById('strength-text');

  if (!s1 || !s2 || !s3 || !sText) return;

  passwordInput.addEventListener('input', () => {
    const strength = evaluatePasswordStrength(passwordInput.value);

    if (strength === 'weak') {
      s1.className = 'h-full w-1/3 bg-error strength-bar !bg-[#EF4444]';
      s2.className = 'h-full w-1/3 bg-surface-container strength-bar !bg-[#E5E7EB]';
      s3.className = 'h-full w-1/3 bg-surface-container strength-bar !bg-[#E5E7EB]';
      sText.textContent = 'Weak';
      sText.className = 'font-label-sm text-error !text-[#EF4444]';
    } else if (strength === 'medium') {
      s1.className = 'h-full w-1/3 strength-bar !bg-[#FBBF24]';
      s2.className = 'h-full w-1/3 strength-bar !bg-[#FBBF24]';
      s3.className = 'h-full w-1/3 bg-surface-container strength-bar !bg-[#E5E7EB]';
      sText.textContent = 'Medium';
      sText.className = 'font-label-sm !text-[#854D0E]';
    } else if (strength === 'strong') {
      s1.className = 'h-full w-1/3 strength-bar !bg-[#166534]';
      s2.className = 'h-full w-1/3 strength-bar !bg-[#166534]';
      s3.className = 'h-full w-1/3 strength-bar !bg-[#166534]';
      sText.textContent = 'Strong';
      sText.className = 'font-label-sm !text-[#166534]';
    }
  });
}

/**
 * Initialize and attach validation to login and signup forms.
 * @param {HTMLElement|Document} [root=document]
 */
export function initAuthForms(root = document) {
  initPasswordToggles(root);

  // 1. Login Form Validation & Submission
  const loginForm = root.querySelector('form:not(#signupForm)');
  const emailInput = root.getElementById('email');
  const passwordInput = root.getElementById('password');

  if (loginForm && !root.getElementById('signupForm') && emailInput && passwordInput) {
    // Clear errors on input change
    emailInput.addEventListener('input', () => clearInputError(emailInput));
    passwordInput.addEventListener('input', () => clearInputError(passwordInput));

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearFormErrors(loginForm);

      const emailValidation = validateEmail(emailInput.value);
      const passwordValidation = validatePassword(passwordInput.value, false);

      let hasError = false;

      if (!emailValidation.isValid) {
        showInputError(emailInput, emailValidation.message);
        hasError = true;
      }

      if (!passwordValidation.isValid) {
        showInputError(passwordInput, passwordValidation.message);
        hasError = true;
      }

      if (hasError) {
        const firstInvalid = loginForm.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Valid – Proceed with authentication loading state
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      setFormLoading(submitBtn, true, 'Logging in...');

      try {
        await handleLoginSubmission({
          email: emailInput.value.trim(),
          password: passwordInput.value
        });
      } catch (err) {
        console.error('[TaskPilot Auth] Login failed:', err);
        showInputError(passwordInput, err.message || 'Login failed. Please check your credentials.');
      } finally {
        setFormLoading(submitBtn, false);
      }
    });
  }

  // 2. Signup Form Validation & Submission
  const signupForm = root.getElementById('signupForm') || root.querySelector('form#signupForm');
  const signupNameInput = root.getElementById('fullName');
  const signupEmailInput = root.getElementById('email');
  const signupPasswordInput = root.getElementById('password');
  const confirmPasswordInput = root.getElementById('confirmPassword');

  if (signupForm) {
    if (signupPasswordInput) {
      initPasswordStrengthMeter(signupPasswordInput);
    }

    // Live clearance of input errors
    if (signupNameInput) signupNameInput.addEventListener('input', () => clearInputError(signupNameInput));
    if (signupEmailInput) signupEmailInput.addEventListener('input', () => clearInputError(signupEmailInput));
    if (signupPasswordInput) signupPasswordInput.addEventListener('input', () => clearInputError(signupPasswordInput));
    if (confirmPasswordInput) confirmPasswordInput.addEventListener('input', () => clearInputError(confirmPasswordInput));

    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearFormErrors(signupForm);

      let hasError = false;

      if (signupNameInput) {
        const nameValidation = validateFullName(signupNameInput.value);
        if (!nameValidation.isValid) {
          showInputError(signupNameInput, nameValidation.message);
          hasError = true;
        }
      }

      if (signupEmailInput) {
        const emailValidation = validateEmail(signupEmailInput.value);
        if (!emailValidation.isValid) {
          showInputError(signupEmailInput, emailValidation.message);
          hasError = true;
        }
      }

      if (signupPasswordInput) {
        const passwordValidation = validatePassword(signupPasswordInput.value, true);
        if (!passwordValidation.isValid) {
          showInputError(signupPasswordInput, passwordValidation.message);
          hasError = true;
        }
      }

      if (signupPasswordInput && confirmPasswordInput) {
        const confirmValidation = validateConfirmPassword(
          signupPasswordInput.value,
          confirmPasswordInput.value
        );
        if (!confirmValidation.isValid) {
          showInputError(confirmPasswordInput, confirmValidation.message);
          hasError = true;
        }
      }

      if (hasError) {
        const firstInvalid = signupForm.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Valid – Proceed with registration loading state
      const submitBtn = signupForm.querySelector('button[type="submit"]');
      setFormLoading(submitBtn, true, 'Creating account...');

      try {
        await handleSignupSubmission({
          fullName: signupNameInput ? signupNameInput.value.trim() : '',
          email: signupEmailInput.value.trim(),
          password: signupPasswordInput.value
        });
      } catch (err) {
        console.error('[TaskPilot Auth] Signup failed:', err);
        showInputError(signupEmailInput, err.message || 'Signup failed. Please try again.');
      } finally {
        setFormLoading(submitBtn, false);
      }
    });
  }
}

/**
 * Authentication action handler prepared for Supabase integration.
 * Simulates network response and redirects to dashboard upon success.
 * @param {{ email: string, password: string }} credentials
 */
export async function handleLoginSubmission(credentials) {
  // Simulated asynchronous verification (will be replaced by supabase.auth.signInWithPassword)
  return new Promise((resolve) => {
    setTimeout(() => {
      console.info('[TaskPilot Auth] Credentials validated for:', credentials.email);
      window.location.href = 'dashboard.html';
      resolve({ user: { email: credentials.email } });
    }, 1000);
  });
}

/**
 * Registration action handler prepared for Supabase integration.
 * Simulates network response and redirects upon success.
 * @param {{ fullName: string, email: string, password: string }} data
 */
export async function handleSignupSubmission(data) {
  // Simulated asynchronous registration (will be replaced by supabase.auth.signUp)
  return new Promise((resolve) => {
    setTimeout(() => {
      console.info('[TaskPilot Auth] Account registered for:', data.email);
      window.location.href = 'dashboard.html';
      resolve({ user: { email: data.email, fullName: data.fullName } });
    }, 1200);
  });
}

/**
 * Placeholder for Supabase signOut.
 */
export async function signOut() {
  window.location.href = 'login.html';
}

/**
 * Placeholder for Supabase getSession.
 */
export async function getSession() {
  return null;
}

// Expose on window for inline scripts
if (typeof window !== 'undefined') {
  window.TaskPilotAuth = {
    validateEmail,
    validatePassword,
    validateConfirmPassword,
    validateFullName,
    showInputError,
    clearInputError,
    clearFormErrors,
    setFormLoading,
    initPasswordToggles,
    initAuthForms,
    handleLoginSubmission,
    handleSignupSubmission,
    signOut,
    getSession
  };
}
