/* ===========================
   NovaPOS — Helper Utilities
   =========================== */

function fmtMoney(n) {
  if (n == null || isNaN(n)) return CURRENCY + '0.00';
  return CURRENCY + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function statusBadge(status) {
  const map = {
    completed: 'bg-soft-success', active: 'bg-soft-success', received: 'bg-soft-success', paid: 'bg-soft-success', ready: 'bg-soft-success',
    pending: 'bg-soft-warning', ordered: 'bg-soft-warning', partially_received: 'bg-soft-warning', partial: 'bg-soft-warning', low: 'bg-soft-warning', processing: 'bg-soft-warning',
    refunded: 'bg-soft-info', draft: 'bg-soft-secondary', inactive: 'bg-soft-secondary', cancelled: 'bg-soft-danger',
    unpaid: 'bg-soft-danger', due: 'bg-soft-danger', out_of_stock: 'bg-soft-danger',
  };
  const cls = map[status] || 'bg-soft-secondary';
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return `<span class="badge ${cls}">${label}</span>`;
}

function stockBadge(stock, reorder) {
  if (stock <= 0) return '<span class="badge bg-soft-danger">Out of Stock</span>';
  if (stock <= reorder) return '<span class="badge bg-soft-warning">Low Stock</span>';
  return '<span class="badge bg-soft-success">In Stock</span>';
}

function avatarLetter(name) {
  return (name || '?').charAt(0).toUpperCase();
}

function showToast(message, type) {
  type = type || 'success';
  const id = 'toast-' + Date.now();
  const bgClass = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : type === 'warning' ? 'bg-warning' : 'bg-primary';
  const icon = type === 'success' ? 'bi-check-circle' : type === 'error' ? 'bi-x-circle' : type === 'warning' ? 'bi-exclamation-triangle' : 'bi-info-circle';
  const html = `
    <div class="toast align-items-center text-white ${bgClass} border-0" id="${id}" role="alert">
      <div class="d-flex">
        <div class="toast-body"><i class="bi ${icon} me-2"></i>${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>`;
  document.getElementById('toastContainer').insertAdjacentHTML('beforeend', html);
  const el = document.getElementById(id);
  const toast = new bootstrap.Toast(el, { delay: 3000 });
  toast.show();
  el.addEventListener('hidden.bs.toast', () => el.remove());
}

function paginate(arr, page, perPage) {
  const start = (page - 1) * perPage;
  return arr.slice(start, start + perPage);
}

function renderPagination(totalItems, currentPage, perPage, onPageChange) {
  const totalPages = Math.ceil(totalItems / perPage);
  if (totalPages <= 1) return '';
  let html = '<nav><ul class="pagination justify-content-center">';
  html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage - 1}"><i class="bi bi-chevron-left"></i></a></li>`;
  const maxBtns = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxBtns - 1);
  if (endPage - startPage < maxBtns - 1) startPage = Math.max(1, endPage - maxBtns + 1);
  for (let i = startPage; i <= endPage; i++) {
    html += `<li class="page-item ${i === currentPage ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
  }
  html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage + 1}"><i class="bi bi-chevron-right"></i></a></li>`;
  html += '</ul></nav>';
  return html;
}

function emptyState(icon, title, message, actionLabel, actionId) {
  let btn = '';
  if (actionLabel) btn = `<button class="btn btn-primary mt-3" id="${actionId || 'emptyAction'}">${actionLabel}</button>`;
  return `<div class="empty-state"><div class="empty-icon"><i class="bi ${icon}"></i></div><h5>${title}</h5><p>${message}</p>${btn}</div>`;
}

function skeletonRows(count, cols) {
  let html = '';
  for (let i = 0; i < count; i++) {
    let cells = '';
    for (let j = 0; j < cols; j++) cells += `<td><div class="skeleton skeleton-line ${j === 0 ? '' : 'short'}"></div></td>`;
    html += `<tr>${cells}</tr>`;
  }
  return html;
}

function exportCSV(filename, headers, rows) {
  const csv = [headers.join(',')];
  rows.forEach(r => {
    csv.push(r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','));
  });
  const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  showToast('Exported to CSV', 'success');
}

