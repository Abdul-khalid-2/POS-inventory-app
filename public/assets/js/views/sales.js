/* Sales View — wired to real /catalog/sales endpoint */

let salesState = { page: 1, perPage: 10, search: '', status: 'all', method: 'all' };

registerView('sales', function() {
  breadcrumb([{ label: 'Home', view: 'dashboard' }, { label: 'Sales' }]);
  salesState.page = 1;
  renderSalesList();

  // Deep-link support: /sales?sale=ID auto-opens that sale's detail.
  // Real page navigation (see routes/web.php) means a plain in-memory
  // handoff between screens doesn't survive — the target screen has
  // to read its own URL on load instead.
  const deepLinkId = new URLSearchParams(window.location.search).get('sale');
  if (deepLinkId) showSaleDetail(deepLinkId);
});

function renderSalesList() {
  const html = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div><h1 class="page-title">Sales</h1><div class="subtitle">View and manage all sales transactions</div></div>
      <button class="btn btn-primary btn-sm" data-nav="pos"><i class="bi bi-bag-check me-1"></i>New Sale</button>
    </div>
    <div class="toolbar">
      <div class="search-box"><i class="bi bi-search"></i><input type="text" class="form-control" id="salesSearch" placeholder="Search invoice or customer…" value="${salesState.search}"></div>
      <select class="form-select form-select-sm" id="salesStatus" style="width:auto;">
        <option value="all" ${salesState.status === 'all' ? 'selected' : ''}>All Status</option>
        <option value="completed" ${salesState.status === 'completed' ? 'selected' : ''}>Completed</option>
        <option value="refunded" ${salesState.status === 'refunded' ? 'selected' : ''}>Refunded</option>
        <option value="cancelled" ${salesState.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
      </select>
      <select class="form-select form-select-sm" id="salesMethod" style="width:auto;">
        <option value="all" ${salesState.method === 'all' ? 'selected' : ''}>All Methods</option>
        <option value="cash" ${salesState.method === 'cash' ? 'selected' : ''}>Cash</option>
        <option value="card" ${salesState.method === 'card' ? 'selected' : ''}>Card</option>
        <option value="wallet" ${salesState.method === 'wallet' ? 'selected' : ''}>Mobile Wallet</option>
        <option value="credit" ${salesState.method === 'credit' ? 'selected' : ''}>Credit (balance due)</option>
      </select>
      <div class="toolbar-spacer"></div>
      <button class="btn btn-outline-secondary btn-sm" id="exportSalesBtn"><i class="bi bi-download me-1"></i>Export</button>
    </div>
    <div class="card table-card">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Paid</th><th>Due</th><th>Method</th><th>Status</th><th>Cashier</th><th class="text-end">Actions</th></tr></thead>
            <tbody id="salesTableBody"></tbody>
          </table>
        </div>
      </div>
      <div class="card-body d-flex justify-content-between align-items-center" id="salesPagination"></div>
    </div>`;

  document.getElementById('content').innerHTML = html;
  document.querySelector('[data-nav="pos"]')?.addEventListener('click', e => { e.preventDefault(); navigateTo('pos'); });
  document.getElementById('salesSearch').addEventListener('input', debounce(e => { salesState.search = e.target.value; salesState.page = 1; renderSalesTable(); }, 350));
  document.getElementById('salesStatus').addEventListener('change', e => { salesState.status = e.target.value; salesState.page = 1; renderSalesTable(); });
  document.getElementById('salesMethod').addEventListener('change', e => { salesState.method = e.target.value; salesState.page = 1; renderSalesTable(); });
  document.getElementById('exportSalesBtn').addEventListener('click', exportSales);
  renderSalesTable();
}

function buildSalesQuery(extra = {}) {
  const params = new URLSearchParams();
  if (salesState.search) params.set('q', salesState.search);
  if (salesState.status !== 'all') params.set('status', salesState.status);
  if (salesState.method !== 'all') params.set('payment_method', salesState.method);
  Object.entries(extra).forEach(([k, v]) => params.set(k, v));
  return params.toString();
}

async function renderSalesTable() {
  const body = document.getElementById('salesTableBody');
  body.innerHTML = skeletonRows(6, 11);

  let result;
  try {
    const qs = buildSalesQuery({ page: salesState.page, per_page: salesState.perPage });
    result = await apiFetch(`/catalog/sales?${qs}`);
  } catch (e) {
    body.innerHTML = `<tr><td colspan="11">${emptyState('bi-exclamation-triangle', "Couldn't load sales", e.message)}</td></tr>`;
    document.getElementById('salesPagination').innerHTML = '';
    return;
  }

  const items = result.data;
  const meta = result.meta;

  if (!items.length) {
    body.innerHTML = `<tr><td colspan="11">${emptyState('bi-receipt', 'No sales found', 'Try adjusting filters or create a new sale.')}</td></tr>`;
  } else {
    body.innerHTML = items.map(s => `
      <tr class="cursor-pointer" data-sale-detail="${s.id}">
        <td class="fw-600">${s.invoice_no}</td>
        <td>${fmtDate(s.sale_date)}</td>
        <td>${s.customer?.name || 'Walk-in Customer'}</td>
        <td>${s.items_count}</td>
        <td class="text-money fw-600">${fmtMoney(s.grand_total)}</td>
        <td class="text-money">${fmtMoney(s.paid_amount)}</td>
        <td class="text-money ${s.due_amount > 0 ? 'text-danger fw-600' : ''}">${fmtMoney(s.due_amount)}</td>
        <td><span class="text-capitalize">${s.payment_method_label}</span></td>
        <td>${statusBadge(s.status)}</td>
        <td class="small">${s.cashier?.name || '—'}</td>
        <td class="text-end" onclick="event.stopPropagation()">
          <div class="table-actions">
            <button class="icon-btn" data-sale-detail="${s.id}" title="View"><i class="bi bi-eye"></i></button>
            <button class="icon-btn" data-pdf-sale="${s.id}" title="PDF"><i class="bi bi-file-earmark-pdf"></i></button>
            <button class="icon-btn danger" data-refund-sale="${s.id}" title="Refund" ${s.status !== 'completed' ? 'disabled' : ''}><i class="bi bi-arrow-counterclockwise"></i></button>
          </div>
        </td>
      </tr>`).join('');
    body.querySelectorAll('[data-sale-detail]').forEach(b => b.addEventListener('click', () => showSaleDetail(b.dataset.saleDetail)));
    body.querySelectorAll('[data-pdf-sale]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); window.open(`/sales/${b.dataset.pdfSale}/receipt`, '_blank'); }));
    body.querySelectorAll('[data-refund-sale]').forEach(b => b.addEventListener('click', () => showRefundModal(b.dataset.refundSale)));
  }

  const pag = document.getElementById('salesPagination');
  pag.innerHTML = `<div class="small text-muted">${meta.total} sales</div>${renderPagination(meta.total, meta.current_page, meta.per_page, p => { salesState.page = p; renderSalesTable(); })}`;
  attachPaginationClicks(pag, p => { salesState.page = p; renderSalesTable(); });
}

async function exportSales() {
  let result;
  try {
    const qs = buildSalesQuery({ per_page: 1000 });
    result = await apiFetch(`/catalog/sales?${qs}`);
  } catch (e) {
    showToast("Couldn't export: " + e.message, 'error');
    return;
  }
  exportCSV('sales.csv', ['Invoice', 'Date', 'Customer', 'Items', 'Total', 'Paid', 'Due', 'Method', 'Status', 'Cashier'],
    result.data.map(s => [s.invoice_no, fmtDate(s.sale_date), s.customer?.name || 'Walk-in Customer', s.items_count, s.grand_total, s.paid_amount, s.due_amount, s.payment_method_label, s.status, s.cashier?.name]));
}

window.showSaleDetail = async function(id) {
  const modal = formModal('Sale Detail', simpleLoading(), `<button class="btn btn-light" data-bs-dismiss="modal">Close</button>`, 'lg');

  let s;
  try {
    const result = await apiFetch(`/catalog/sales/${id}`);
    s = result.data;
  } catch (e) {
    document.querySelector('.modal-body').innerHTML = emptyState('bi-exclamation-triangle', "Couldn't load sale", e.message);
    return;
  }

  const body = `
    <div class="invoice-print">
      <div class="invoice-box">
        <div class="invoice-header">
          <div>
            <h4 class="fw-700">NovaPOS</h4>
          </div>
          <div class="invoice-meta">
            <h5 class="fw-700">${s.invoice_no}</h5>
            <div class="small text-muted">${fmtDateTime(s.sale_date)}</div>
            <div class="mt-2">${statusBadge(s.status)}</div>
          </div>
        </div>
        <div class="row mb-3">
          <div class="col-6"><div class="small text-muted">Customer</div><div class="fw-600">${s.customer?.name || 'Walk-in Customer'}</div></div>
          <div class="col-6 text-end"><div class="small text-muted">Cashier</div><div class="fw-600">${s.cashier?.name || '—'}</div></div>
        </div>
        <table class="table invoice-table">
          <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th class="text-end">Total</th></tr></thead>
          <tbody>
            ${s.items.map(it => `<tr><td>${it.name}</td><td>${it.quantity}</td><td>${fmtMoney(it.unit_price)}</td><td class="text-end">${fmtMoney(it.line_total)}</td></tr>`).join('')}
          </tbody>
        </table>
        <div class="row">
          <div class="col-6">
            ${s.payments.length ? `<div class="small text-muted mb-1">Payments</div>${s.payments.map(p => `<div class="d-flex justify-content-between small text-capitalize"><span>${p.method}</span><span>${fmtMoney(p.amount)}</span></div>`).join('')}` : ''}
          </div>
          <div class="col-6">
            <div class="d-flex justify-content-between"><span class="text-muted">Subtotal</span><span>${fmtMoney(s.subtotal)}</span></div>
            <div class="d-flex justify-content-between"><span class="text-muted">Discount</span><span>-${fmtMoney(s.discount)}</span></div>
            <div class="d-flex justify-content-between"><span class="text-muted">Tax</span><span>${fmtMoney(s.tax_total)}</span></div>
            <div class="d-flex justify-content-between fw-700 fs-5 mt-1"><span>Total</span><span>${fmtMoney(s.grand_total)}</span></div>
            <div class="d-flex justify-content-between"><span class="text-muted">Paid</span><span class="text-success">${fmtMoney(s.paid_amount)}</span></div>
            ${s.due_amount > 0 ? `<div class="d-flex justify-content-between"><span class="text-muted">Due</span><span class="text-danger fw-600">${fmtMoney(s.due_amount)}</span></div>` : ''}
          </div>
        </div>
      </div>
    </div>`;
  document.querySelector('.modal-title').textContent = 'Sale Detail — ' + s.invoice_no;
  document.querySelector('.modal-body').innerHTML = body;
  const footer = document.querySelector('.modal-footer');
  footer.innerHTML = `<button class="btn btn-light" data-bs-dismiss="modal">Close</button><button class="btn btn-outline-secondary" id="pdfInvBtn"><i class="bi bi-file-earmark-pdf me-1"></i>PDF</button>`;
  document.getElementById('pdfInvBtn').addEventListener('click', () => window.open(`/sales/${s.id}/receipt`, '_blank'));
}

/**
 * Full-sale refund — matches the "restock toggle" wording in the
 * roadmap (one whole-order decision, not a per-line-item picker).
 * Requires sales:edit — enforced server-side, so a user who can see
 * this button but lacks that permission just gets a clear 403 toast,
 * consistent with how the rest of the app doesn't duplicate
 * permission checks into conditional UI hiding.
 */
async function showRefundModal(id) {
  const modal = formModal('Return / Refund', simpleLoading(), '<button class="btn btn-light" data-bs-dismiss="modal">Cancel</button>');

  let s;
  try {
    const result = await apiFetch(`/catalog/sales/${id}`);
    s = result.data;
  } catch (e) {
    document.querySelector('.modal-body').innerHTML = emptyState('bi-exclamation-triangle', "Couldn't load sale", e.message);
    return;
  }

  if (s.status !== 'completed') {
    document.querySelector('.modal-body').innerHTML = emptyState('bi-info-circle', 'Nothing to refund', `This sale is already ${s.status}.`);
    return;
  }

  const body = `
    <div class="alert alert-warning py-2"><i class="bi bi-exclamation-triangle me-2"></i>Refunding <strong>${s.invoice_no}</strong> (${fmtMoney(s.grand_total)}) — this reverses the whole sale.</div>
    <div class="mb-3">
      <label class="form-label small text-muted mb-1">Items</label>
      <div class="border rounded p-2">
        ${s.items.map(it => `<div class="d-flex justify-content-between small py-1"><span>${it.name}</span><span>${it.quantity} &times; ${fmtMoney(it.unit_price)}</span></div>`).join('')}
      </div>
    </div>
    <div class="mb-3"><label class="form-label">Reason (optional)</label><textarea class="form-control" id="refundReason" rows="2"></textarea></div>
    <div class="form-check mb-2"><input type="checkbox" class="form-check-input" id="refundRestock" checked><label class="form-check-label" for="refundRestock">Restock returned items</label></div>
    ${s.due_amount > 0 && s.customer ? `<div class="small text-muted"><i class="bi bi-info-circle me-1"></i>${fmtMoney(s.due_amount)} will be removed from ${s.customer.name}'s balance.</div>` : ''}`;

  document.querySelector('.modal-title').textContent = 'Return / Refund — ' + s.invoice_no;
  document.querySelector('.modal-body').innerHTML = body;
  document.querySelector('.modal-footer').innerHTML = `<button class="btn btn-light" data-bs-dismiss="modal">Cancel</button><button class="btn btn-danger" id="processRefundBtn">Process Refund</button>`;

  document.getElementById('processRefundBtn').addEventListener('click', async () => {
    const payload = {
      restock: document.getElementById('refundRestock').checked,
      reason: document.getElementById('refundReason').value || null,
    };
    const btn = document.getElementById('processRefundBtn');
    btn.disabled = true;
    try {
      await apiFetch(`/catalog/sales/${id}/refund`, { method: 'POST', body: payload });
    } catch (e) {
      btn.disabled = false;
      showToast(e.errors ? Object.values(e.errors).flat()[0] : e.message, 'error');
      return;
    }
    modal.hide();
    renderSalesTable();
    showToast('Refund processed successfully', 'success');
  });
}
