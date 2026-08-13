<!doctype html>
<html lang="en" data-bs-theme="light">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{ $title ?? 'NovaPOS — Point of Sale & Inventory' }}</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%234f46e5'/><text x='50' y='66' font-size='52' text-anchor='middle' fill='white' font-family='Arial' font-weight='bold'>N</text></svg>" />
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" />
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="{{ asset('assets/css/style.css') }}" />
  </head>
  <body>
    {{-- The initial view requested via the Laravel route. app.js reads this on first login. --}}
    <script>window.__INITIAL_VIEW__ = @json($view ?? 'dashboard');</script>

    <div id="login-view"></div>
    <div id="app" class="d-none">
      <button class="btn btn-primary d-lg-none sidebar-toggle-btn" id="sidebarToggle" type="button" aria-label="Toggle menu">
        <i class="bi bi-list"></i>
      </button>
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <div class="brand-logo"><i class="bi bi-bag-check-fill"></i></div>
          <span class="brand-name">NovaPOS</span>
          <button class="btn-close btn-close-white d-lg-none ms-auto" id="sidebarClose" aria-label="Close menu"></button>
        </div>
        <nav class="sidebar-nav" id="sidebarNav"></nav>
        <div class="sidebar-footer">
          <div class="user-mini">
            <div class="user-mini-avatar" id="sidebarUserAvatar">A</div>
            <div class="user-mini-info">
              <div class="user-mini-name" id="sidebarUserName">Admin</div>
              <div class="user-mini-role" id="sidebarUserRole">Administrator</div>
            </div>
          </div>
        </div>
      </aside>
      <div class="sidebar-overlay" id="sidebarOverlay"></div>
      <div class="main-area">
        <header class="topbar">
          <div class="topbar-left">
            <button class="btn btn-link btn-sm d-lg-none p-0 me-2" id="topbarToggle" aria-label="Open menu">
              <i class="bi bi-list fs-4"></i>
            </button>
            <div class="topbar-breadcrumb" id="breadcrumb"></div>
          </div>
          <div class="topbar-right">
            <div class="topbar-search d-none d-md-flex">
              <i class="bi bi-search"></i>
              <input type="text" class="form-control form-control-sm" placeholder="Search…" id="globalSearch" />
            </div>
            <button class="btn btn-link btn-sm theme-toggle" id="themeToggle" aria-label="Toggle theme">
              <i class="bi bi-moon-stars-fill"></i>
            </button>
            <div class="dropdown">
              <button class="btn btn-link btn-sm position-relative" data-bs-toggle="dropdown" aria-label="Notifications">
                <i class="bi bi-bell-fill fs-5"></i>
                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" id="notifBadge">3</span>
              </button>
              <div class="dropdown-menu dropdown-menu-end notif-dropdown" id="notifDropdown"></div>
            </div>
            <div class="dropdown">
              <button class="btn btn-link btn-sm d-flex align-items-center gap-1 p-0" data-bs-toggle="dropdown">
                <div class="topbar-avatar" id="topbarAvatar">A</div>
                <span class="d-none d-sm-inline small fw-600" id="topbarUserName">Admin</span>
                <i class="bi bi-chevron-down small"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><a class="dropdown-item" href="#" data-nav="settings"><i class="bi bi-person me-2"></i>Profile</a></li>
                <li><a class="dropdown-item" href="#" data-nav="settings"><i class="bi bi-gear me-2"></i>Settings</a></li>
                <li><hr class="dropdown-divider" /></li>
                <li><a class="dropdown-item" href="#" id="switchUserBtn"><i class="bi bi-arrow-left-right me-2"></i>Switch User</a></li>
                <li><a class="dropdown-item text-danger" href="#" id="logoutBtn"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
              </ul>
            </div>
          </div>
        </header>
        <main class="content" id="content"></main>
      </div>
    </div>
    <div class="toast-container position-fixed bottom-0 end-0 p-3" id="toastContainer"></div>
    <div id="modalRoot"></div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    <script src="{{ asset('assets/js/data.js') }}"></script>
    <script src="{{ asset('assets/js/helpers.js') }}"></script>
    <script src="{{ asset('assets/js/app.js') }}"></script>
    <script src="{{ asset('assets/js/views/login.js') }}"></script>
    <script src="{{ asset('assets/js/views/dashboard.js') }}"></script>
    <script src="{{ asset('assets/js/views/pos.js') }}"></script>
    <script src="{{ asset('assets/js/views/products.js') }}"></script>
    <script src="{{ asset('assets/js/views/sales.js') }}"></script>
    <script src="{{ asset('assets/js/views/inventory.js') }}"></script>
    <script src="{{ asset('assets/js/views/purchases.js') }}"></script>
    <script src="{{ asset('assets/js/views/people.js') }}"></script>
    <script src="{{ asset('assets/js/views/orders.js') }}"></script>
    <script src="{{ asset('assets/js/views/accounts.js') }}"></script>
    <script src="{{ asset('assets/js/views/reports.js') }}"></script>
    <script src="{{ asset('assets/js/views/settings.js') }}"></script>
    <script src="{{ asset('assets/js/views/notifications.js') }}"></script>
  </body>
</html>
