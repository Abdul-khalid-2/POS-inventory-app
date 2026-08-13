/* Dashboard View */

let dashboardCharts = {};

registerView('dashboard', function() {
  breadcrumb([{ label: 'Home', view: 'dashboard' }, { label: 'Dashboard' }]);

  const todaySales = SALES.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.total, 0);
  const todayProfit = SALES.filter(s => s.status === 'completed').reduce((sum, s) => {
    const cogs = s.items.reduce((c, it) => c + (productById(it.productId)?.cost || 0) * it.qty, 0);
    return sum + s.total - cogs - s.tax;
  }, 0);
  const totalOrders = SALES.length;
  const lowStockItems = PRODUCTS.filter(p => p.stock > 0 && p.stock <= p.reorder);
  const outOfStockItems = PRODUCTS.filter(p => p.stock <= 0);
  const totalCustomers = CUSTOMERS.length - 1;
  const totalDue = CUSTOMERS.reduce((s, c) => s + c.due, 0);
  const totalPayable = SUPPLIERS.reduce((s, sup) => s + sup.payable, 0);
  const cashInRegister = SHIFT.openingCash + SALES.filter(s => s.method === 'cash' && s.status === 'completed').reduce((s, x) => s + x.paid, 0);

  const html = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <div class="subtitle">Welcome back, ${currentUser ? currentUser.name : 'User'}! Here's what's happening today.</div>
      </div>
      <div class="d-none d-md-flex gap-2">
        <button class="btn btn-outline-secondary btn-sm" id="refreshDash"><i class="bi bi-arrow-clockwise me-1"></i>Refresh</button>
        <button class="btn btn-primary btn-sm" data-nav="pos"><i class="bi bi-bag-check me-1"></i>New Sale</button>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="row g-3 mb-4">
      ${kpiCard("Today's Sales", fmtMoney(todaySales), 'up', '12.5%', 'bi-cash-stack', 'success')}
      ${kpiCard("Today's Profit", fmtMoney(todayProfit), 'up', '8.2%', 'bi-graph-up-arrow', 'primary')}
      ${kpiCard("Total Orders", totalOrders, 'up', '5.1%', 'bi-receipt', 'info')}
      ${kpiCard("Low Stock Items", lowStockItems.length + outOfStockItems.length, 'down', '3 items', 'bi-exclamation-triangle', 'warning')}
      ${kpiCard("Total Customers", totalCustomers, 'up', '2 new', 'bi-people', 'primary')}
      ${kpiCard("Total Due (Receivable)", fmtMoney(totalDue), 'down', '2.3%', 'bi-cash-coin', 'danger')}
      ${kpiCard("Total Payable", fmtMoney(totalPayable), 'down', '1.8%', 'bi-credit-card', 'danger')}
      ${kpiCard("Cash in Register", fmtMoney(cashInRegister), 'up', '—', 'bi-safe', 'success')}
    </div>

    <!-- Charts Row -->
    <div class="row g-3 mb-4">
      <div class="col-12 col-xl-8">
        <div class="card h-100">
          <div class="card-header d-flex justify-content-between align-items-center">
            <span>Sales Trend</span>
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-secondary active" id="trend7">7 Days</button>
              <button class="btn btn-outline-secondary" id="trend30">30 Days</button>
            </div>
          </div>
          <div class="card-body"><canvas id="salesTrendChart" height="120"></canvas></div>
        </div>
      </div>
      <div class="col-12 col-xl-4">
        <div class="card h-100">
          <div class="card-header">Payment Methods</div>
          <div class="card-body d-flex align-items-center"><canvas id="paymentChart"></canvas></div>
        </div>
      </div>
    </div>

    <!-- Best Sellers + Recent Orders -->
    <div class="row g-3 mb-4">
      <div class="col-12 col-xl-5">
        <div class="card h-100">
          <div class="card-header">Best-Selling Products</div>
          <div class="card-body"><canvas id="bestSellersChart" height="180"></canvas></div>
        </div>
      </div>
      <div class="col-12 col-xl-7">
        <div class="card table-card h-100">
          <div class="card-header d-flex justify-content-between align-items-center">
            Recent Orders
            <a href="#" class="small text-decoration-none" data-nav="sales">View all</a>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead><tr><th>Invoice</th><th>Customer</th><th>Total</th><th>Method</th><th>Status</th></tr></thead>
                <tbody>
                  ${SALES.slice(0, 8).map(s => `
                    <tr class="cursor-pointer" data-sale-detail="${s.id}">
                      <td class="fw-600">${s.invoice}</td>
                      <td>${s.customerName}</td>
                      <td class="text-money">${fmtMoney(s.total)}</td>
                      <td><span class="text-capitalize">${s.method}</span></td>
                      <td>${statusBadge(s.status)}</td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Low Stock + Activity -->
    <div class="row g-3">
      <div class="col-12 col-xl-6">
        <div class="card h-100">
          <div class="card-header d-flex justify-content-between align-items-center">
            Low Stock Alerts
            <a href="#" class="small text-decoration-none" data-nav="inventory">View all</a>
          </div>
          <div class="card-body">
            ${(() => {
              const items = [...lowStockItems, ...outOfStockItems].slice(0, 6);
              if (!items.length) return emptyState('bi-check-circle', 'All stocked up!', 'No low stock items at the moment.');
              return items.map(p => `
                <div class="d-flex align-items-center gap-3 py-2 border-bottom">
                  <div class="product-thumb">${p.image || '📦'}</div>
                  <div class="flex-grow-1">
                    <div class="fw-600">${p.name}</div>
                    <div class="small text-muted">Reorder at ${p.reorder} ${p.unit}</div>
                  </div>
                  <div class="text-end">
                    <div class="${p.stock <= 0 ? 'text-danger' : 'text-warning'} fw-700">${p.stock} ${p.unit}</div>
                    <button class="btn btn-soft-warning btn-sm mt-1" data-restock="${p.id}"><i class="bi bi-plus-circle me-1"></i>Restock</button>
                  </div>
                </div>`).join('');
            })()}
          </div>
        </div>
      </div>
      <div class="col-12 col-xl-6">
        <div class="card h-100">
          <div class="card-header">Recent Activity</div>
          <div class="card-body">
            ${ACTIVITY_LOG.map(a => `
              <div class="activity-item">
                <div class="activity-dot bg-soft-${a.color}"><i class="bi ${a.icon}"></i></div>
                <div class="flex-grow-1">
                  <div><span class="fw-600">${a.user}</span> ${a.action} <span class="text-muted">${a.detail}</span></div>
                  <div class="small text-muted">${a.time}</div>
                </div>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`;

  document.getElementById('content').innerHTML = html;
  document.querySelector('[data-nav="pos"]')?.addEventListener('click', e => { e.preventDefault(); navigateTo('pos'); });
  document.querySelectorAll('[data-nav]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); navigateTo(el.dataset.nav); }));
  document.getElementById('refreshDash')?.addEventListener('click', () => { showToast('Dashboard refreshed', 'success'); navigateTo('dashboard'); });
  document.querySelectorAll('[data-restock]').forEach(btn => btn.addEventListener('click', () => showToast('Restock order initiated for ' + productName(btn.dataset.restock), 'success')));
  document.querySelectorAll('[data-sale-detail]').forEach(tr => tr.addEventListener('click', () => { if (VIEWS.sales) { navigateTo('sales'); setTimeout(() => window.showSaleDetail?.(tr.dataset.saleDetail), 200); } }));

  renderDashboardCharts();
});

function kpiCard(label, value, trend, change, icon, color) {
  return `<div class="col-6 col-md-4 col-xl-3">
    <div class="kpi-card">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <div class="kpi-icon bg-soft-${color}"><i class="bi ${icon}"></i></div>
        <span class="kpi-change ${trend}"><i class="bi ${trend === 'up' ? 'bi-arrow-up' : 'bi-arrow-down'}"></i> ${change}</span>
      </div>
      <div class="kpi-label">${label}</div>
      <div class="kpi-value">${value}</div>
    </div>
  </div>`;
}

function renderDashboardCharts() {
  Object.values(dashboardCharts).forEach(c => c?.destroy());
  dashboardCharts = {};

  // Sales trend
  const trend7 = document.getElementById('trend7');
  const trend30 = document.getElementById('trend30');
  const drawTrend = (days) => {
    const labels = [], data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      labels.push(label);
      const val = 200 + Math.random() * 600 + (days === 7 ? Math.sin(i) * 100 : 0);
      data.push(+val.toFixed(2));
    }
    dashboardCharts.trend?.destroy();
    const ctx = document.getElementById('salesTrendChart');
    const grad = ctx.getContext('2d').createLinearGradient(0, 0, 0, 200);
    grad.addColorStop(0, 'rgba(79,70,229,0.3)');
    grad.addColorStop(1, 'rgba(79,70,229,0.0)');
    dashboardCharts.trend = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ label: 'Sales', data, borderColor: '#4f46e5', backgroundColor: grad, fill: true, tension: 0.4, borderWidth: 2, pointRadius: 0, pointHoverRadius: 5 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,.15)' } }, x: { grid: { display: false } } } }
    });
  };
  drawTrend(7);
  trend7?.addEventListener('click', () => { trend7.classList.add('active'); trend30.classList.remove('active'); drawTrend(7); });
  trend30?.addEventListener('click', () => { trend30.classList.add('active'); trend7.classList.remove('active'); drawTrend(30); });

  // Payment methods donut
  const methods = { cash: 0, card: 0, wallet: 0, credit: 0 };
  SALES.filter(s => s.status === 'completed').forEach(s => { methods[s.method] = (methods[s.method] || 0) + s.paid; });
  dashboardCharts.payment = new Chart(document.getElementById('paymentChart'), {
    type: 'doughnut',
    data: { labels: ['Cash', 'Card', 'Mobile Wallet', 'Credit'], datasets: [{ data: [methods.cash, methods.card, methods.wallet, methods.credit], backgroundColor: ['#10b981', '#4f46e5', '#f59e0b', '#ef4444'], borderWidth: 0 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { padding: 16, font: { size: 12 } } } } }
  });

  // Best sellers bar
  const productSales = {};
  SALES.forEach(s => s.items.forEach(it => { productSales[it.name] = (productSales[it.name] || 0) + it.qty; }));
  const sorted = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 6);
  dashboardCharts.best = new Chart(document.getElementById('bestSellersChart'), {
    type: 'bar',
    data: { labels: sorted.map(x => x[0]), datasets: [{ label: 'Units Sold', data: sorted.map(x => x[1]), backgroundColor: '#4f46e5', borderRadius: 6, barThickness: 20 }] },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, grid: { color: 'rgba(148,163,184,.15)' } }, y: { grid: { display: false } } } }
  });
}