function printHTML(html) {
  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 300);
}

function confirmModal(title, message, onConfirm, confirmText) {
  const html = `
    <div class="modal fade" id="confirmModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="bi bi-exclamation-triangle text-warning me-2"></i>${title}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body"><p class="mb-0">${message}</p></div>
          <div class="modal-footer">
            <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-danger" id="confirmModalBtn">${confirmText || 'Delete'}</button>
          </div>
        </div>
      </div>
    </div>`;
  const root = document.getElementById('modalRoot');
  root.innerHTML = html;
  const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
  modal.show();
  document.getElementById('confirmModalBtn').onclick = () => {
    modal.hide();
    if (onConfirm) onConfirm();
  };
  document.getElementById('confirmModal').addEventListener('hidden.bs.modal', () => { root.innerHTML = ''; });
}

function formModal(title, bodyHtml, footerHtml, size) {
  const sz = size ? `modal-${size}` : '';
  const html = `
    <div class="modal fade" id="formModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable ${sz}">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${title}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">${bodyHtml}</div>
          ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
        </div>
      </div>
    </div>`;
  const root = document.getElementById('modalRoot');
  root.innerHTML = html;
  const modal = new bootstrap.Modal(document.getElementById('formModal'));
  modal.show();
  document.getElementById('formModal').addEventListener('hidden.bs.modal', () => { root.innerHTML = ''; });
  return modal;
}

function breadcrumb(items) {
  let html = '';
  items.forEach((it, i) => {
    if (i > 0) html += ' <i class="bi bi-chevron-right small mx-1"></i> ';
    if (i === items.length - 1) html += `<span class="bc-current">${it.label}</span>`;
    else html += `<a href="#" class="text-decoration-none" data-nav="${it.view}">${it.label}</a>`;
  });
  document.getElementById('breadcrumb').innerHTML = html;
}

function attachPaginationClicks(container, onPageChange) {
  if (!container) return;
  container.querySelectorAll('.page-link').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const p = parseInt(a.dataset.page);
      if (p && p > 0) onPageChange(p);
    });
  });
}

/**
 * Fetch wrapper for the /catalog/* JSON endpoints (see routes/web.php).
 * Attaches the CSRF token (from the <meta> tag in app.blade.php) on
 * any state-changing request, sends/parses JSON automatically unless
 * the body is FormData (file uploads), and throws an Error carrying
 * .status and .errors (Laravel's 422 validation shape) on failure so
 * callers can show field-level messages.
 */
async function apiFetch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const isFormData = options.body instanceof FormData;
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;

  const headers = { Accept: 'application/json', ...(options.headers || {}) };
  if (!isFormData && options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (csrfToken && method !== 'GET') {
    headers['X-CSRF-TOKEN'] = csrfToken;
  }

  const body = !isFormData && options.body && typeof options.body !== 'string'
    ? JSON.stringify(options.body)
    : options.body;

  const res = await fetch(url, { ...options, method, headers, body, credentials: 'same-origin' });

  let payload = null;
  try { payload = await res.json(); } catch (e) { /* empty body, e.g. 204 */ }

  if (!res.ok) {
    const error = new Error(payload?.message || `Request failed (${res.status})`);
    error.status = res.status;
    error.errors = payload?.errors || null;
    throw error;
  }

  return payload;
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * A loading placeholder safe to drop into any plain container
 * (unlike skeletonRows(), which generates <tr>/<td> markup and only
 * belongs inside a <tbody>).
 */
function simpleLoading() {
  return '<div class="text-center text-muted py-5"><div class="spinner-border spinner-border-sm me-2"></div>Loading…</div>';
}

/**
 * Product thumbnail — a real uploaded image if there is one, otherwise
 * a generic icon placeholder. Shared by products.js and inventory.js.
 */
function productThumb(p, size = 40) {
  if (p.image_url) {
    return `<img src="${p.image_url}" class="product-thumb" style="width:${size}px;height:${size}px;">`;
  }
  return `<div class="product-thumb" style="width:${size}px;height:${size}px;"><i class="bi bi-box-seam"></i></div>`;
}
