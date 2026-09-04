/* api.js — Frontend API Client for InboxFlow */

const API = {

  async get(url) {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async post(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async put(url, body) {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async del(url) {
    const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  // ─── Gmail ─────────────────────────────────────────────────
  async getThreads(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.get(`/api/gmail/threads${q ? '?' + q : ''}`);
  },

  async getThread(id) {
    return this.get(`/api/gmail/thread/${id}`);
  },

  async sendReply(data) {
    return this.post('/api/gmail/send', data);
  },

  // ─── Groq AI ───────────────────────────────────────────────
  async generateReply(threadId, tone = 'Professional') {
    return this.post('/api/groq/reply', { threadId, tone });
  },

  async composeEmail(data) {
    return this.post('/api/groq/compose', data);
  },

  async compressEmail(data) {
    return this.post('/api/groq/compress', data);
  },

  async copilotQuery(question) {
    return this.post('/api/groq/copilot', { question });
  },


  // ─── Tasks ─────────────────────────────────────────────────
  async getTasks() {
    return this.get('/api/tasks');
  },

  async createTask(task) {
    return this.post('/api/tasks', task);
  },

  async updateTask(id, updates) {
    return this.put(`/api/tasks/${id}`, updates);
  },

  async deleteTask(id) {
    return this.del(`/api/tasks/${id}`);
  },

  // ─── Deadlines ─────────────────────────────────────────────
  async getDeadlines() {
    return this.get('/api/deadlines');
  },

  async createDeadline(deadline) {
    return this.post('/api/deadlines', deadline);
  },

  async updateDeadline(id, updates) {
    return this.put(`/api/deadlines/${id}`, updates);
  },

  async deleteDeadline(id) {
    return this.del(`/api/deadlines/${id}`);
  },

  async syncDeadlines() {
    return this.post('/api/deadlines/sync', {});
  },

  async generateDailyReport() {
    return this.post('/api/deadlines/report', {});
  },

  // ─── Follow-ups ────────────────────────────────────────────
  async getFollowUps() {
    return this.get('/api/followups');
  },

  async syncFollowUps() {
    return this.post('/api/followups/sync', {});
  },

  async dismissFollowUp(id) {
    return this.put(`/api/followups/${id}/dismiss`, {});
  },

  async scheduleFollowUp(data) {
    return this.post('/api/followups/schedule', data);
  },

  async checkFollowUpReply(threadId, followupId) {
    return this.post('/api/followups/check-reply', { thread_id: threadId, followup_id: followupId });
  },

  async generateFollowUpReply(threadId, tone) {
    return this.post('/api/followups/generate-reply', { threadId, tone });
  },

  // ─── Analytics ─────────────────────────────────────────────
  async getAnalytics() {
    return this.get('/api/analytics');
  },

  // ─── Auth ──────────────────────────────────────────────────
  async getAuthStatus() {
    return this.get('/auth/status');
  }
};

// ─── Theme Management (Dark / Light Mode) ───────────────────
function initTheme() {
  const saved = localStorage.getItem('inboxflow_theme') || 'light';
  applyTheme(saved);
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body?.classList.add('dark-theme');
  } else {
    document.documentElement.removeAttribute('data-theme');
    document.body?.classList.remove('dark-theme');
  }
  localStorage.setItem('inboxflow_theme', theme);
  const themeToggle = document.getElementById('theme-toggle-btn');
  if (themeToggle) {
    themeToggle.innerHTML = theme === 'dark'
      ? '<i class="bi bi-sun"></i> Light Mode'
      : '<i class="bi bi-moon"></i> Dark Mode';
  }
}

function toggleTheme() {
  const current = localStorage.getItem('inboxflow_theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  showToast(`Switched to ${next === 'dark' ? 'Dark' : 'Light'} Mode`, 'success');
}

// Auto initialize theme on script load
initTheme();

// ─── Toast Notifications ─────────────────────────────────────
function showToast(message, type = 'default') {
  const container = document.getElementById('toast-container') || (() => {
    const c = document.createElement('div');
    c.id = 'toast-container';
    document.body.appendChild(c);
    return c;
  })();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ─── Utility helpers ─────────────────────────────────────────
function getInitials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function priorityBadge(priority) {
  const p = (priority || 'MEDIUM').toUpperCase();
  return `<span class="badge-priority badge-${p}">${p}</span>`;
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ─── Auth Guard ──────────────────────────────────────────────
async function requireLogin() {
  try {
    const { authenticated } = await API.getAuthStatus();
    if (!authenticated && !window.location.pathname.includes('index') && window.location.pathname !== '/') {
      window.location.href = '/';
    }
    return authenticated;
  } catch (e) {
    return false;
  }
}

// ─── Set Active Nav Item ─────────────────────────────────────
function setActiveNav() {
  let path = window.location.pathname.replace('/', '') || 'dashboard';
  if (path === 'compress') path = 'compose';
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === path);
  });
}


// Load user profile into topbar
async function loadUserProfile() {
  try {
    const { authenticated, user } = await API.getAuthStatus();
    if (!authenticated) return;
    document.querySelectorAll('#user-avatar').forEach(el => {
      if (user.picture) {
        el.innerHTML = `<img src="${user.picture}" class="avatar" alt="${user.name}" onclick="window.location.href='/settings'">`;
      } else {
        el.innerHTML = `<div class="avatar-placeholder" onclick="window.location.href='/settings'">${getInitials(user.name)}</div>`;
      }
    });
  } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadUserProfile();
});
