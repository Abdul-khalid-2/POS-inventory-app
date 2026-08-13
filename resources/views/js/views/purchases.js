/* Purchases View */

let purchaseState = { page: 1, perPage: 10, search: '', status: 'all', subTab: 'list' };

registerView('purchases', function() {
  breadcrumb([{ label: 'Home', view: 'dashboard' }, { label: 'Purchases' }]);
  purchaseState.page = 1;
  const html = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div><h1 class="page-title">Purchases</h1><div class="subtitle">Manage purchase orders, receipts, and supplier returns</div></div>
      <button class="btn btn-primary btn-sm" id="newPO"><i class="bi bi-plus-lg me-1"></i>New Purchase Order</button>
    </div>
    <ul class="nav nav-tabs mb-3">
      <li class="nav-item"><button class="nav-link active" data-potab="list">Purchase Orders</button></li>
      <li class="nav-item"><button class="nav-link" data-potab="grn">Goods Received</button></li>
      <li class="nav-item"><button class="nav-link" data-potab="returns">Purchase Returns</button></li>
    </ul>
    <div id="poTabContent"></div>
  `;
  document.getElementById('content').innerHTML = html;
  document.getElementById('newPO').addEventListener('click', () => createPOModal());
  document.querySelectorAll('[data-potab]').forEach(t => t.addEventListener('click', () => {
    document.querySelectorAll('[data-potab]').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    purchaseState.subTab = t.dataset.potab;
    renderPOTab();
  }));
  renderPOTab();
});

function renderPOTab() {
  const c = document.getElementById('poTabContent');
  if (purchaseState.subTab === 'list') renderPOList(c);
  else if (purchaseState.subTab === 'grn') renderGRN(c);
  else renderPOReturns(c);
}

function renderPOList(c) {
  c.innerHTML = `
    <div class="toolbar">
      <div class="search-box"><i class="bi bi-search"></i><input type="text" class="form-control" id="poSearch" placeholder="Search PO # or supplier…"></div>
      <select class="form-select form-select-sm" id="poStatus" style="width:auto;">
        <option value="all">All Status</option>
        <option value="draft">Draft</option><option value="ordered">Ordered</option><option value="received">Received</option><option value="partially_received">Partially Received</option>
      </select>
      <div class="toolbar-spacer"></div>
      <button class="btn btn-outline-secondary btn-sm" id="poExport"><i class="bi bi-download me-1"></i>Export</button>
    </div>
    <div class="card table-card">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead><tr><th>PO #</th><th>Date</th><th>Supplier</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Expected</th><th class="text-end">Actions</th></tr></thead>
            <tbody id="poTableBody"></tbody>
          </table>
        </div>
      </div>
      <div class="card-body d-flex justify-content-between align-items-center" id="poPagination"></div>
    </div>`;
  document.getElementById('poSearch').addEventListener('input', e => { purchaseState.search = e.target.value; purchaseState.page = 1; renderPOTable(); });
  document.getElementById('poStatus').addEventListener('change', e => { purchaseState.status = e.target.value; purchaseState.page = 1; renderPOTable(); });
  document.getElementById('poExport').addEventListener('click', () => {
    exportCSV('purchase_orders.csv', ['PO #','Date','Supplier','Items','Total','Status','Payment'],
      PURCHASES.map(p => [p.poNumber, fmtDate(p.date), p.supplierName, p.items.length, p.total, p.status, p.payStatus]));
  });
  renderPOTable();
}

function renderPOTable() {
  let items = [...PURCHASES];
  if (purchaseState.search) { const q = purchaseState.search.toLowerCase(); items = items.filter(p => p.poNumber.toLowerCase().includes(q) || p.supplierName.toLowerCase().includes(q)); }
  if (purchaseState.status !== 'all') items = items.filter(p => p.status === purchaseState.status);
  const paged = paginate(items, purchaseState.page, purchaseState.perPage);
  const body = document.getElementById('poTableBody');
  if (!items.length) body.innerHTML = `<tr><td colspan="9">${emptyState('bi-cart-plus','No purchase orders','Create a new PO to get started.')}</td></tr>`;
  else body.innerHTML = paged.map(p => `
    <tr class="cursor-pointer" data-po-detail="${p.id}">
      <td class="fw-600">${p.poNumber}</td><td>${fmtDate(p.date)}</td><td>${p.supplierName}</td><td>${p.items.length}</td>
      <td class="text-money fw-600">${fmtMoney(p.total)}</td>
      <td>${statusBadge(p.payStatus)}</td><td>${statusBadge(p.status)}</td><td>${fmtDate(p.expectedDate)}</td>
      <td class="text-end" onclick="event.stopPropagation()">
        <div class="table-actions">
          <button class="icon-btn" data-po-detail="${p.id}" title="View"><i class="bi bi-eye"></i></button>
          <button class="icon-btn success" data-po-receive="${p.id}" title="Receive" ${p.status==='received'?'disabled':''}><i class="bi bi-truck"></i></button>
          <button class="icon-btn" data-print-po="${p.id}" title="Print"><i class="bi bi-printer"></i></button>
        </div>
      </td>
    </tr>`).join('');
  body.querySelectorAll('[data-po-detail]').forEach(b => b.addEventListener('click', () => showPODetail(b.dataset.poDetail)));
  body.querySelectorAll('[data-po-receive]').forEach(b => b.addEventListener('click', () => showGRNModal(b.dataset.poReceive)));
  body.querySelectorAll('[data-print-po]').forEach(b => b.addEventListener('click', () => showToast('Printing PO (demo)', 'info')));
  const pag = document.getElementById('poPagination');
  pag.innerHTML = `<div class="small text-muted">${items.length} purchase orders</div>${renderPagination(items.length, purchaseState.page, purchaseState.perPage, p=>{purchaseState.page=p;renderPOTable();})}`;
  attachPaginationClicks(pag, p => { purchaseState.page = p; renderPOTable(); });
}

function showPODetail(id) {
  const po = PURCHASES.find(p => p.id === id);
  const body = `
    <div class="invoice-box">
      <div class="invoice-header"><div><h5 class="fw-700">${po.poNumber}</h5><div class="small text-muted">${fmtDate(po.date)}</div></div><div class="invoice-meta"><div class="fw-600">${po.supplierName}</div><div>${statusBadge(po.status)}</div></div></div>
      <table class="table"><thead><tr><th>Product</th><th>Qty</th><th>Cost</th><th>Received</th><th class="text-end">Total</th></tr></thead><tbody>
      ${po.items.map(it => `<tr><td>${it.name}</td><td>${it.qty}</td><td>${fmtMoney(it.cost)}</td><td>${it.received}/${it.qty}</td><td class="text-end">${fmtMoney(it.total)}</td></tr>`).join('')}
      </tbody></table>
      <div class="text-end"><div class="fw-700 fs-5">Total: ${fmtMoney(po.total)}</div></div>
      <div class="small text-muted mt-2">Expected delivery: ${fmtDate(po.expectedDate)}</div>
    </div>`;
  const footer = `<button class="btn btn-light" data-bs-dismiss="modal">Close</button><button class="btn btn-outline-secondary" id="poPrint"><i class="bi bi-printer me-1"></i>Print</button><button class="btn btn-primary" id="poReceive" ${po.status==='received'?'disabled':''}><i class="bi bi-truck me-1"></i>Receive Goods</button>`;
  const modal = formModal('Purchase Order — ' + po.poNumber, body, footer, 'lg');
  document.getElementById('poPrint').addEventListener('click', () => showToast('Printing PO (demo)', 'info'));
  document.getElementById('poReceive')?.addEventListener('click', () => { modal.hide(); showGRNModal(id); });
}

function createPOModal() {
  const body = `<form id="poForm">
    <div class="row g-3 mb-3">
      <div class="col-md-6"><label class="form-label">Supplier *</label><select class="form-select" id="poSupplier">${SUPPLIERS.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select></div>
      <div class="col-md-3"><label class="form-label">PO Date</label><input type="date" class="form-control" id="poDate" value="${new Date().toISOString().slice(0,10)}"></div>
      <div class="col-md-3"><label class="form-label">Expected Delivery</label><input type="date" class="form-control" id="poExpected"></div>
    </div>
    <div class="mb-3"><label class="form-label">Add Products</label>
      <div class="border rounded p-2" id="poItems" style="min-height:80px;">
        <div class="d-flex gap-2 align-items-end mb-2">
          <div class="flex-grow-1"><select class="form-select form-select-sm" id="poProdSelect">${PRODUCTS.map(p=>`<option value="${p.id}" data-cost="${p.cost}">${p.name} (${fmtMoney(p.cost)})</option>`).join('')}</select></div>
          <div style="width:80px;"><input type="number" class="form-control form-control-sm" id="poProdQty" placeholder="Qty" min="1" value="10"></div>
          <button type="button" class="btn btn-soft-primary btn-sm" id="poAddItem"><i class="bi bi-plus-lg"></i></button>
        </div>
        <table class="table table-sm" id="poItemsTable"><tbody></tbody></table>
      </div>
    </div>
    <div class="mb-3"><label class="form-label">Notes</label><textarea class="form-control" id="poNotes" rows="2"></textarea></div>
  </form>`;
  const footer = `<button class="btn btn-light" data-bs-dismiss="modal">Cancel</button><button class="btn btn-primary" id="poSave">Create Purchase Order</button>`;
  const modal = formModal('New Purchase Order', body, footer, 'lg');
  let items = [];
  const refreshItems = () => {
    document.querySelector('#poItemsTable tbody').innerHTML = items.map((it, i) => `<tr><td>${it.name}</td><td>${it.qty}</td><td>${fmtMoney(it.cost)}</td><td class="text-end">${fmtMoney(it.cost*it.qty)}</td><td><button type="button" class="icon-btn danger" data-po-rm="${i}"><i class="bi bi-x-lg"></i></button></td></tr>`).join('') || '<tr><td colspan="5" class="text-muted small">No items added</td></tr>';
    document.querySelectorAll('[data-po-rm]').forEach(b => b.addEventListener('click', () => { items.splice(+b.dataset.poRm, 1); refreshItems(); }));
  };
  refreshItems();
  document.getElementById('poAddItem').addEventListener('click', () => {
    const sel = document.getElementById('poProdSelect');
    const p = productById(sel.value);
    const qty = +document.getElementById('poProdQty').value || 1;
    items.push({ productId: p.id, name: p.name, cost: p.cost, qty, total: +(p.cost*qty).toFixed(2) });
    refreshItems();
  });
  document.getElementById('poSave').addEventListener('click', () => {
    if (!items.length) { showToast('Add at least one product', 'error'); return; }
    const total = items.reduce((s, it) => s + it.total, 0);
    const poNum = 'PO-' + (500 + PURCHASES.length + 1);
    PURCHASES.unshift({ id: 'po-' + Date.now(), poNumber: poNum, date: new Date().toISOString(), supplierId: document.getElementById('poSupplier').value, supplierName: supplierName(document.getElementById('poSupplier').value), items, total: +total.toFixed(2), status: 'draft', payStatus: 'unpaid', expectedDate: document.getElementById('poExpected').value || new Date(Date.now()+7*86400000).toISOString() });
    modal.hide();
    renderPOTab();
    showToast('Purchase order created', 'success');
  });
}

function showGRNModal(id) {
  const po = PURCHASES.find(p => p.id === id);
  const body = `<form id="grnForm">
    <div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>Receive goods for <strong>${po.poNumber}</strong> from ${po.supplierName}</div>
    <table class="table"><thead><tr><th>Product</th><th>Ordered</th><th>Received</th><th>This Delivery</th></tr></thead><tbody>
    ${po.items.map((it, i) => `<tr><td>${it.name}</td><td>${it.qty}</td><td>${it.received}</td><td><input type="number" class="form-control form-control-sm" style="width:80px;" data-grn-qty="${i}" value="${Math.max(0, it.qty - it.received)}" min="0" max="${it.qty - it.received}"></td></tr>`).join('')}
    </tbody></table>
    <div class="mb-3"><label class="form-label">Notes</label><textarea class="form-control" id="grnNotes" rows="2"></textarea></div>
  </form>`;
  const footer = `<button class="btn btn-light" data-bs-dismiss="modal">Cancel</button><button class="btn btn-primary" id="grnSave">Mark as Received</button>`;
  const modal = formModal('Goods Received Note — ' + po.poNumber, body, footer, 'lg');
  document.getElementById('grnSave').addEventListener('click', () => {
    let allReceived = true;
    po.items.forEach((it, i) => {
      const qty = +document.querySelector(`[data-grn-qty="${i}"]`).value || 0;
      it.received += qty;
      const p = productById(it.productId);
      if (p) p.stock += qty;
      if (it.received < it.qty) allReceived = false;
    });
    po.status = allReceived ? 'received' : 'partially_received';
    modal.hide();
    renderPOTab();
    showToast('Goods received and stock updated', 'success');
  });
}

function renderGRN(c) {
  const received = PURCHASES.filter(p => p.status === 'received' || p.status === 'partially_received');
  c.innerHTML = `<div class="card table-card"><div class="card-header">Goods Received Notes</div><div class="card-body p-0">
    <div class="table-responsive"><table class="table table-hover"><thead><tr><th>PO #</th><th>Supplier</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th></tr></thead><tbody>
    ${received.map(p => `<tr><td class="fw-600">${p.poNumber}</td><td>${p.supplierName}</td><td>${fmtDate(p.date)}</td><td>${p.items.length}</td><td>${fmtMoney(p.total)}</td><td>${statusBadge(p.status)}</td></tr>`).join('') || `<tr><td colspan="6">${emptyState('bi-truck','No GRNs yet','Received goods will appear here.')}</td></tr>`}
    </tbody></table></div></div></div>`;
}

function renderPOReturns(c) {
  c.innerHTML = `<div class="card"><div class="card-body">${emptyState('bi-box-arrow-left', 'No purchase returns', 'Return items to suppliers from a received purchase order.')}</div></div>`;
}
