/* Inventory / Stock Management View */

let invState = { page: 1, perPage: 10, search: '', warehouse: 'all', stockStatus: 'all', subTab: 'levels' };

registerView('inventory', function() {
  breadcrumb([{ label: 'Home', view: 'dashboard' }, { label: 'Inventory' }]);
  invState.page = 1;
  const html = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div><h1 class="page-title">Inventory Management</h1><div class="subtitle">Track stock levels, adjustments, and transfers</div></div>
    </div>
    <ul class="nav nav-tabs mb-3">
      <li class="nav-item"><button class="nav-link active" data-invtab="levels">Stock Levels</button></li>
      <li class="nav-item"><button class="nav-link" data-invtab="adjustments">Adjustments</button></li>
      <li class="nav-item"><button class="nav-link" data-invtab="transfers">Transfers</button></li>
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
  renderInvTab();
});

function renderInvTab() {
  const c = document.getElementById('invTabContent');
  if (invState.subTab === 'levels') renderStockLevels(c);
  else if (invState.subTab === 'adjustments') renderAdjustments(c);
  else if (invState.subTab === 'transfers') renderTransfers(c);
  else if (invState.subTab === 'history') renderStockHistory(c);
  else renderReorderReport(c);
}

function renderStockLevels(c) {
  c.innerHTML = `
    <div class="toolbar">
      <div class="search-box"><i class="bi bi-search"></i><input type="text" class="form-control" id="invSearch" placeholder="Search products…"></div>
      <select class="form-select form-select-sm" id="invWarehouse" style="width:auto;">
        <option value="all">All Locations</option>
        ${WAREHOUSES.map(w => `<option value="${w.id}">${w.name}</option>`).join('')}
      </select>
      <select class="form-select form-select-sm" id="invStock" style="width:auto;">
        <option value="all">All Stock</option>
        <option value="in">In Stock</option>
        <option value="low">Low Stock</option>
        <option value="out">Out of Stock</option>
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
  document.getElementById('invSearch').addEventListener('input', e => { invState.search = e.target.value; invState.page = 1; renderInvTable(); });
  document.getElementById('invStock').addEventListener('change', e => { invState.stockStatus = e.target.value; invState.page = 1; renderInvTable(); });
  document.getElementById('invAdjust').addEventListener('click', () => adjustmentModal());
  document.getElementById('invExport').addEventListener('click', () => {
    exportCSV('stock_levels.csv', ['Product','SKU','Category','Stock','Reorder','Cost Value','Status'],
      PRODUCTS.map(p => [p.name, p.sku, catName(p.category), p.stock, p.reorder, +(p.cost * p.stock).toFixed(2), p.stock <= 0 ? 'out' : p.stock <= p.reorder ? 'low' : 'in']));
  });
  renderInvTable();
}

function renderInvTable() {
  let items = [...PRODUCTS];
  if (invState.search) { const q = invState.search.toLowerCase(); items = items.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)); }
  if (invState.stockStatus === 'in') items = items.filter(p => p.stock > p.reorder);
  if (invState.stockStatus === 'low') items = items.filter(p => p.stock > 0 && p.stock <= p.reorder);
  if (invState.stockStatus === 'out') items = items.filter(p => p.stock <= 0);
  const paged = paginate(items, invState.page, invState.perPage);
  const body = document.getElementById('invTableBody');
  if (!items.length) body.innerHTML = `<tr><td colspan="8">${emptyState('bi-box-seam', 'No products found', 'Try a different search.')}</td></tr>`;
  else body.innerHTML = paged.map(p => `
    <tr>
      <td><div class="d-flex align-items-center gap-2"><div class="product-thumb">${p.image||'📦'}</div><span class="fw-600">${p.name}</span></div></td>
      <td>${p.sku}</td><td>${catName(p.category)}</td>
      <td class="fw-600">${p.stock} ${p.unit}</td><td>${p.reorder} ${p.unit}</td>
      <td class="text-money">${fmtMoney(p.cost * p.stock)}</td>
      <td>${stockBadge(p.stock, p.reorder)}</td>
      <td class="text-end"><div class="table-actions"><button class="icon-btn" data-inv-adjust="${p.id}" title="Adjust"><i class="bi bi-arrow-down-up"></i></button><button class="icon-btn" data-inv-history="${p.id}" title="History"><i class="bi bi-clock-history"></i></button></div></td>
    </tr>`).join('');
  body.querySelectorAll('[data-inv-adjust]').forEach(b => b.addEventListener('click', () => adjustmentModal(b.dataset.invAdjust)));
  body.querySelectorAll('[data-inv-history]').forEach(b => b.addEventListener('click', () => showStockHistory(b.dataset.invHistory)));
  const pag = document.getElementById('invPagination');
  pag.innerHTML = `<div class="small text-muted">${items.length} products · Total value: ${fmtMoney(PRODUCTS.reduce((s,p)=>s+p.cost*p.stock,0))}</div>${renderPagination(items.length, invState.page, invState.perPage, p=>{invState.page=p;renderInvTable();})}`;
  attachPaginationClicks(pag, p => { invState.page = p; renderInvTable(); });
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

function renderTransfers(c) {
  c.innerHTML = `
    <div class="toolbar"><div class="toolbar-spacer"></div><button class="btn btn-primary btn-sm" id="newTransfer"><i class="bi bi-plus-lg me-1"></i>New Transfer</button></div>
    <div class="card">
      <div class="card-body">
        ${emptyState('bi-truck', 'No transfers yet', 'Transfer stock between warehouses or branches. Click "New Transfer" to start.')}
      </div>
    </div>`;
  c.querySelector('#newTransfer').addEventListener('click', () => {
    const body = `<form id="transferForm">
      <div class="row g-3">
        <div class="col-6"><label class="form-label">From Location</label><select class="form-select" id="trFrom">${WAREHOUSES.map(w=>`<option value="${w.id}">${w.name}</option>`).join('')}</select></div>
        <div class="col-6"><label class="form-label">To Location</label><select class="form-select" id="trTo">${WAREHOUSES.map(w=>`<option value="${w.id}">${w.name}</option>`).join('')}</select></div>
        <div class="col-12"><label class="form-label">Product</label><select class="form-select" id="trProduct">${PRODUCTS.map(p=>`<option value="${p.id}">${p.name} (${p.stock} ${p.unit})</option>`).join('')}</select></div>
        <div class="col-6"><label class="form-label">Quantity</label><input type="number" class="form-control" id="trQty" min="1" value="1"></div>
        <div class="col-6"><label class="form-label">Date</label><input type="date" class="form-control" id="trDate" value="${new Date().toISOString().slice(0,10)}"></div>
        <div class="col-12"><label class="form-label">Notes</label><textarea class="form-control" id="trNotes" rows="2"></textarea></div>
      </div>
    </form>`;
    const footer = `<button class="btn btn-light" data-bs-dismiss="modal">Cancel</button><button class="btn btn-primary" id="trSave">Create Transfer</button>`;
    const modal = formModal('New Stock Transfer', body, footer);
    document.getElementById('trSave').addEventListener('click', () => { modal.hide(); showToast('Stock transfer created', 'success'); });
  });
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
  const lowStock = PRODUCTS.filter(p => p.stock > 0 && p.stock <= p.reorder);
  const outStock = PRODUCTS.filter(p => p.stock <= 0);
  c.innerHTML = `
    <div class="row g-3 mb-3">
      <div class="col-md-3"><div class="kpi-card"><div class="kpi-label">Low Stock Items</div><div class="kpi-value text-warning">${lowStock.length}</div></div></div>
      <div class="col-md-3"><div class="kpi-card"><div class="kpi-label">Out of Stock</div><div class="kpi-value text-danger">${outStock.length}</div></div></div>
      <div class="col-md-3"><div class="kpi-card"><div class="kpi-label">Total Reorder Value</div><div class="kpi-value">${fmtMoney([...lowStock, ...outStock].reduce((s,p)=>s+p.cost*(p.reorder-p.stock),0))}</div></div></div>
      <div class="col-md-3"><div class="kpi-card"><div class="kpi-label">Suggested Orders</div><div class="kpi-value">${lowStock.length + outStock.length}</div></div></div>
    </div>
    <div class="card table-card">
      <div class="card-header">Reorder Suggestions</div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead><tr><th>Product</th><th>Current Stock</th><th>Reorder Level</th><th>Suggested Qty</th><th>Est. Cost</th><th>Supplier</th><th class="text-end">Action</th></tr></thead>
            <tbody>
              ${[...outStock, ...lowStock].map(p => {
                const suggested = Math.max(p.reorder * 2 - p.stock, p.reorder);
                const supplier = SUPPLIERS[Math.floor(Math.random()*SUPPLIERS.length)];
                return `<tr><td class="fw-600">${p.name}</td><td>${p.stock} ${p.unit}</td><td>${p.reorder} ${p.unit}</td><td class="fw-600">${suggested} ${p.unit}</td><td class="text-money">${fmtMoney(suggested * p.cost)}</td><td>${supplier.name}</td><td class="text-end"><button class="btn btn-soft-warning btn-sm" data-reorder="${p.id}" data-supp="${supplier.id}" data-qty="${suggested}"><i class="bi bi-cart-plus me-1"></i>Order</button></td></tr>`;
              }).join('') || `<tr><td colspan="7">${emptyState('bi-check-circle','All stocked up!','No items need reordering.')}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  c.querySelectorAll('[data-reorder]').forEach(b => b.addEventListener('click', () => showToast('Purchase order created for ' + productName(b.dataset.reorder), 'success')));
}
