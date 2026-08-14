/* Inventory / Stock Management View — Stock Levels & Reorder Report
   wired to real /catalog/products data. Adjustments/History are still
   mock previews — the real adjustment flow (writes to stock_movements)
   is the next roadmap step, not this one. */

let invState = { page: 1, perPage: 10, search: '', stockStatus: 'all' };

registerView('inventory', function() {
  breadcrumb([{ label: 'Home', view: 'dashboard' }, { label: 'Inventory' }]);
  invState.page = 1;
  const html = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div><h1 class="page-title">Inventory Management</h1><div class="subtitle">Track stock levels and reorder needs</div></div>
    </div>
    <ul class="nav nav-tabs mb-3">
      <li class="nav-item"><button class="nav-link active" data-invtab="levels">Stock Levels</button></li>
      <li class="nav-item"><button class="nav-link" data-invtab="adjustments">Adjustments</button></li>
      <li class="nav-item"><button class="nav-link" data-invtab="history">Stock History</button></li>
      <li class="nav-item"><button class="nav-link" data-invtab="reorder">Reorder Report</button></li>
    </ul>
    <div id="invTabContent"></div>
  `;
  document.getElementById('content').innerHTML = html;
  document.querySelectorAll('[data-invtab]').forEach(t => t.addEventListener('click', () => {
    document.querySelectorAll('[data-invtab]').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    invState.subTab = t.dataset.invtab;
    renderInvTab();
  }));
  invState.subTab = 'levels';
  renderInvTab();
});

function renderInvTab() {
  const c = document.getElementById('invTabContent');
  if (invState.subTab === 'levels') renderStockLevels(c);
  else if (invState.subTab === 'adjustments') renderAdjustments(c);
  else if (invState.subTab === 'history') renderStockHistory(c);
  else renderReorderReport(c);
}

function renderStockLevels(c) {
  c.innerHTML = `
    <div class="toolbar">
      <div class="search-box"><i class="bi bi-search"></i><input type="text" class="form-control" id="invSearch" placeholder="Search products…" value="${invState.search}"></div>
      <select class="form-select form-select-sm" id="invStock" style="width:auto;">
        <option value="all">All Stock</option>
        <option value="in" ${invState.stockStatus === 'in' ? 'selected' : ''}>In Stock</option>
        <option value="low" ${invState.stockStatus === 'low' ? 'selected' : ''}>Low Stock</option>
        <option value="out" ${invState.stockStatus === 'out' ? 'selected' : ''}>Out of Stock</option>
      </select>
      <div class="toolbar-spacer"></div>
      <button class="btn btn-outline-secondary btn-sm" id="invExport"><i class="bi bi-download me-1"></i>Export</button>
      <button class="btn btn-primary btn-sm" id="invAdjust"><i class="bi bi-arrow-down-up me-1"></i>Adjust Stock</button>
    </div>
    <div class="card table-card">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Stock</th><th>Reorder Level</th><th>Value (Cost)</th><th>Status</th><th class="text-end">Actions</th></tr></thead>
            <tbody id="invTableBody"></tbody>
          </table>
        </div>
      </div>
      <div class="card-body d-flex justify-content-between align-items-center" id="invPagination"></div>
    </div>`;
  document.getElementById('invSearch').addEventListener('input', debounce(e => { invState.search = e.target.value; invState.page = 1; renderInvTable(); }, 350));
  document.getElementById('invStock').addEventListener('change', e => { invState.stockStatus = e.target.value; invState.page = 1; renderInvTable(); });
  document.getElementById('invAdjust').addEventListener('click', () => showToast('Stock adjustments are wired up in the next step — this button isn\'t connected yet.', 'info'));
  document.getElementById('invExport').addEventListener('click', exportStockLevels);
  renderInvTable();
}

function buildInventoryQuery(extra = {}) {
  const params = new URLSearchParams();
  if (invState.search) params.set('q', invState.search);
  if (invState.stockStatus !== 'all') params.set('stock_status', invState.stockStatus);
  Object.entries(extra).forEach(([k, v]) => params.set(k, v));
  return params.toString();
}

async function renderInvTable() {
  const body = document.getElementById('invTableBody');
  body.innerHTML = skeletonRows(6, 8);

  let result;
  try {
    const qs = buildInventoryQuery({ page: invState.page, per_page: invState.perPage });
    result = await apiFetch(`/catalog/products?${qs}`);
  } catch (e) {
    body.innerHTML = `<tr><td colspan="8">${emptyState('bi-exclamation-triangle', "Couldn't load stock levels", e.message)}</td></tr>`;
    document.getElementById('invPagination').innerHTML = '';
    return;
  }

  const items = result.data;
  const meta = result.meta;

  if (!items.length) {
    body.innerHTML = `<tr><td colspan="8">${emptyState('bi-box-seam', 'No products found', 'Try a different search.')}</td></tr>`;
  } else {
    body.innerHTML = items.map(p => `
      <tr>
        <td><div class="d-flex align-items-center gap-2">${productThumb(p)}<span class="fw-600">${p.name}</span></div></td>
        <td>${p.sku}</td><td>${p.category?.name || '—'}</td>
        <td class="fw-600">${p.current_stock} ${p.unit.short_code}</td><td>${p.reorder_level} ${p.unit.short_code}</td>
        <td class="text-money">${fmtMoney(p.cost_price * p.current_stock)}</td>
        <td>${stockBadge(p.current_stock, p.reorder_level)}</td>
        <td class="text-end"><div class="table-actions"><button class="icon-btn" data-inv-adjust title="Adjust — not wired up yet"><i class="bi bi-arrow-down-up"></i></button><button class="icon-btn" data-inv-history title="History — not wired up yet"><i class="bi bi-clock-history"></i></button></div></td>
      </tr>`).join('');
    body.querySelectorAll('[data-inv-adjust], [data-inv-history]').forEach(b => b.addEventListener('click', () =>
      showToast('This is wired up in the next roadmap step.', 'info')));
  }

  // Cost value across every matching product (not just this page) —
  // a second, unpaginated fetch of just the totals would be more
  // efficient at real scale, but this matches what the old mock did
  // and this dataset is small enough that it doesn't matter yet.
  let totalValue = 0;
  try {
    const allQs = buildInventoryQuery({ per_page: 1000 });
    const all = await apiFetch(`/catalog/products?${allQs}`);
    totalValue = all.data.reduce((s, p) => s + p.cost_price * p.current_stock, 0);
  } catch (e) { /* non-critical — pagination footer just won't show a total */ }

  const pag = document.getElementById('invPagination');
  pag.innerHTML = `<div class="small text-muted">${meta.total} products &middot; Total value: ${fmtMoney(totalValue)}</div>${renderPagination(meta.total, meta.current_page, meta.per_page, p => { invState.page = p; renderInvTable(); })}`;
  attachPaginationClicks(pag, p => { invState.page = p; renderInvTable(); });
}

async function exportStockLevels() {
  let result;
  try {
    const qs = buildInventoryQuery({ per_page: 1000 });
    result = await apiFetch(`/catalog/products?${qs}`);
  } catch (e) {
    showToast("Couldn't export: " + e.message, 'error');
    return;
  }
  exportCSV('stock_levels.csv', ['Product', 'SKU', 'Category', 'Stock', 'Reorder', 'Cost Value', 'Status'],
    result.data.map(p => [p.name, p.sku, p.category?.name, p.current_stock, p.reorder_level, +(p.cost_price * p.current_stock).toFixed(2), p.current_stock <= 0 ? 'out' : p.current_stock <= p.reorder_level ? 'low' : 'in']));
}


function adjustmentModal(productId) {
  const p = productId ? productById(productId) : null;
  const body = `
    <form id="adjForm">
      <div class="mb-3"><label class="form-label">Product *</label><select class="form-select" id="adjProduct" ${p?'disabled':''}>
        ${PRODUCTS.map(pr => `<option value="${pr.id}" ${p?.id===pr.id?'selected':''}>${pr.name} (${pr.stock} ${pr.unit})</option>`).join('')}
      </select></div>
      <div class="row g-3 mb-3">
        <div class="col-6"><label class="form-label">Adjustment Type</label><select class="form-select" id="adjType"><option value="increase">Increase (+)</option><option value="decrease">Decrease (−)</option></select></div>
        <div class="col-6"><label class="form-label">Quantity *</label><input type="number" class="form-control" id="adjQty" min="1" value="1" required></div>
      </div>
      <div class="mb-3"><label class="form-label">Reason *</label><select class="form-select" id="adjReason"><option>Damaged</option><option>Returned</option><option>Correction</option><option>Lost</option><option>Found</option><option>Other</option></select></div>
      <div class="row g-3 mb-3">
        <div class="col-6"><label class="form-label">Reference #</label><input type="text" class="form-control" id="adjRef" value="ADJ-${Math.floor(100+Math.random()*900)}"></div>
        <div class="col-6"><label class="form-label">Date</label><input type="date" class="form-control" id="adjDate" value="${new Date().toISOString().slice(0,10)}"></div>
      </div>
      <div class="mb-3"><label class="form-label">Notes</label><textarea class="form-control" id="adjNotes" rows="2"></textarea></div>
    </form>`;
  const footer = `<button class="btn btn-light" data-bs-dismiss="modal">Cancel</button><button class="btn btn-primary" id="adjSave">Save Adjustment</button>`;
  const modal = formModal('Stock Adjustment', body, footer);
  document.getElementById('adjSave').addEventListener('click', () => {
    const prod = productById(document.getElementById('adjProduct').value);
    const type = document.getElementById('adjType').value;
    const qty = +document.getElementById('adjQty').value;
    if (!qty || qty < 1) { showToast('Enter a valid quantity', 'error'); return; }
    if (type === 'increase') prod.stock += qty; else prod.stock = Math.max(0, prod.stock - qty);
    STOCK_ADJUSTMENTS.unshift({ id: 'adj' + Date.now(), date: document.getElementById('adjDate').value, product: prod.name, type, qty, reason: document.getElementById('adjReason').value, ref: document.getElementById('adjRef').value, notes: document.getElementById('adjNotes').value });
    modal.hide();
    renderInvTab();
    showToast('Stock adjusted successfully', 'success');
  });
}

function renderAdjustments(c) {
  c.innerHTML = `
    <div class="toolbar"><div class="toolbar-spacer"></div><button class="btn btn-primary btn-sm" id="newAdj"><i class="bi bi-plus-lg me-1"></i>New Adjustment</button></div>
    <div class="card table-card">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead><tr><th>Ref #</th><th>Date</th><th>Product</th><th>Type</th><th>Qty</th><th>Reason</th><th>Notes</th></tr></thead>
            <tbody>
              ${STOCK_ADJUSTMENTS.map(a => `<tr><td class="fw-600">${a.ref}</td><td>${fmtDate(a.date)}</td><td>${a.product}</td><td>${a.type === 'increase' ? '<span class="badge bg-soft-success">Increase</span>' : '<span class="badge bg-soft-danger">Decrease</span>'}</td><td>${a.qty}</td><td>${a.reason}</td><td class="small text-muted">${a.notes}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  c.querySelector('#newAdj').addEventListener('click', () => adjustmentModal());
}

function renderStockHistory(c) {
  c.innerHTML = `
    <div class="card">
      <div class="card-header">Stock Movement History</div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead><tr><th>Date</th><th>Product</th><th>Type</th><th>Qty</th><th>Reason</th><th>Ref #</th></tr></thead>
            <tbody>
              ${STOCK_ADJUSTMENTS.map(a => `<tr><td>${fmtDate(a.date)}</td><td>${a.product}</td><td>${a.type==='increase'?'<span class="text-success">In</span>':'<span class="text-danger">Out</span>'}</td><td>${a.qty}</td><td>${a.reason}</td><td>${a.ref}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
}

function showStockHistory(id) {
  const p = productById(id);
  const body = `<div><h6 class="fw-700">${p.name}</h6><p class="small text-muted">Current stock: ${p.stock} ${p.unit}</p>
    <table class="table table-sm"><thead><tr><th>Date</th><th>Type</th><th>Qty</th><th>Reason</th></tr></thead><tbody>
    ${STOCK_ADJUSTMENTS.filter(a=>a.product===p.name).map(a=>`<tr><td>${fmtDate(a.date)}</td><td>${a.type}</td><td>${a.qty}</td><td>${a.reason}</td></tr>`).join('') || '<tr><td colspan="4" class="text-muted">No history</td></tr>'}
    </tbody></table></div>`;
  const footer = `<button class="btn btn-light" data-bs-dismiss="modal">Close</button>`;
  formModal('Stock History — ' + p.name, body, footer);
}

function renderReorderReport(c) {
  c.innerHTML = simpleLoading();
  apiFetch('/catalog/products?status=active&per_page=1000').then(({ data: products }) => {
    const lowStock = products.filter(p => p.current_stock > 0 && p.current_stock <= p.reorder_level);
    const outStock = products.filter(p => p.current_stock <= 0);
    const reorderValue = [...lowStock, ...outStock].reduce((s, p) => s + p.cost_price * Math.max(p.reorder_level - p.current_stock, 0), 0);

    c.innerHTML = `
      <div class="row g-3 mb-3">
        <div class="col-md-3"><div class="kpi-card"><div class="kpi-label">Low Stock Items</div><div class="kpi-value text-warning">${lowStock.length}</div></div></div>
        <div class="col-md-3"><div class="kpi-card"><div class="kpi-label">Out of Stock</div><div class="kpi-value text-danger">${outStock.length}</div></div></div>
        <div class="col-md-3"><div class="kpi-card"><div class="kpi-label">Total Reorder Value</div><div class="kpi-value">${fmtMoney(reorderValue)}</div></div></div>
        <div class="col-md-3"><div class="kpi-card"><div class="kpi-label">Suggested Orders</div><div class="kpi-value">${lowStock.length + outStock.length}</div></div></div>
      </div>
      <div class="card table-card">
        <div class="card-header">Reorder Suggestions</div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead><tr><th>Product</th><th>Current Stock</th><th>Reorder Level</th><th>Suggested Qty</th><th>Est. Cost</th><th class="text-end">Action</th></tr></thead>
              <tbody>
                ${[...outStock, ...lowStock].map(p => {
                  const suggested = Math.max(p.reorder_level * 2 - p.current_stock, p.reorder_level);
                  return `<tr><td class="fw-600">${p.name}</td><td>${p.current_stock} ${p.unit.short_code}</td><td>${p.reorder_level} ${p.unit.short_code}</td><td class="fw-600">${suggested} ${p.unit.short_code}</td><td class="text-money">${fmtMoney(suggested * p.cost_price)}</td><td class="text-end"><button class="btn btn-soft-warning btn-sm" data-reorder="${p.id}"><i class="bi bi-cart-plus me-1"></i>Order</button></td></tr>`;
                }).join('') || `<tr><td colspan="6">${emptyState('bi-check-circle', 'All stocked up!', 'No items need reordering.')}</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
    // Purchase orders aren't wired up until Phase 7 — no supplier is
    // suggested here yet (Suppliers themselves aren't real data until
    // Phase 8), so this stays a plain heads-up rather than pretending
    // to create anything.
    c.querySelectorAll('[data-reorder]').forEach(b => b.addEventListener('click', () =>
      showToast('Creating purchase orders from here is a Phase 7 feature — not built yet.', 'info')));
  }).catch(e => { c.innerHTML = emptyState('bi-exclamation-triangle', "Couldn't load reorder data", e.message); });
}
