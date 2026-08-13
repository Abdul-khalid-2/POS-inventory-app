/* ===========================
   NovaPOS — App Shell & Router
   =========================== */

const NAV_STRUCTURE = [
  { section: 'Main', items: [
    { view: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
    { view: 'pos', label: 'POS Terminal', icon: 'bi-bag-check' },
  ]},
  { section: 'Catalog & Inventory', items: [
    { view: 'products', label: 'Products', icon: 'bi-box-seam' },
    { view: 'inventory', label: 'Inventory', icon: 'bi-clipboard-data' },
  ]},
  { section: 'Sales & Orders', items: [
    { view: 'sales', label: 'Sales', icon: 'bi-receipt' },
    { view: 'orders', label: 'Orders', icon: 'bi-bag' },
  ]},
  { section: 'Purchasing', items: [
    { view: 'purchases', label: 'Purchases', icon: 'bi-cart-plus' },
  ]},
  { section: 'People', items: [
    { view: 'people', label: 'Customers & Suppliers', icon: 'bi-people' },
  ]},
  { section: 'Finance', items: [
    { view: 'accounts', label: 'Accounts', icon: 'bi-cash-coin' },
    { view: 'reports', label: 'Reports', icon: 'bi-bar-chart-line' },
  ]},
  { section: 'System', items: [
    { view: 'notifications', label: 'Notifications', icon: 'bi-bell', badge: '3' },
    { view: 'settings', label: 'Settings', icon: 'bi-gear' },
  ]},
];

const VIEWS = {};
let currentUser = null;
let currentView = 'dashboard';

function registerView(name, renderFn) {
  VIEWS[name] = renderFn;
}

function renderSidebar() {
  const nav = document.getElementById('sidebarNav');
  let html = '';
  NAV_STRUCTURE.forEach(sec => {
    html += `<div class="nav-section-label">${sec.section}</div>`;
    sec.items.forEach(item => {
      const badge = item.badge ? `<span class="badge bg-danger">${item.badge}</span>` : '';
      html += `<button class="nav-item ${item.view === currentView ? 'active' : ''}" data-nav="${item.view}">
        <i class="bi ${item.icon}"></i><span>${item.label}</span>${badge}
      </button>`;
    });
  });
  nav.innerHTML = html;
  nav.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.nav));
  });
}

function navigateTo(view) {
  if (!VIEWS[view]) { console.warn('View not found:', view); return; }
  currentView = view;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.nav === view));
  const content = document.getElementById('content');
  content.style.opacity = '0';
  content.style.transition = 'opacity .15s';
  setTimeout(() => {
    content.innerHTML = '';
    VIEWS[view]();
    content.style.opacity = '1';
    if (window.innerWidth < 992) closeSidebar();
  }, 100);
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('show');
  document.getElementById('sidebarOverlay').classList.remove('show');
}

function openSidebar() {
  document.getElementById('sidebar').classList.add('show');
  document.getElementById('sidebarOverlay').classList.add('show');
}

function renderNotifDropdown() {
  const dd = document.getElementById('notifDropdown');
  const unread = NOTIFICATIONS.filter(n => !n.read).length;
  document.getElementById('notifBadge').textContent = unread;
  document.getElementById('notifBadge').style.display = unread > 0 ? '' : 'none';
  let html = `<div class="notif-header"><span>Notifications</span><span class="badge bg-soft-primary">${unread} new</span></div><div class="notif-body">`;
  NOTIFICATIONS.slice(0, 6).forEach(n => {
    html += `<div class="notif-item ${n.read ? '' : 'unread'}" data-notif="${n.id}">
      <div class="notif-icon bg-soft-${n.color}"><i class="bi ${n.icon}"></i></div>
      <div><div class="notif-text fw-600">${n.title}</div><div class="notif-text">${n.message}</div><div class="notif-time">${n.time}</div></div>
    </div>`;
  });
  html += `</div><div class="notif-footer"><a href="#" class="text-decoration-none fw-600" id="viewAllNotifs">View all notifications</a></div>`;
  dd.innerHTML = html;
  document.getElementById('viewAllNotifs')?.addEventListener('click', e => { e.preventDefault(); navigateTo('notifications'); });
  dd.querySelectorAll('.notif-item').forEach(it => {
    it.addEventListener('click', () => {
      const id = it.dataset.notif;
      const n = NOTIFICATIONS.find(x => x.id === id);
      if (n) { n.read = true; renderNotifDropdown(); }
    });
  });
}

function setUserUI() {
  if (!currentUser) return;
  const letter = avatarLetter(currentUser.name);
  document.getElementById('sidebarUserName').textContent = currentUser.name;
  document.getElementById('sidebarUserRole').textContent = currentUser.role;
  document.getElementById('sidebarUserAvatar').textContent = letter;
  document.getElementById('topbarUserName').textContent = currentUser.name;
  document.getElementById('topbarAvatar').textContent = letter;
}

function login(email, role) {
  const user = USERS.find(u => u.role === role) || USERS[0];
  currentUser = { ...user, email };
  setUserUI();
  document.getElementById('login-view').classList.add('d-none');
  document.getElementById('app').classList.remove('d-none');
  renderSidebar();
  renderNotifDropdown();
  navigateTo(window.__INITIAL_VIEW__ || 'dashboard');
}

function logout() {
  currentUser = null;
  document.getElementById('app').classList.add('d-none');
  document.getElementById('login-view').classList.remove('d-none');
  VIEWS.login();
}

// Theme toggle
function toggleTheme() {
  const html = document.documentElement;
  const dark = html.getAttribute('data-bs-theme') === 'dark';
  html.setAttribute('data-bs-theme', dark ? 'light' : 'dark');
  document.querySelector('#themeToggle i').className = dark ? 'bi bi-moon-stars-fill' : 'bi bi-sun-fill';
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('sidebarToggle')?.addEventListener('click', openSidebar);
  document.getElementById('topbarToggle')?.addEventListener('click', openSidebar);
  document.getElementById('sidebarClose')?.addEventListener('click', closeSidebar);
  document.getElementById('sidebarOverlay')?.addEventListener('click', closeSidebar);
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
  document.getElementById('logoutBtn')?.addEventListener('click', e => { e.preventDefault(); logout(); });
  document.getElementById('switchUserBtn')?.addEventListener('click', e => { e.preventDefault(); logout(); });
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); navigateTo(el.dataset.nav); });
  });
  // Start with login
  VIEWS.login();
});
