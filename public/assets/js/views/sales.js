/* Sales View */

let salesState = { page: 1, perPage: 10, search: '', status: 'all', method: 'all', detailId: null };

registerView('sales', function() {
  breadcrumb([{ label: 'Home', view: 'dashboard' }, { label: 'Sales' }]);
  salesState.page = 1;
  renderSalesList();
});

function getFilteredSales() {
  let items = [...SALES];
  if (salesState.search) {
    const q = salesState.search.toLowerCase();
    items = items.filter(s => s.invoice.toLowerCase().includes(q) || s.customerName.toLowerCase().includes(q));
  }
  if (salesState.status !== 'all') items = items.filter(s => s.status === salesState.status);
  if (salesState.method !== 'all') items = items.filter(s => s.method === salesState.method);
  return items;
}

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
        <option value="pending" ${salesState.status === 'pending' ? 'selected' : ''}>Pending</option>
        <option value="refunded" ${salesState.status === 'refunded' ? 'selected' : ''}>Refunded</option>
      </select>
      <select class="form-select form-select-sm" id="salesMethod" style="width:auto;">
        <option value="all" ${salesState.method === 'all' ? 'selected' : ''}>All Methods</option>
        <option value="cash" ${salesState.method === 'cash' ? 'selected' : ''}>Cash</option>
        <option value="card" ${salesState.method === 'card' ? 'selected' : ''}>Card</option>
        <option value="wallet" ${salesState.method === 'wallet' ? 'selected' : ''}>Mobile Wallet</option>
        <option value="credit" ${salesState.method === 'credit' ? 'selected' : ''}>Credit</option>
      </select>
      <div class="toolbar-spacer"></div>
      <button class="btn btn-outline-secondary btn-sm" id="exportSalesBtn"><i class="bi bi-download me-1"></i>Export</button>
    </div>
    <div class="card table-card">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Paid</th><th>Due</th><th>Method</th><th>Status</th><th>Salesperson</th><th class="text-end">Actions</th></tr></thead>
            <tbody id="salesTableBody"></tbody>
          </table>
        </div>
      </div>
      <div class="card-body d-flex justify-content-between align-items-center" id="salesPagination"></div>
    </div>`;

  document.getElementById('content').innerHTML = html;
  document.querySelector('[data-nav="pos"]')?.addEventListener('click', e => { e.preventDefault(); navigateTo('pos'); });
  document.getElementById('salesSearch').addEventListener('input', e => { salesState.search = e.target.value; salesState.page = 1; renderSalesTable(); });
  document.getElementById('salesStatus').addEventListener('change', e => { salesState.status = e.target.value; salesState.page = 1; renderSalesTable(); });
  document.getElementById('salesMethod').addEventListener('change', e => { salesState.method = e.target.value; salesState.page = 1; renderSalesTable(); });
  document.getElementById('exportSalesBtn').addEventListener('click', () => {
    const items = getFilteredSales();
    exportCSV('sales.csv', ['Invoice','Date','Customer','Items','Total','Paid','Due','Method','Status','Salesperson'],
      items.map(s => [s.invoice, fmtDate(s.date), s.customerName, s.itemCount, s.total, s.paid, s.due, s.method, s.status, s.salesperson]));
  });
  renderSalesTable();
}

function renderSalesTable() {
  const items = getFilteredSales();
  const paged = paginate(items, salesState.page, salesState.perPage);
  const body = document.getElementById('salesTableBody');
  if (!items.length) { body.innerHTML = `<tr><td colspan="11">${emptyState('bi-receipt', 'No sales found', 'Try adjusting filters or create a new sale.')}</td></tr>`; }
  else {
    body.innerHTML = paged.map(s => `
      <tr class="cursor-pointer" data-sale-detail="${s.id}">
        <td class="fw-600">${s.invoice}</td>
        <td>${fmtDate(s.date)}</td>
        <td>${s.customerName}</td>
        <td>${s.itemCount}</td>
        <td class="text-money fw-600">${fmtMoney(s.total)}</td>
        <td class="text-money">${fmtMoney(s.paid)}</td>
        <td class="text-money ${s.due > 0 ? 'text-danger fw-600' : ''}">${fmtMoney(s.due)}</td>
        <td><span class="text-capitalize">${s.method}</span></td>
        <td>${statusBadge(s.status)}</td>
        <td class="small">${s.salesperson}</td>
        <td class="text-end" onclick="event.stopPropagation()">
          <div class="table-actions">
            <button class="icon-btn" data-sale-detail="${s.id}" title="View"><i class="bi bi-eye"></i></button>
            <button class="icon-btn" data-print-sale="${s.id}" title="Print"><i class="bi bi-printer"></i></button>
            <button class="icon-btn danger" data-refund-sale="${s.id}" title="Refund" ${s.status === 'refunded' ? 'disabled' : ''}><i class="bi bi-arrow-counterclockwise"></i></button>
          </div>
        </td>
      </tr>`).join('');
    body.querySelectorAll('[data-sale-detail]').forEach(b => b.addEventListener('click', () => showSaleDetail(b.dataset.saleDetail)));
    body.querySelectorAll('[data-print-sale]').forEach(b => b.addEventListener('click', () => printSaleInvoice(b.dataset.printSale)));
    body.querySelectorAll('[data-refund-sale]').forEach(b => b.addEventListener('click', () => showRefundModal(b.dataset.refundSale)));
  }
  const pag = document.getElementById('salesPagination');
  pag.innerHTML = `<div class="small text-muted">${items.length} sales</div>${renderPagination(items.length, salesState.page, salesState.perPage, p => { salesState.page = p; renderSalesTable(); })}`;
  attachPaginationClicks(pag, p => { salesState.page = p; renderSalesTable(); });
}

window.showSaleDetail = function(id) {
  const s = SALES.find(x => x.id === id);
  if (!s) return;
  const body = `
    <div class="invoice-print">
      <div class="invoice-box">
        <div class="invoice-header">
          <div>
            <h4 class="fw-700">${SETTINGS.business.name}</h4>
            <div class="small text-muted">${SETTINGS.business.address}</div>
            <div class="small text-muted">${SETTINGS.business.phone}</div>
          </div>
          <div class="invoice-meta">
            <h5 class="fw-700">${s.invoice}</h5>
            <div class="small text-muted">${fmtDateTime(s.date)}</div>
            <div class="mt-2">${statusBadge(s.status)}</div>
          </div>
        </div>
        <div class="row mb-3">
          <div class="col-6"><div class="small text-muted">Customer</div><div class="fw-600">${s.customerName}</div></div>
          <div class="col-6 text-end"><div class="small text-muted">Salesperson</div><div class="fw-600">${s.salesperson}</div></div>
        </div>
        <table class="table invoice-table">
          <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th class="text-end">Total</th></tr></thead>
          <tbody>
            ${s.items.map(it => `<tr><td>${it.name}</td><td>${it.qty}</td><td>${fmtMoney(it.price)}</td><td class="text-end">${fmtMoney(it.total)}</td></tr>`).join('')}
          </tbody>
        </table>
        <div class="row">
          <div class="col-6"></div>
          <div class="col-6">
            <div class="d-flex justify-content-between"><span class="text-muted">Subtotal</span><span>${fmtMoney(s.subtotal)}</span></div>
            <div class="d-flex justify-content-between"><span class="text-muted">Discount</span><span>-${fmtMoney(s.discount)}</span></div>
            <div class="d-flex justify-content-between"><span class="text-muted">Tax</span><span>${fmtMoney(s.tax)}</span></div>
            <div class="d-flex justify-content-between fw-700 fs-5 mt-1"><span>Total</span><span>${fmtMoney(s.total)}</span></div>
            <div class="d-flex justify-content-between"><span class="text-muted">Paid</span><span class="text-success">${fmtMoney(s.paid)}</span></div>
            ${s.due > 0 ? `<div class="d-flex justify-content-between"><span class="text-muted">Due</span><span class="text-danger fw-600">${fmtMoney(s.due)}</span></div>` : ''}
            <div class="d-flex justify-content-between"><span class="text-muted">Method</span><span class="text-capitalize">${s.method}</span></div>
          </div>
        </div>
      </div>
    </div>`;
  const footer = `<button class="btn btn-light" data-bs-dismiss="modal">Close</button><button class="btn btn-outline-secondary" id="printInvBtn"><i class="bi bi-printer me-1"></i>Print</button><button class="btn btn-outline-secondary" id="downloadInvBtn"><i class="bi bi-download me-1"></i>Download</button>`;
  const modal = formModal('Sale Detail — ' + s.invoice, body, footer, 'lg');
  document.getElementById('printInvBtn').addEventListener('click', () => printSaleInvoice(id));
  document.getElementById('downloadInvBtn').addEventListener('click', () => showToast('Invoice download started (demo)', 'success'));
}

function printSaleInvoice(id) {
  const s = SALES.find(x => x.id === id);
  if (!s) return;
  const html = `<html><head><title>${s.invoice}</title><style>
    body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:30px;}
    table{width:100%;border-collapse:collapse;} th,td{padding:8px;text-align:left;border-bottom:1px solid #ddd;}
    .right{text-align:right;} .bold{font-weight:bold;} .muted{color:#666;}
  </style></head><body>
    <div style="display:flex;justify-content:space-between;">
      <div><h2>${SETTINGS.business.name}</h2><div class="muted">${SETTINGS.business.address}</div><div class="muted">${SETTINGS.business.phone}</div></div>
      <div class="right"><h2>${s.invoice}</h2><div class="muted">${fmtDateTime(s.date)}</div></div>
    </div>
    <hr>
    <div><strong>Customer:</strong> ${s.customerName} &nbsp; <strong>Salesperson:</strong> ${s.salesperson}</div>
    <table><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th class="right">Total</th></tr></thead><tbody>
    ${s.items.map(it => `<tr><td>${it.name}</td><td>${it.qty}</td><td>${fmtMoney(it.price)}</td><td class="right">${fmtMoney(it.total)}</td></tr>`).join('')}
    </tbody></table>
    <div class="right" style="margin-top:20px;">
      <div>Subtotal: ${fmtMoney(s.subtotal)}</div>
      <div>Discount: -${fmtMoney(s.discount)}</div>
      <div>Tax: ${fmtMoney(s.tax)}</div>
      <div class="bold" style="font-size:18px;">Total: ${fmtMoney(s.total)}</div>
      <div>Paid: ${fmtMoney(s.paid)} (${s.method})</div>
      ${s.due > 0 ? `<div>Due: ${fmtMoney(s.due)}</div>` : ''}
    </div>
    <div class="muted" style="text-align:center;margin-top:30px;">${SETTINGS.receipt.footer}</div>
  </body></html>`;
  printHTML(html);
}

function showRefundModal(id) {
  const s = SALES.find(x => x.id === id);
  if (!s) return;
  const body = `
    <form id="refundForm">
      <div class="alert alert-warning"><i class="bi bi-exclamation-triangle me-2"></i>Initiating a return/refund for <strong>${s.invoice}</strong></div>
      <div class="mb-3"><label class="form-label">Select Items to Return</label>
        <div class="border rounded p-2">
          ${s.items.map((it, i) => `
            <div class="d-flex align-items-center gap-2 py-1">
              <input type="checkbox" class="form-check-input" data-refund-item="${i}" checked>
              <div class="flex-grow-1">${it.name} <span class="small text-muted">(${it.qty} x ${fmtMoney(it.price)})</span></div>
              <input type="number" class="form-control form-control-sm" style="width:70px;" data-refund-qty="${i}" value="${it.qty}" min="0" max="${it.qty}">
            </div>`).join('')}
        </div>
      </div>
      <div class="mb-3"><label class="form-label">Reason for Return</label>
        <select class="form-select" id="refundReason">
          <option>Damaged product</option><option>Customer changed mind</option><option>Wrong item</option><option>Expired</option><option>Other</option>
        </select>
      </div>
      <div class="mb-3"><label class="form-label">Refund Method</label>
        <select class="form-select" id="refundMethod"><option>Cash</option><option>Card</option><option>Store Credit</option></select>
      </div>
      <div class="form-check mb-3"><input type="checkbox" class="form-check-input" id="refundRestock" checked><label class="form-check-label" for="refundRestock">Restock returned items</label></div>
    </form>`;
  const footer = `<button class="btn btn-light" data-bs-dismiss="modal">Cancel</button><button class="btn btn-danger" id="processRefundBtn">Process Refund</button>`;
  const modal = formModal('Return / Refund — ' + s.invoice, body, footer);
  document.getElementById('processRefundBtn').addEventListener('click', () => {
    s.status = 'refunded';
    if (document.getElementById('refundRestock').checked) {
      s.items.forEach((it, i) => {
        const cb = document.querySelector(`[data-refund-item="${i}"]`);
        const qty = parseInt(document.querySelector(`[data-refund-qty="${i}"]`).value) || 0;
        if (cb?.checked && qty > 0) { const p = productById(it.productId); if (p) p.stock += qty; }
      });
    }
    modal.hide();
    renderSalesTable();
    showToast('Refund processed successfully', 'success');
  });
}
