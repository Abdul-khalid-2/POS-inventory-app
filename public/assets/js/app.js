/* ===========================
   NovaPOS — App Shell & Router
   =========================== */

// Maps each screen's `view` key to its real Laravel route. Keep this in
// sync with routes/web.php — every key here has a matching named route.
const ROUTES = {
  dashboard: '/',
  pos: '/pos',
  products: '/products',
  inventory: '/inventory',
  sales: '/sales',
  orders: '/orders',
  purchases: '/purchases',
  people: '/people',
  accounts: '/accounts',
  reports: '/reports',
  settings: '/settings',
  notifications: '/notifications',
};

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
let currentView = window.__INITIAL_VIEW__ || 'dashboard';
const AUTH_STORAGE_KEY = 'novapos_user';

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
      const url = ROUTES[item.view] || '#';
      html += `<a href="${url}" class="sidebar-nav-item ${item.view === currentView ? 'active' : ''}" data-nav="${item.view}">
        <i class="bi ${item.icon}"></i><span>${item.label}</span>${badge}
      </a>`;
    });
  });
  nav.innerHTML = html;
}

// Navigates by changing the browser URL to the screen's real route
// (a normal page load, handled server-side by the matching controller).
function navigateTo(view) {
  const url = ROUTES[view];
  if (!url) { console.warn('No route registered for view:', view); return; }
  window.location.href = url;
}

// Renders the screen for the CURRENT page (no navigation — used once per
// page load, since each route now server-renders its own page).
function renderCurrentView() {
  if (!VIEWS[currentView]) { console.warn('View not found:', currentView); return; }
  document.getElementById('sidebarNav').querySelectorAll('.sidebar-nav-item').forEach(n => n.classList.toggle('active', n.dataset.nav === currentView));
  const content = document.getElementById('content');
  content.innerHTML = '';
  VIEWS[currentView]();
  if (window.innerWidth < 992) closeSidebar();
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

function showApp() {
  document.getElementById('login-view').classList.add('d-none');
  document.getElementById('app').classList.remove('d-none');
  setUserUI();
  renderSidebar();
  renderNotifDropdown();
  renderCurrentView();
}

function login(email, role) {
  const user = USERS.find(u => u.role === role) || USERS[0];
  currentUser = { ...user, email };
  try { sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser)); } catch (e) { /* storage unavailable, demo still works for this page load */ }
  showApp();
}

function logout() {
  currentUser = null;
  try { sessionStorage.removeItem(AUTH_STORAGE_KEY); } catch (e) { /* ignore */ }
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

  // Every screen is now its own real route, so a saved (demo) login
  // needs to survive a full page navigation — restore it here instead
  // of always starting over at the login screen.
  let savedUser = null;
  try { savedUser = JSON.parse(sessionStorage.getItem(AUTH_STORAGE_KEY) || 'null'); } catch (e) { /* ignore */ }

  if (savedUser) {
    currentUser = savedUser;
    showApp();
  } else {
    VIEWS.login();
  }
});

