/* People View — real CRUD for Customers, Suppliers, and Staff, wired
   to /catalog/{customers,suppliers,staff}. Roles tab intentionally
   left as display-only mock data — role/permission-matrix editing
   isn't part of this checklist item (it's Settings-screen territory).
   Ledger/detail views for customers and suppliers, and "Record
   Payment", are their own upcoming roadmap items — stubbed here with
   an honest toast rather than a silently broken mock lookup. */

let peopleState = { subTab: 'customers', page: 1, perPage: 10, search: '', status: 'all' };
let peopleRoles = [];

registerView('people', async function() {
  breadcrumb([{ label: 'Home', view: 'dashboard' }, { label: 'People' }]);
  peopleState.page = 1;

  const html = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div><h1 class="page-title">People</h1><div class="subtitle">Manage customers, suppliers, staff, and roles</div></div>
    </div>
    <ul class="nav nav-tabs mb-3">
      <li class="nav-item"><button class="nav-link active" data-ptab="customers">Customers</button></li>
      <li class="nav-item"><button class="nav-link" data-ptab="suppliers">Suppliers</button></li>
      <li class="nav-item"><button class="nav-link" data-ptab="staff">Staff</button></li>
      <li class="nav-item"><button class="nav-link" data-ptab="roles">Roles &amp; Permissions</button></li>
    </ul>
    <div id="peopleTabContent"></div>`;
  document.getElementById('content').innerHTML = html;

  try {
    const rolesRes = await apiFetch('/catalog/roles');
    peopleRoles = rolesRes.data;
  } catch (e) { /* staff form's role dropdown just shows empty — non-fatal for other tabs */ }

  document.querySelectorAll('[data-ptab]').forEach(t => t.addEventListener('click', () => {
    document.querySelectorAll('[data-ptab]').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    peopleState.subTab = t.dataset.ptab;
    peopleState.page = 1;
    peopleState.search = '';
    peopleState.status = 'all';
    renderPeopleTab();
  }));
  renderPeopleTab();
});

function renderPeopleTab() {
  const c = document.getElementById('peopleTabContent');
  if (peopleState.subTab === 'customers') renderCustomers(c);
  else if (peopleState.subTab === 'suppliers') renderSuppliers(c);
  else if (peopleState.subTab === 'staff') renderStaff(c);
  else renderRoles(c);
}

/* ===================== Customers ===================== */

function renderCustomers(c) {
  c.innerHTML = `
    <div class="toolbar">
      <div class="search-box"><i class="bi bi-search"></i><input type="text" class="form-control" id="custSearch" placeholder="Search customers…" value="${peopleState.search}"></div>
      <select class="form-select form-select-sm" id="custStatus" style="width:auto;">
        <option value="all">All Status</option>
        <option value="active" ${peopleState.status === 'active' ? 'selected' : ''}>Active</option>
        <option value="inactive" ${peopleState.status === 'inactive' ? 'selected' : ''}>Inactive</option>
      </select>
      <div class="toolbar-spacer"></div>
      <button class="btn btn-primary btn-sm" id="addCustomer"><i class="bi bi-plus-lg me-1"></i>Add Customer</button>
    </div>
    <div class="card table-card">
      <div class="card-body p-0"><div class="table-responsive"><table class="table table-hover">
        <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Total Purchases</th><th>Balance Due</th><th>Status</th><th class="text-end">Actions</th></tr></thead>
        <tbody id="custTableBody"></tbody>
      </table></div></div>
      <div class="card-body d-flex justify-content-between align-items-center" id="custPagination"></div>
    </div>`;
  document.getElementById('custSearch').addEventListener('input', debounce(e => { peopleState.search = e.target.value; peopleState.page = 1; renderCustTable(); }, 350));
  document.getElementById('custStatus').addEventListener('change', e => { peopleState.status = e.target.value; peopleState.page = 1; renderCustTable(); });
  document.getElementById('addCustomer').addEventListener('click', () => customerFormModal());
  renderCustTable();
}

async function renderCustTable() {
  const body = document.getElementById('custTableBody');
  body.innerHTML = skeletonRows(5, 7);
  const params = new URLSearchParams({ page: peopleState.page, per_page: peopleState.perPage });
  if (peopleState.search) params.set('q', peopleState.search);
  if (peopleState.status !== 'all') params.set('status', peopleState.status);

  let result;
  try {
    result = await apiFetch(`/catalog/customers?${params}`);
  } catch (e) {
    body.innerHTML = `<tr><td colspan="7">${emptyState('bi-exclamation-triangle', "Couldn't load customers", e.message)}</td></tr>`;
    return;
  }

  const items = result.data, meta = result.meta;
  body.innerHTML = items.length ? items.map(cust => `
    <tr>
      <td><span class="fw-600">${cust.name}</span></td>
      <td>${cust.phone || '—'}</td><td>${cust.email || '—'}</td>
      <td class="text-money">${fmtMoney(cust.total_purchases)}</td>
      <td class="text-money ${cust.current_balance > 0 ? 'text-danger fw-600' : ''}">${fmtMoney(cust.current_balance)}</td>
      <td>${statusBadge(cust.status)}</td>
      <td class="text-end"><div class="table-actions">
        <button class="icon-btn" data-cust-view="${cust.id}" title="View"><i class="bi bi-eye"></i></button>
        <button class="icon-btn" data-cust-edit="${cust.id}" title="Edit"><i class="bi bi-pencil"></i></button>
        <button class="icon-btn danger" data-cust-del="${cust.id}" title="Delete"><i class="bi bi-trash"></i></button>
      </div></td>
    </tr>`).join('') : `<tr><td colspan="7">${emptyState('bi-people', 'No customers found', 'Try a different search, or add a new customer.')}</td></tr>`;

  body.querySelectorAll('[data-cust-view]').forEach(b => b.addEventListener('click', () => showToast('Customer purchase history & ledger are coming in the next step.', 'info')));
  body.querySelectorAll('[data-cust-edit]').forEach(b => b.addEventListener('click', () => customerFormModal(items.find(x => String(x.id) === b.dataset.custEdit))));
  body.querySelectorAll('[data-cust-del]').forEach(b => b.addEventListener('click', () => {
    const cust = items.find(x => String(x.id) === b.dataset.custDel);
    confirmModal('Delete Customer', `Delete <strong>${cust.name}</strong>?`, async () => {
      try {
        await apiFetch(`/catalog/customers/${cust.id}`, { method: 'DELETE' });
        showToast('Customer deleted', 'success');
        renderCustTable();
      } catch (e) { showToast(e.message, 'error'); }
    });
  }));

  const pag = document.getElementById('custPagination');
  pag.innerHTML = `<div class="small text-muted">${meta.total} customers</div>${renderPagination(meta.total, meta.current_page, meta.per_page, p => { peopleState.page = p; renderCustTable(); })}`;
  attachPaginationClicks(pag, p => { peopleState.page = p; renderCustTable(); });
}

function customerFormModal(cust) {
  const body = `<form id="custForm">
    <div class="mb-3"><label class="form-label">Name *</label><input type="text" class="form-control" id="cf_name" value="${cust?.name || ''}" required></div>
    <div class="row g-3 mb-3">
      <div class="col-md-6"><label class="form-label">Phone</label><input type="text" class="form-control" id="cf_phone" value="${cust?.phone || ''}"></div>
      <div class="col-md-6"><label class="form-label">Email</label><input type="email" class="form-control" id="cf_email" value="${cust?.email || ''}"></div>
    </div>
    <div class="mb-3"><label class="form-label">Address</label><textarea class="form-control" id="cf_address" rows="2">${cust?.address || ''}</textarea></div>
    <div class="mb-3"><label class="form-label">Status</label><select class="form-select" id="cf_status">
      <option value="active" ${(!cust || cust?.status === 'active') ? 'selected' : ''}>Active</option>
      <option value="inactive" ${cust?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
    </select></div>
  </form>`;
  const footer = `<button class="btn btn-light" data-bs-dismiss="modal">Cancel</button><button class="btn btn-primary" id="cf_save">${cust ? 'Update' : 'Add'} Customer</button>`;
  const modal = formModal(cust ? 'Edit Customer' : 'Add Customer', body, footer);
  document.getElementById('cf_save').addEventListener('click', async () => {
    const name = document.getElementById('cf_name').value.trim();
    if (!name) { document.getElementById('cf_name').classList.add('is-invalid'); return; }
    const payload = {
      name,
      phone: document.getElementById('cf_phone').value || null,
      email: document.getElementById('cf_email').value || null,
      address: document.getElementById('cf_address').value || null,
      status: document.getElementById('cf_status').value,
    };
    try {
      if (cust) await apiFetch(`/catalog/customers/${cust.id}`, { method: 'PUT', body: payload });
      else await apiFetch('/catalog/customers', { method: 'POST', body: payload });
      showToast(cust ? 'Customer updated' : 'Customer added', 'success');
      modal.hide();
      renderCustTable();
    } catch (e) { showToast(e.errors ? Object.values(e.errors).flat()[0] : e.message, 'error'); }
  });
}

/* ===================== Suppliers ===================== */

function renderSuppliers(c) {
  c.innerHTML = `
    <div class="toolbar">
      <div class="search-box"><i class="bi bi-search"></i><input type="text" class="form-control" id="suppSearch" placeholder="Search suppliers…" value="${peopleState.search}"></div>
      <select class="form-select form-select-sm" id="suppStatus" style="width:auto;">
        <option value="all">All Status</option>
        <option value="active" ${peopleState.status === 'active' ? 'selected' : ''}>Active</option>
        <option value="inactive" ${peopleState.status === 'inactive' ? 'selected' : ''}>Inactive</option>
      </select>
      <div class="toolbar-spacer"></div>
      <button class="btn btn-primary btn-sm" id="addSupplier"><i class="bi bi-plus-lg me-1"></i>Add Supplier</button>
    </div>
    <div class="card table-card">
      <div class="card-body p-0"><div class="table-responsive"><table class="table table-hover">
        <thead><tr><th>Name</th><th>Contact</th><th>Phone</th><th>Total Purchases</th><th>Payable</th><th>Status</th><th class="text-end">Actions</th></tr></thead>
        <tbody id="suppTableBody"></tbody>
      </table></div></div>
      <div class="card-body d-flex justify-content-between align-items-center" id="suppPagination"></div>
    </div>`;
  document.getElementById('suppSearch').addEventListener('input', debounce(e => { peopleState.search = e.target.value; peopleState.page = 1; renderSuppTable(); }, 350));
  document.getElementById('suppStatus').addEventListener('change', e => { peopleState.status = e.target.value; peopleState.page = 1; renderSuppTable(); });
  document.getElementById('addSupplier').addEventListener('click', () => supplierFormModal());
  renderSuppTable();
}

async function renderSuppTable() {
  const body = document.getElementById('suppTableBody');
  body.innerHTML = skeletonRows(5, 7);
  const params = new URLSearchParams({ page: peopleState.page, per_page: peopleState.perPage });
  if (peopleState.search) params.set('q', peopleState.search);
  if (peopleState.status !== 'all') params.set('status', peopleState.status);

  let result;
  try {
    result = await apiFetch(`/catalog/suppliers?${params}`);
  } catch (e) {
    body.innerHTML = `<tr><td colspan="7">${emptyState('bi-exclamation-triangle', "Couldn't load suppliers", e.message)}</td></tr>`;
    return;
  }

  const items = result.data, meta = result.meta;
  body.innerHTML = items.length ? items.map(s => `
    <tr>
      <td class="fw-600">${s.name}</td><td>${s.contact_person || '—'}</td><td>${s.phone || '—'}</td>
      <td class="text-money">${fmtMoney(s.total_purchases)}</td>
      <td class="text-money ${s.current_balance > 0 ? 'text-danger fw-600' : ''}">${fmtMoney(s.current_balance)}</td>
      <td>${statusBadge(s.status)}</td>
      <td class="text-end"><div class="table-actions">
        <button class="icon-btn" data-supp-view="${s.id}" title="View"><i class="bi bi-eye"></i></button>
        <button class="icon-btn" data-supp-edit="${s.id}" title="Edit"><i class="bi bi-pencil"></i></button>
        <button class="icon-btn danger" data-supp-del="${s.id}" title="Delete"><i class="bi bi-trash"></i></button>
      </div></td>
    </tr>`).join('') : `<tr><td colspan="7">${emptyState('bi-truck', 'No suppliers found', 'Try a different search, or add a new supplier.')}</td></tr>`;

  body.querySelectorAll('[data-supp-view]').forEach(b => b.addEventListener('click', () => showToast('Supplier purchase history & ledger are coming in the next step.', 'info')));
  body.querySelectorAll('[data-supp-edit]').forEach(b => b.addEventListener('click', () => supplierFormModal(items.find(x => String(x.id) === b.dataset.suppEdit))));
  body.querySelectorAll('[data-supp-del]').forEach(b => b.addEventListener('click', () => {
    const s = items.find(x => String(x.id) === b.dataset.suppDel);
    confirmModal('Delete Supplier', `Delete <strong>${s.name}</strong>?`, async () => {
      try {
        await apiFetch(`/catalog/suppliers/${s.id}`, { method: 'DELETE' });
        showToast('Supplier deleted', 'success');
        renderSuppTable();
      } catch (e) { showToast(e.message, 'error'); }
    });
  }));

  const pag = document.getElementById('suppPagination');
  pag.innerHTML = `<div class="small text-muted">${meta.total} suppliers</div>${renderPagination(meta.total, meta.current_page, meta.per_page, p => { peopleState.page = p; renderSuppTable(); })}`;
  attachPaginationClicks(pag, p => { peopleState.page = p; renderSuppTable(); });
}

function supplierFormModal(s) {
  const body = `<form id="suppForm">
    <div class="mb-3"><label class="form-label">Company Name *</label><input type="text" class="form-control" id="sf_name" value="${s?.name || ''}" required></div>
    <div class="mb-3"><label class="form-label">Contact Person</label><input type="text" class="form-control" id="sf_contact" value="${s?.contact_person || ''}"></div>
    <div class="row g-3 mb-3">
      <div class="col-md-6"><label class="form-label">Phone</label><input type="text" class="form-control" id="sf_phone" value="${s?.phone || ''}"></div>
      <div class="col-md-6"><label class="form-label">Email</label><input type="email" class="form-control" id="sf_email" value="${s?.email || ''}"></div>
    </div>
    <div class="mb-3"><label class="form-label">Address</label><textarea class="form-control" id="sf_address" rows="2">${s?.address || ''}</textarea></div>
    <div class="mb-3"><label class="form-label">Status</label><select class="form-select" id="sf_status">
      <option value="active" ${(!s || s?.status === 'active') ? 'selected' : ''}>Active</option>
      <option value="inactive" ${s?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
    </select></div>
  </form>`;
  const footer = `<button class="btn btn-light" data-bs-dismiss="modal">Cancel</button><button class="btn btn-primary" id="sf_save">${s ? 'Update' : 'Add'} Supplier</button>`;
  const modal = formModal(s ? 'Edit Supplier' : 'Add Supplier', body, footer);
  document.getElementById('sf_save').addEventListener('click', async () => {
    const name = document.getElementById('sf_name').value.trim();
    if (!name) { document.getElementById('sf_name').classList.add('is-invalid'); return; }
    const payload = {
      name,
      contact_person: document.getElementById('sf_contact').value || null,
      phone: document.getElementById('sf_phone').value || null,
      email: document.getElementById('sf_email').value || null,
      address: document.getElementById('sf_address').value || null,
      status: document.getElementById('sf_status').value,
    };
    try {
      if (s) await apiFetch(`/catalog/suppliers/${s.id}`, { method: 'PUT', body: payload });
      else await apiFetch('/catalog/suppliers', { method: 'POST', body: payload });
      showToast(s ? 'Supplier updated' : 'Supplier added', 'success');
      modal.hide();
      renderSuppTable();
    } catch (e) { showToast(e.errors ? Object.values(e.errors).flat()[0] : e.message, 'error'); }
  });
}

/* ===================== Staff ===================== */

function renderStaff(c) {
  c.innerHTML = `
    <div class="toolbar">
      <div class="search-box"><i class="bi bi-search"></i><input type="text" class="form-control" id="staffSearch" placeholder="Search staff…" value="${peopleState.search}"></div>
      <select class="form-select form-select-sm" id="staffStatus" style="width:auto;">
        <option value="all">All Status</option>
        <option value="active" ${peopleState.status === 'active' ? 'selected' : ''}>Active</option>
        <option value="inactive" ${peopleState.status === 'inactive' ? 'selected' : ''}>Inactive</option>
      </select>
      <div class="toolbar-spacer"></div>
      <button class="btn btn-primary btn-sm" id="addStaff"><i class="bi bi-plus-lg me-1"></i>Add Staff</button>
    </div>
    <div class="card table-card">
      <div class="card-body p-0"><div class="table-responsive"><table class="table table-hover">
        <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th class="text-end">Actions</th></tr></thead>
        <tbody id="staffTableBody"></tbody>
      </table></div></div>
      <div class="card-body d-flex justify-content-between align-items-center" id="staffPagination"></div>
    </div>`;
  document.getElementById('staffSearch').addEventListener('input', debounce(e => { peopleState.search = e.target.value; peopleState.page = 1; renderStaffTable(); }, 350));
  document.getElementById('staffStatus').addEventListener('change', e => { peopleState.status = e.target.value; peopleState.page = 1; renderStaffTable(); });
  document.getElementById('addStaff').addEventListener('click', () => staffFormModal());
  renderStaffTable();
}

async function renderStaffTable() {
  const body = document.getElementById('staffTableBody');
  body.innerHTML = skeletonRows(5, 6);
  const params = new URLSearchParams({ page: peopleState.page, per_page: peopleState.perPage });
  if (peopleState.search) params.set('q', peopleState.search);
  if (peopleState.status !== 'all') params.set('status', peopleState.status);

  let result;
  try {
    result = await apiFetch(`/catalog/staff?${params}`);
  } catch (e) {
    body.innerHTML = `<tr><td colspan="6">${emptyState('bi-exclamation-triangle', "Couldn't load staff", e.message)}</td></tr>`;
    return;
  }

  const items = result.data, meta = result.meta;
  body.innerHTML = items.length ? items.map(u => `
    <tr>
      <td><span class="fw-600">${u.name}</span></td>
      <td>${u.email}</td><td>${u.phone || '—'}</td><td>${u.role?.name || '—'}</td><td>${statusBadge(u.status)}</td>
      <td class="text-end"><div class="table-actions">
        <button class="icon-btn" data-staff-edit="${u.id}" title="Edit"><i class="bi bi-pencil"></i></button>
        <button class="icon-btn" data-reset-pw="${u.id}" title="Reset Password"><i class="bi bi-key"></i></button>
        <button class="icon-btn danger" data-staff-del="${u.id}" title="Delete"><i class="bi bi-trash"></i></button>
      </div></td>
    </tr>`).join('') : `<tr><td colspan="6">${emptyState('bi-person-badge', 'No staff found', 'Try a different search, or add a new staff member.')}</td></tr>`;

  body.querySelectorAll('[data-staff-edit]').forEach(b => b.addEventListener('click', () => staffFormModal(items.find(x => String(x.id) === b.dataset.staffEdit))));
  body.querySelectorAll('[data-reset-pw]').forEach(b => b.addEventListener('click', () => {
    const u = items.find(x => String(x.id) === b.dataset.resetPw);
    confirmModal('Reset Password', `Generate a new temporary password for <strong>${u.name}</strong>? Their current password will stop working.`, async () => {
      let result;
      try {
        result = await apiFetch(`/catalog/staff/${u.id}/reset-password`, { method: 'POST' });
      } catch (e) { showToast(e.message, 'error'); return; }
      formModal('Password Reset', `
        <p>New temporary password for <strong>${u.name}</strong>:</p>
        <div class="border rounded p-3 text-center fw-700 fs-5" style="font-family:monospace;letter-spacing:2px;">${result.temporary_password}</div>
        <p class="small text-muted mt-2">Share this with them directly — it won't be shown again. There's no email delivery set up yet.</p>
      `, `<button class="btn btn-primary" data-bs-dismiss="modal">Done</button>`);
    }, 'Reset');
  }));
  body.querySelectorAll('[data-staff-del]').forEach(b => b.addEventListener('click', () => {
    const u = items.find(x => String(x.id) === b.dataset.staffDel);
    confirmModal('Delete Staff', `Delete <strong>${u.name}</strong>?`, async () => {
      try {
        await apiFetch(`/catalog/staff/${u.id}`, { method: 'DELETE' });
        showToast('Staff member deleted', 'success');
        renderStaffTable();
      } catch (e) { showToast(e.message, 'error'); }
    });
  }));

  const pag = document.getElementById('staffPagination');
  pag.innerHTML = `<div class="small text-muted">${meta.total} staff</div>${renderPagination(meta.total, meta.current_page, meta.per_page, p => { peopleState.page = p; renderStaffTable(); })}`;
  attachPaginationClicks(pag, p => { peopleState.page = p; renderStaffTable(); });
}

function staffFormModal(u) {
  const isEdit = !!u;
  const body = `<form id="staffForm">
    <div class="mb-3"><label class="form-label">Name *</label><input type="text" class="form-control" id="sf2_name" value="${u?.name || ''}" required></div>
    <div class="row g-3 mb-3">
      <div class="col-md-6"><label class="form-label">Email *</label><input type="email" class="form-control" id="sf2_email" value="${u?.email || ''}" required></div>
      <div class="col-md-6"><label class="form-label">Phone</label><input type="text" class="form-control" id="sf2_phone" value="${u?.phone || ''}"></div>
    </div>
    ${isEdit ? '' : `<div class="mb-3"><label class="form-label">Password *</label><input type="password" class="form-control" id="sf2_password" minlength="8" required><div class="form-text">At least 8 characters. They can change it after logging in.</div></div>`}
    <div class="row g-3 mb-3">
      <div class="col-md-6"><label class="form-label">Role *</label><select class="form-select" id="sf2_role">${peopleRoles.map(r => `<option value="${r.id}" ${u?.role?.id === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}</select></div>
      <div class="col-md-6"><label class="form-label">Status</label><select class="form-select" id="sf2_status">
        <option value="active" ${(!u || u?.status === 'active') ? 'selected' : ''}>Active</option>
        <option value="inactive" ${u?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
      </select></div>
    </div>
  </form>`;
  const footer = `<button class="btn btn-light" data-bs-dismiss="modal">Cancel</button><button class="btn btn-primary" id="sf2_save">${isEdit ? 'Update' : 'Add'} Staff</button>`;
  const modal = formModal(isEdit ? 'Edit Staff' : 'Add Staff', body, footer);

  document.getElementById('sf2_save').addEventListener('click', async () => {
    const name = document.getElementById('sf2_name').value.trim();
    const email = document.getElementById('sf2_email').value.trim();
    if (!name || !email) { showToast('Name and email are required', 'error'); return; }
    if (!peopleRoles.length) { showToast('No roles available — reload the page and try again', 'error'); return; }

    const payload = {
      name, email,
      phone: document.getElementById('sf2_phone').value || null,
      role_id: +document.getElementById('sf2_role').value,
      status: document.getElementById('sf2_status').value,
    };
    if (!isEdit) payload.password = document.getElementById('sf2_password').value;

    try {
      if (isEdit) await apiFetch(`/catalog/staff/${u.id}`, { method: 'PUT', body: payload });
      else await apiFetch('/catalog/staff', { method: 'POST', body: payload });
      showToast(isEdit ? 'Staff updated' : 'Staff added', 'success');
      modal.hide();
      renderStaffTable();
    } catch (e) { showToast(e.errors ? Object.values(e.errors).flat()[0] : e.message, 'error'); }
  });
}

/* ===================== Roles & Permissions (display only — mock) ===================== */

function renderRoles(c) {
  const roleNames = Object.keys(ROLE_PERMISSIONS);
  const modules = Object.keys(ROLE_PERMISSIONS[roleNames[0]]);
  c.innerHTML = `
    <div class="card">
      <div class="card-header">Role &amp; Permissions Matrix</div>
      <div class="card-body p-0"><div class="table-responsive"><table class="table">
        <thead><tr><th>Module</th>${roleNames.map(r => `<th class="text-center">${r}</th>`).join('')}</tr></thead>
        <tbody>
          ${modules.map(mod => `
            <tr><td class="fw-600 text-capitalize">${mod}</td>
              ${roleNames.map(r => `<td class="text-center small">${(ROLE_PERMISSIONS[r][mod] || []).join(', ') || '<span class="text-muted">—</span>'}</td>`).join('')}
            </tr>`).join('')}
        </tbody>
      </table></div></div>
    </div>
    <p class="small text-muted mt-2"><i class="bi bi-info-circle me-1"></i>This matrix is informational for now — editing roles/permissions is a Settings-screen feature, not built yet.</p>`;
}
