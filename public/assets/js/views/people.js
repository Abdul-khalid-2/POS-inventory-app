/* People Management View — Customers, Suppliers, Staff, Roles */

let peopleState = { subTab: 'customers', page: 1, perPage: 10, search: '' };

registerView('people', function() {
  breadcrumb([{ label: 'Home', view: 'dashboard' }, { label: 'Customers & Suppliers' }]);
  peopleState.page = 1;
  const html = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div><h1 class="page-title">People Management</h1><div class="subtitle">Manage customers, suppliers, staff, and roles</div></div>
    </div>
    <ul class="nav nav-tabs mb-3">
      <li class="nav-item"><button class="nav-link active" data-ptab="customers">Customers</button></li>
      <li class="nav-item"><button class="nav-link" data-ptab="suppliers">Suppliers</button></li>
      <li class="nav-item"><button class="nav-link" data-ptab="staff">Staff / Employees</button></li>
      <li class="nav-item"><button class="nav-link" data-ptab="roles">Roles & Permissions</button></li>
    </ul>
    <div id="peopleTabContent"></div>
  `;
  document.getElementById('content').innerHTML = html;
  document.querySelectorAll('[data-ptab]').forEach(t => t.addEventListener('click', () => {
    document.querySelectorAll('[data-ptab]').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    peopleState.subTab = t.dataset.ptab;
    peopleState.page = 1;
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

function renderCustomers(c) {
  c.innerHTML = `
    <div class="toolbar">
      <div class="search-box"><i class="bi bi-search"></i><input type="text" class="form-control" id="custSearch" placeholder="Search customers…"></div>
      <div class="toolbar-spacer"></div>
      <button class="btn btn-outline-secondary btn-sm" id="custExport"><i class="bi bi-download me-1"></i>Export</button>
      <button class="btn btn-primary btn-sm" id="addCust"><i class="bi bi-plus-lg me-1"></i>Add Customer</button>
    </div>
    <div class="card table-card">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Total Purchases</th><th>Outstanding Due</th><th>Loyalty Points</th><th>Type</th><th class="text-end">Actions</th></tr></thead>
            <tbody id="custTableBody"></tbody>
          </table>
        </div>
      </div>
      <div class="card-body d-flex justify-content-between align-items-center" id="custPagination"></div>
    </div>`;
  document.getElementById('custSearch').addEventListener('input', e => { peopleState.search = e.target.value; peopleState.page = 1; renderCustTable(); });
  document.getElementById('addCust').addEventListener('click', () => customerModal());
  document.getElementById('custExport').addEventListener('click', () => {
    exportCSV('customers.csv', ['Name','Phone','Email','Total Purchases','Due','Loyalty Points','Type'],
      CUSTOMERS.filter(c=>c.id!=='c001').map(c => [c.name, c.phone, c.email, c.totalPurchases, c.due, c.loyaltyPoints, c.type]));
  });
  renderCustTable();
}

function renderCustTable() {
  let items = CUSTOMERS.filter(c => c.id !== 'c001');
  if (peopleState.search) { const q = peopleState.search.toLowerCase(); items = items.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q)); }
  const paged = paginate(items, peopleState.page, peopleState.perPage);
  const body = document.getElementById('custTableBody');
  if (!items.length) body.innerHTML = `<tr><td colspan="8">${emptyState('bi-people','No customers found','Try a different search.')}</td></tr>`;
  else body.innerHTML = paged.map(c => `
    <tr class="cursor-pointer" data-cust-detail="${c.id}">
      <td><div class="d-flex align-items-center gap-2"><div class="topbar-avatar" style="background:linear-gradient(135deg,var(--brand-300),var(--brand-500));">${avatarLetter(c.name)}</div><span class="fw-600">${c.name}</span></div></td>
      <td>${c.phone}</td><td>${c.email}</td><td class="text-money">${fmtMoney(c.totalPurchases)}</td>
      <td class="text-money ${c.due>0?'text-danger fw-600':''}">${fmtMoney(c.due)}</td>
      <td><span class="badge bg-soft-primary">${c.loyaltyPoints}</span></td>
      <td><span class="badge bg-soft-${c.type==='vip'?'warning':'secondary'}">${c.type}</span></td>
      <td class="text-end" onclick="event.stopPropagation()">
        <div class="table-actions">
          <button class="icon-btn" data-cust-detail="${c.id}" title="View"><i class="bi bi-eye"></i></button>
          <button class="icon-btn" data-edit-cust="${c.id}" title="Edit"><i class="bi bi-pencil"></i></button>
          <button class="icon-btn danger" data-del-cust="${c.id}" title="Delete"><i class="bi bi-trash"></i></button>
        </div>
      </td>
    </tr>`).join('');
  body.querySelectorAll('[data-cust-detail]').forEach(b => b.addEventListener('click', () => showCustomerDetail(b.dataset.custDetail)));
  body.querySelectorAll('[data-edit-cust]').forEach(b => b.addEventListener('click', () => customerModal(b.dataset.editCust)));
  body.querySelectorAll('[data-del-cust]').forEach(b => b.addEventListener('click', () => {
    const c = CUSTOMERS.find(x => x.id === b.dataset.delCust);
    confirmModal('Delete Customer', `Delete <strong>${c.name}</strong>?`, () => { const idx = CUSTOMERS.findIndex(x=>x.id===c.id); if(idx>=0) CUSTOMERS.splice(idx,1); renderCustTable(); showToast('Customer deleted', 'success'); });
  }));
  const pag = document.getElementById('custPagination');
  pag.innerHTML = `<div class="small text-muted">${items.length} customers</div>${renderPagination(items.length, peopleState.page, peopleState.perPage, p=>{peopleState.page=p;renderCustTable();})}`;
  attachPaginationClicks(pag, p => { peopleState.page = p; renderCustTable(); });
}

function customerModal(id) {
  const c = id ? CUSTOMERS.find(x => x.id === id) : null;
  const body = `<form id="custForm">
    <div class="row g-3">
      <div class="col-md-6"><label class="form-label">Name *</label><input type="text" class="form-control" id="cf_name" value="${c?.name||''}" required></div>
      <div class="col-md-6"><label class="form-label">Phone</label><input type="text" class="form-control" id="cf_phone" value="${c?.phone||''}"></div>
      <div class="col-md-6"><label class="form-label">Email</label><input type="email" class="form-control" id="cf_email" value="${c?.email||''}"></div>
      <div class="col-md-6"><label class="form-label">Type</label><select class="form-select" id="cf_type"><option value="regular" ${c?.type==='regular'?'selected':''}>Regular</option><option value="vip" ${c?.type==='vip'?'selected':''}>VIP</option></select></div>
      <div class="col-12"><label class="form-label">Address</label><textarea class="form-control" id="cf_address" rows="2">${c?.address||''}</textarea></div>
    </div>
  </form>`;
  const footer = `<button class="btn btn-light" data-bs-dismiss="modal">Cancel</button><button class="btn btn-primary" id="cf_save">${c?'Update':'Add'} Customer</button>`;
  const modal = formModal(c ? 'Edit Customer' : 'Add Customer', body, footer);
  document.getElementById('cf_save').addEventListener('click', () => {
    const name = document.getElementById('cf_name').value.trim();
    if (!name) { document.getElementById('cf_name').classList.add('is-invalid'); return; }
    const data = { name, phone: document.getElementById('cf_phone').value, email: document.getElementById('cf_email').value, type: document.getElementById('cf_type').value, address: document.getElementById('cf_address').value };
    if (c) { Object.assign(c, data); showToast('Customer updated', 'success'); }
    else { CUSTOMERS.push({ id: 'c'+Date.now(), totalPurchases: 0, due: 0, loyaltyPoints: 0, ...data }); showToast('Customer added', 'success'); }
    modal.hide(); renderCustTable();
  });
}

function showCustomerDetail(id) {
  const c = CUSTOMERS.find(x => x.id === id);
  const sales = SALES.filter(s => s.customerId === id).slice(0, 10);
  const body = `<div class="row mb-3">
    <div class="col-md-6"><div class="d-flex align-items-center gap-3"><div class="topbar-avatar" style="width:48px;height:48px;font-size:18px;background:linear-gradient(135deg,var(--brand-300),var(--brand-500));">${avatarLetter(c.name)}</div><div><h5 class="fw-700">${c.name}</h5><div class="small text-muted">${c.email} · ${c.phone}</div><span class="badge bg-soft-${c.type==='vip'?'warning':'secondary'} mt-1">${c.type}</span></div></div></div>
    <div class="col-md-6"><div class="row text-end">
      <div class="col-4"><div class="small text-muted">Total Purchases</div><div class="fw-700">${fmtMoney(c.totalPurchases)}</div></div>
      <div class="col-4"><div class="small text-muted">Outstanding Due</div><div class="fw-700 ${c.due>0?'text-danger':''}">${fmtMoney(c.due)}</div></div>
      <div class="col-4"><div class="small text-muted">Loyalty Points</div><div class="fw-700">${c.loyaltyPoints}</div></div>
    </div></div>
  </div>
  <h6 class="fw-700 mb-2">Purchase History</h6>
  <table class="table table-sm"><thead><tr><th>Invoice</th><th>Date</th><th>Total</th><th>Status</th></tr></thead><tbody>
  ${sales.map(s=>`<tr><td>${s.invoice}</td><td>${fmtDate(s.date)}</td><td>${fmtMoney(s.total)}</td><td>${statusBadge(s.status)}</td></tr>`).join('') || '<tr><td colspan="4" class="text-muted">No purchases</td></tr>'}
  </tbody></table>`;
  const footer = `<button class="btn btn-light" data-bs-dismiss="modal">Close</button>${c.due>0?`<button class="btn btn-primary" id="recordPayCust"><i class="bi bi-cash me-1"></i>Record Payment</button>`:''}`;
  const modal = formModal('Customer Profile — ' + c.name, body, footer, 'lg');
  document.getElementById('recordPayCust')?.addEventListener('click', () => { c.due = 0; modal.hide(); renderCustTable(); showToast('Payment recorded — due cleared', 'success'); });
}

function renderSuppliers(c) {
  c.innerHTML = `
    <div class="toolbar">
      <div class="search-box"><i class="bi bi-search"></i><input type="text" class="form-control" id="supSearch" placeholder="Search suppliers…"></div>
      <div class="toolbar-spacer"></div>
      <button class="btn btn-primary btn-sm" id="addSup"><i class="bi bi-plus-lg me-1"></i>Add Supplier</button>
    </div>
    <div class="card table-card">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead><tr><th>Name</th><th>Contact</th><th>Phone</th><th>Email</th><th>Total Purchases</th><th>Payable</th><th class="text-end">Actions</th></tr></thead>
            <tbody id="supTableBody"></tbody>
          </table>
        </div>
      </div>
    </div>`;
  document.getElementById('supSearch').addEventListener('input', e => renderSupTable(e.target.value));
  document.getElementById('addSup').addEventListener('click', () => supplierModal());
  renderSupTable('');
}

function renderSupTable(search) {
  let items = [...SUPPLIERS];
  if (search) { const q = search.toLowerCase(); items = items.filter(s => s.name.toLowerCase().includes(q) || s.contact.toLowerCase().includes(q)); }
  document.getElementById('supTableBody').innerHTML = items.map(s => `
    <tr>
      <td class="fw-600">${s.name}</td><td>${s.contact}</td><td>${s.phone}</td><td>${s.email}</td>
      <td class="text-money">${fmtMoney(s.totalPurchases)}</td>
      <td class="text-money ${s.payable>0?'text-danger fw-600':''}">${fmtMoney(s.payable)}</td>
      <td class="text-end"><div class="table-actions"><button class="icon-btn" data-edit-sup="${s.id}"><i class="bi bi-pencil"></i></button><button class="icon-btn danger" data-del-sup="${s.id}"><i class="bi bi-trash"></i></button></div></td>
    </tr>`).join('') || `<tr><td colspan="7">${emptyState('bi-truck','No suppliers found','')}</td></tr>`;
  document.querySelectorAll('[data-edit-sup]').forEach(b => b.addEventListener('click', () => supplierModal(b.dataset.editSup)));
  document.querySelectorAll('[data-del-sup]').forEach(b => b.addEventListener('click', () => {
    const s = SUPPLIERS.find(x => x.id === b.dataset.delSup);
    confirmModal('Delete Supplier', `Delete <strong>${s.name}</strong>?`, () => { const idx = SUPPLIERS.findIndex(x=>x.id===s.id); if(idx>=0) SUPPLIERS.splice(idx,1); renderSupTable(document.getElementById('supSearch').value); showToast('Supplier deleted', 'success'); });
  }));
}

function supplierModal(id) {
  const s = id ? SUPPLIERS.find(x => x.id === id) : null;
  const body = `<form id="supForm"><div class="row g-3">
    <div class="col-md-6"><label class="form-label">Name *</label><input type="text" class="form-control" id="sf_name" value="${s?.name||''}" required></div>
    <div class="col-md-6"><label class="form-label">Contact Person</label><input type="text" class="form-control" id="sf_contact" value="${s?.contact||''}"></div>
    <div class="col-md-6"><label class="form-label">Phone</label><input type="text" class="form-control" id="sf_phone" value="${s?.phone||''}"></div>
    <div class="col-md-6"><label class="form-label">Email</label><input type="email" class="form-control" id="sf_email" value="${s?.email||''}"></div>
    <div class="col-12"><label class="form-label">Address</label><textarea class="form-control" id="sf_address" rows="2">${s?.address||''}</textarea></div>
  </div></form>`;
  const footer = `<button class="btn btn-light" data-bs-dismiss="modal">Cancel</button><button class="btn btn-primary" id="sf_save">${s?'Update':'Add'} Supplier</button>`;
  const modal = formModal(s ? 'Edit Supplier' : 'Add Supplier', body, footer);
  document.getElementById('sf_save').addEventListener('click', () => {
    const name = document.getElementById('sf_name').value.trim();
    if (!name) { document.getElementById('sf_name').classList.add('is-invalid'); return; }
    const data = { name, contact: document.getElementById('sf_contact').value, phone: document.getElementById('sf_phone').value, email: document.getElementById('sf_email').value, address: document.getElementById('sf_address').value };
    if (s) { Object.assign(s, data); showToast('Supplier updated', 'success'); }
    else { SUPPLIERS.push({ id: 's'+Date.now(), totalPurchases: 0, payable: 0, ...data }); showToast('Supplier added', 'success'); }
    modal.hide(); renderSupTable(document.getElementById('supSearch').value);
  });
}

function renderStaff(c) {
  c.innerHTML = `
    <div class="toolbar"><div class="toolbar-spacer"></div><button class="btn btn-primary btn-sm" id="addStaff"><i class="bi bi-plus-lg me-1"></i>Add Staff</button></div>
    <div class="card table-card"><div class="card-body p-0">
      <div class="table-responsive"><table class="table table-hover">
        <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th class="text-end">Actions</th></tr></thead>
        <tbody>
          ${USERS.map(u => `<tr>
            <td><div class="d-flex align-items-center gap-2"><div class="topbar-avatar">${u.avatar}</div><span class="fw-600">${u.name}</span></div></td>
            <td>${u.email}</td><td>${u.phone}</td><td><span class="badge bg-soft-primary">${u.role}</span></td>
            <td>${statusBadge(u.status)}</td>
            <td class="text-end"><div class="table-actions"><button class="icon-btn" data-edit-staff="${u.id}"><i class="bi bi-pencil"></i></button><button class="icon-btn" data-reset-pw="${u.id}" title="Reset Password"><i class="bi bi-key"></i></button><button class="icon-btn danger" data-del-staff="${u.id}"><i class="bi bi-trash"></i></button></div></td>
          </tr>`).join('')}
        </tbody>
      </table></div>
    </div></div>`;
  c.querySelector('#addStaff').addEventListener('click', () => staffModal());
  c.querySelectorAll('[data-edit-staff]').forEach(b => b.addEventListener('click', () => staffModal(b.dataset.editStaff)));
  c.querySelectorAll('[data-reset-pw]').forEach(b => b.addEventListener('click', () => showToast('Password reset link sent to ' + USERS.find(u=>u.id===b.dataset.resetPw)?.email, 'success')));
  c.querySelectorAll('[data-del-staff]').forEach(b => b.addEventListener('click', () => {
    const u = USERS.find(x => x.id === b.dataset.delStaff);
    confirmModal('Delete Staff', `Delete <strong>${u.name}</strong>?`, () => { const idx = USERS.findIndex(x=>x.id===u.id); if(idx>=0) USERS.splice(idx,1); renderStaff(c); showToast('Staff deleted', 'success'); });
  }));
}

function staffModal(id) {
  const u = id ? USERS.find(x => x.id === id) : null;
  const body = `<form id="staffForm"><div class="row g-3">
    <div class="col-md-6"><label class="form-label">Name *</label><input type="text" class="form-control" id="uf_name" value="${u?.name||''}" required></div>
    <div class="col-md-6"><label class="form-label">Email *</label><input type="email" class="form-control" id="uf_email" value="${u?.email||''}" required></div>
    <div class="col-md-6"><label class="form-label">Phone</label><input type="text" class="form-control" id="uf_phone" value="${u?.phone||''}"></div>
    <div class="col-md-6"><label class="form-label">Role *</label><select class="form-select" id="uf_role">${ROLES.map(r=>`<option value="${r.name}" ${u?.role===r.name?'selected':''}>${r.name}</option>`).join('')}</select></div>
    <div class="col-md-6"><label class="form-label">Status</label><select class="form-select" id="uf_status"><option value="active" ${u?.status==='active'?'selected':''}>Active</option><option value="inactive" ${u?.status==='inactive'?'selected':''}>Inactive</option></select></div>
  </div></form>`;
  const footer = `<button class="btn btn-light" data-bs-dismiss="modal">Cancel</button><button class="btn btn-primary" id="uf_save">${u?'Update':'Add'} Staff</button>`;
  const modal = formModal(u ? 'Edit Staff' : 'Add Staff', body, footer);
  document.getElementById('uf_save').addEventListener('click', () => {
    const name = document.getElementById('uf_name').value.trim();
    const email = document.getElementById('uf_email').value.trim();
    if (!name || !email) { showToast('Name and email are required', 'error'); return; }
    const data = { name, email, phone: document.getElementById('uf_phone').value, role: document.getElementById('uf_role').value, status: document.getElementById('uf_status').value, avatar: avatarLetter(name) };
    if (u) { Object.assign(u, data); showToast('Staff updated', 'success'); }
    else { USERS.push({ id: 'u'+Date.now(), ...data, permissions: {} }); showToast('Staff added', 'success'); }
    modal.hide(); renderStaff(document.getElementById('peopleTabContent'));
  });
}

function renderRoles(c) {
  const modules = ['dashboard','pos','products','inventory','sales','purchases','people','orders','accounts','reports','settings'];
  const moduleLabels = { dashboard:'Dashboard', pos:'POS', products:'Products', inventory:'Inventory', sales:'Sales', purchases:'Purchases', people:'People', orders:'Orders', accounts:'Accounts', reports:'Reports', settings:'Settings' };
  c.innerHTML = `
    <div class="card">
      <div class="card-header">Role & Permission Matrix</div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-bordered mb-0">
            <thead><tr><th>Module</th>${ROLES.map(r=>`<th class="text-center">${r.name}</th>`).join('')}</tr></thead>
            <tbody>
              ${modules.map(m => `<tr><td class="fw-600">${moduleLabels[m]}</td>${ROLES.map(r=>{ const perms = ROLE_PERMISSIONS[r.name]?.[m] || []; return `<td class="text-center">${perms.length?perms.map(p=>`<span class="badge bg-soft-${p==='view'?'info':p==='add'?'success':p==='edit'?'warning':'danger'} me-1">${p}</span>`).join(''):'<span class="text-muted">—</span>'}</td>`;}).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div class="row g-3 mt-3">
      ${ROLES.map(r=>`<div class="col-md-3"><div class="card"><div class="card-body"><h6 class="fw-700">${r.name}</h6><p class="small text-muted">${r.description}</p><div class="small">${Object.keys(ROLE_PERMISSIONS[r.name]||{}).filter(m=>ROLE_PERMISSIONS[r.name][m].length).length} modules with access</div></div></div></div>`).join('')}
    </div>`;
}
