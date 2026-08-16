/* Purchases View — PO creation and Goods Received wired to real
   /catalog/purchases endpoints. Purchase Returns tab is untouched —
   it was already just a static placeholder in the original mock, no
   real logic to break; that's its own upcoming roadmap item. */

let purchaseState = { page: 1, perPage: 10, search: '', status: 'all', subTab: 'list' };
let purchaseSuppliers = [];
let purchaseProducts = [];

registerView('purchases', async function() {
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

  try {
    const [suppliersRes, productsRes] = await Promise.all([
      apiFetch('/catalog/suppliers'),
      apiFetch('/catalog/products?status=active&per_page=1000'),
    ]);
    purchaseSuppliers = suppliersRes.data;
    purchaseProducts = productsRes.data;
  } catch (e) {
    document.getElementById('poTabContent').innerHTML = emptyState('bi-exclamation-triangle', "Couldn't load purchases", e.message);
    return;
  }

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
      <div class="search-box"><i class="bi bi-search"></i><input type="text" class="form-control" id="poSearch" placeholder="Search PO # or supplier…" value="${purchaseState.search}"></div>
      <select class="form-select form-select-sm" id="poStatus" style="width:auto;">
        <option value="all">All Status</option>
        <option value="draft" ${purchaseState.status === 'draft' ? 'selected' : ''}>Draft</option>
        <option value="ordered" ${purchaseState.status === 'ordered' ? 'selected' : ''}>Ordered</option>
        <option value="received" ${purchaseState.status === 'received' ? 'selected' : ''}>Received</option>
        <option value="partially_received" ${purchaseState.status === 'partially_received' ? 'selected' : ''}>Partially Received</option>
        <option value="cancelled" ${purchaseState.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
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
  document.getElementById('poSearch').addEventListener('input', debounce(e => { purchaseState.search = e.target.value; purchaseState.page = 1; renderPOTable(); }, 350));
  document.getElementById('poStatus').addEventListener('change', e => { purchaseState.status = e.target.value; purchaseState.page = 1; renderPOTable(); });
  document.getElementById('poExport').addEventListener('click', exportPurchases);
  renderPOTable();
}

function buildPOQuery(extra = {}) {
  const params = new URLSearchParams();
  if (purchaseState.search) params.set('q', purchaseState.search);
  if (purchaseState.status !== 'all') params.set('status', purchaseState.status);
  Object.entries(extra).forEach(([k, v]) => params.set(k, v));
  return params.toString();
}

async function renderPOTable() {
  const body = document.getElementById('poTableBody');
  body.innerHTML = skeletonRows(6, 9);

  let result;
  try {
    const qs = buildPOQuery({ page: purchaseState.page, per_page: purchaseState.perPage });
    result = await apiFetch(`/catalog/purchases?${qs}`);
  } catch (e) {
    body.innerHTML = `<tr><td colspan="9">${emptyState('bi-exclamation-triangle', "Couldn't load purchase orders", e.message)}</td></tr>`;
    document.getElementById('poPagination').innerHTML = '';
    return;
  }

  const items = result.data;
  const meta = result.meta;

  if (!items.length) {
    body.innerHTML = `<tr><td colspan="9">${emptyState('bi-cart-plus', 'No purchase orders', 'Create a new PO to get started.')}</td></tr>`;
  } else {
    body.innerHTML = items.map(p => `
      <tr class="cursor-pointer" data-po-detail="${p.id}">
        <td class="fw-600">${p.po_no}</td><td>${fmtDate(p.purchase_date)}</td><td>${p.supplier?.name || '—'}</td><td>${p.items_count}</td>
        <td class="text-money fw-600">${fmtMoney(p.grand_total)}</td>
        <td>${statusBadge(p.payment_status)}</td><td>${statusBadge(p.status)}</td><td>${p.expected_date ? fmtDate(p.expected_date) : '—'}</td>
        <td class="text-end" onclick="event.stopPropagation()">
          <div class="table-actions">
            <button class="icon-btn" data-po-detail="${p.id}" title="View"><i class="bi bi-eye"></i></button>
            <button class="icon-btn success" data-po-receive="${p.id}" title="Receive" ${p.status === 'received' || p.status === 'cancelled' ? 'disabled' : ''}><i class="bi bi-truck"></i></button>
            <button class="icon-btn" data-print-po="${p.id}" title="Print"><i class="bi bi-printer"></i></button>
          </div>
        </td>
      </tr>`).join('');
    body.querySelectorAll('[data-po-detail]').forEach(b => b.addEventListener('click', () => showPODetail(b.dataset.poDetail)));
    body.querySelectorAll('[data-po-receive]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); showGRNModal(b.dataset.poReceive); }));
    body.querySelectorAll('[data-print-po]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); showToast('PO printing is not built yet', 'info'); }));
  }

  const pag = document.getElementById('poPagination');
  pag.innerHTML = `<div class="small text-muted">${meta.total} purchase orders</div>${renderPagination(meta.total, meta.current_page, meta.per_page, p => { purchaseState.page = p; renderPOTable(); })}`;
  attachPaginationClicks(pag, p => { purchaseState.page = p; renderPOTable(); });
}

async function exportPurchases() {
  let result;
  try {
    const qs = buildPOQuery({ per_page: 1000 });
    result = await apiFetch(`/catalog/purchases?${qs}`);
  } catch (e) {
    showToast("Couldn't export: " + e.message, 'error');
    return;
  }
  exportCSV('purchase_orders.csv', ['PO #', 'Date', 'Supplier', 'Items', 'Total', 'Status', 'Payment'],
    result.data.map(p => [p.po_no, fmtDate(p.purchase_date), p.supplier?.name, p.items_count, p.grand_total, p.status, p.payment_status]));
}

async function showPODetail(id) {
  const modal = formModal('Purchase Order', simpleLoading(), '<button class="btn btn-light" data-bs-dismiss="modal">Close</button>', 'lg');

  let po;
  try {
    const result = await apiFetch(`/catalog/purchases/${id}`);
    po = result.data;
  } catch (e) {
    document.querySelector('.modal-body').innerHTML = emptyState('bi-exclamation-triangle', "Couldn't load purchase order", e.message);
    return;
  }

  const body = `
    <div class="invoice-box">
      <div class="invoice-header"><div><h5 class="fw-700">${po.po_no}</h5><div class="small text-muted">${fmtDate(po.purchase_date)}</div></div><div class="invoice-meta"><div class="fw-600">${po.supplier?.name || '—'}</div><div>${statusBadge(po.status)}</div></div></div>
      <table class="table"><thead><tr><th>Product</th><th>Ordered</th><th>Cost</th><th>Received</th><th class="text-end">Total</th></tr></thead><tbody>
      ${po.items.map(it => `<tr><td>${it.name}</td><td>${it.quantity} ${it.unit || ''}</td><td>${fmtMoney(it.unit_cost)}</td><td>${it.received_quantity}/${it.quantity}</td><td class="text-end">${fmtMoney(it.line_total)}</td></tr>`).join('')}
      </tbody></table>
      <div class="text-end">
        <div class="d-flex justify-content-end gap-3 small text-muted"><span>Subtotal ${fmtMoney(po.subtotal)}</span><span>Discount -${fmtMoney(po.discount)}</span><span>Tax ${fmtMoney(po.tax_total)}</span></div>
        <div class="fw-700 fs-5">Total: ${fmtMoney(po.grand_total)}</div>
      </div>
      <div class="small text-muted mt-2">Expected delivery: ${po.expected_date ? fmtDate(po.expected_date) : 'Not set'}</div>
    </div>`;

  document.querySelector('.modal-title').textContent = 'Purchase Order — ' + po.po_no;
  document.querySelector('.modal-body').innerHTML = body;
  document.querySelector('.modal-footer').innerHTML = `<button class="btn btn-light" data-bs-dismiss="modal">Close</button><button class="btn btn-outline-secondary" id="poPrint"><i class="bi bi-printer me-1"></i>Print</button><button class="btn btn-primary" id="poReceive" ${po.status === 'received' || po.status === 'cancelled' ? 'disabled' : ''}><i class="bi bi-truck me-1"></i>Receive Goods</button>`;
  document.getElementById('poPrint').addEventListener('click', () => showToast('PO printing is not built yet', 'info'));
  document.getElementById('poReceive')?.addEventListener('click', () => { modal.hide(); showGRNModal(id); });
}

function createPOModal() {
  const body = `<form id="poForm">
    <div class="row g-3 mb-3">
      <div class="col-md-6"><label class="form-label">Supplier *</label><select class="form-select" id="poSupplier">${purchaseSuppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select></div>
      <div class="col-md-3"><label class="form-label">Expected Delivery</label><input type="date" class="form-control" id="poExpected"></div>
      <div class="col-md-3"><label class="form-label">Discount</label><div class="input-group"><span class="input-group-text">${CURRENCY}</span><input type="number" class="form-control" id="poDiscount" min="0" step="0.01" value="0"></div></div>
    </div>
    <div class="mb-3"><label class="form-label">Add Products</label>
      <div class="border rounded p-2" id="poItems" style="min-height:80px;">
        <div class="d-flex gap-2 align-items-end mb-2">
          <div class="flex-grow-1"><select class="form-select form-select-sm" id="poProdSelect">${purchaseProducts.map(p => `<option value="${p.id}">${p.name} (${fmtMoney(p.cost_price)})</option>`).join('')}</select></div>
          <div style="width:80px;"><input type="number" class="form-control form-control-sm" id="poProdQty" placeholder="Qty" min="1" value="10"></div>
          <button type="button" class="btn btn-soft-primary btn-sm" id="poAddItem"><i class="bi bi-plus-lg"></i></button>
        </div>
        <table class="table table-sm" id="poItemsTable"><tbody></tbody></table>
      </div>
    </div>
  </form>`;
  const footer = `<button class="btn btn-light" data-bs-dismiss="modal">Cancel</button><button class="btn btn-primary" id="poSave">Create Purchase Order</button>`;
  const modal = formModal('New Purchase Order', body, footer, 'lg');

  let items = [];
  const refreshItems = () => {
    document.querySelector('#poItemsTable tbody').innerHTML = items.map((it, i) => `<tr><td>${it.name}</td><td>${it.qty}</td><td>${fmtMoney(it.cost)}</td><td class="text-end">${fmtMoney(it.cost * it.qty)}</td><td><button type="button" class="icon-btn danger" data-po-rm="${i}"><i class="bi bi-x-lg"></i></button></td></tr>`).join('') || '<tr><td colspan="5" class="text-muted small">No items added</td></tr>';
    document.querySelectorAll('[data-po-rm]').forEach(b => b.addEventListener('click', () => { items.splice(+b.dataset.poRm, 1); refreshItems(); }));
  };
  refreshItems();

  document.getElementById('poAddItem').addEventListener('click', () => {
    const sel = document.getElementById('poProdSelect');
    const p = purchaseProducts.find(x => String(x.id) === sel.value);
    const qty = +document.getElementById('poProdQty').value || 1;
    if (items.some(it => it.productId === p.id)) { showToast('That product is already on this order — remove it first to change quantity', 'warning'); return; }
    items.push({ productId: p.id, name: p.name, cost: p.cost_price, qty });
    refreshItems();
  });

  document.getElementById('poSave').addEventListener('click', async () => {
    if (!items.length) { showToast('Add at least one product', 'error'); return; }

    const payload = {
      supplier_id: +document.getElementById('poSupplier').value,
      expected_date: document.getElementById('poExpected').value || null,
      discount: +document.getElementById('poDiscount').value || 0,
      items: items.map(it => ({ product_id: it.productId, quantity: it.qty })),
    };

    const saveBtn = document.getElementById('poSave');
    saveBtn.disabled = true;
    try {
      await apiFetch('/catalog/purchases', { method: 'POST', body: payload });
    } catch (e) {
      saveBtn.disabled = false;
      showToast(e.errors ? Object.values(e.errors).flat()[0] : e.message, 'error');
      return;
    }

    modal.hide();
    renderPOTab();
    showToast('Purchase order created', 'success');
  });
}

async function showGRNModal(id) {
  const modal = formModal('Goods Received Note', simpleLoading(), '<button class="btn btn-light" data-bs-dismiss="modal">Cancel</button>', 'lg');

  let po;
  try {
    const result = await apiFetch(`/catalog/purchases/${id}`);
    po = result.data;
  } catch (e) {
    document.querySelector('.modal-body').innerHTML = emptyState('bi-exclamation-triangle', "Couldn't load purchase order", e.message);
    return;
  }

  if (po.status === 'received' || po.status === 'cancelled') {
    document.querySelector('.modal-body').innerHTML = emptyState('bi-info-circle', 'Nothing to receive', `This purchase order is already ${po.status}.`);
    return;
  }

  const body = `<form id="grnForm">
    <div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>Receive goods for <strong>${po.po_no}</strong> from ${po.supplier?.name || '—'}</div>
    <table class="table"><thead><tr><th>Product</th><th>Ordered</th><th>Received</th><th>This Delivery</th></tr></thead><tbody>
    ${po.items.map(it => {
      const outstanding = it.quantity - it.received_quantity;
      return `<tr><td>${it.name}</td><td>${it.quantity} ${it.unit || ''}</td><td>${it.received_quantity}</td><td><input type="number" class="form-control form-control-sm" style="width:90px;" data-grn-item="${it.id}" value="${outstanding}" min="0" max="${outstanding}" ${outstanding <= 0 ? 'disabled' : ''}></td></tr>`;
    }).join('')}
    </tbody></table>
  </form>`;
  document.querySelector('.modal-title').textContent = 'Goods Received Note — ' + po.po_no;
  document.querySelector('.modal-body').innerHTML = body;
  document.querySelector('.modal-footer').innerHTML = `<button class="btn btn-light" data-bs-dismiss="modal">Cancel</button><button class="btn btn-primary" id="grnSave">Mark as Received</button>`;

  document.getElementById('grnSave').addEventListener('click', async () => {
    const payload = {
      items: po.items.map(it => ({
        purchase_item_id: it.id,
        quantity: +document.querySelector(`[data-grn-item="${it.id}"]`).value || 0,
      })),
    };

    const saveBtn = document.getElementById('grnSave');
    saveBtn.disabled = true;
    try {
      await apiFetch(`/catalog/purchases/${id}/receive`, { method: 'POST', body: payload });
    } catch (e) {
      saveBtn.disabled = false;
      showToast(e.errors ? Object.values(e.errors).flat()[0] : e.message, 'error');
      return;
    }

    modal.hide();
    renderPOTab();
    showToast('Goods received and stock updated', 'success');
  });
}

async function renderGRN(c) {
  c.innerHTML = simpleLoading();
  let result;
  try {
    result = await apiFetch('/catalog/purchases?per_page=1000');
  } catch (e) {
    c.innerHTML = emptyState('bi-exclamation-triangle', "Couldn't load goods received", e.message);
    return;
  }
  const received = result.data.filter(p => p.status === 'received' || p.status === 'partially_received');
  c.innerHTML = `<div class="card table-card"><div class="card-header">Goods Received Notes</div><div class="card-body p-0">
    <div class="table-responsive"><table class="table table-hover"><thead><tr><th>PO #</th><th>Supplier</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th></tr></thead><tbody>
    ${received.map(p => `<tr><td class="fw-600">${p.po_no}</td><td>${p.supplier?.name || '—'}</td><td>${fmtDate(p.purchase_date)}</td><td>${p.items_count}</td><td>${fmtMoney(p.grand_total)}</td><td>${statusBadge(p.status)}</td></tr>`).join('') || `<tr><td colspan="6">${emptyState('bi-truck', 'No GRNs yet', 'Received goods will appear here.')}</td></tr>`}
    </tbody></table></div></div></div>`;
}

function renderPOReturns(c) {
  c.innerHTML = `<div class="card"><div class="card-body">${emptyState('bi-box-arrow-left', 'No purchase returns', 'Return items to suppliers from a received purchase order.')}</div></div>`;
}
