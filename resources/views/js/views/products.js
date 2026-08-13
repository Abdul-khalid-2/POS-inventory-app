/* Products View */

let productState = { page: 1, perPage: 10, search: '', category: 'all', brand: 'all', stockStatus: 'all', subTab: 'products' };

registerView('products', function() {
  breadcrumb([{ label: 'Home', view: 'dashboard' }, { label: 'Products' }]);
  productState.page = 1;

  const html = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div><h1 class="page-title">Products</h1><div class="subtitle">Manage your product catalog, categories, and brands</div></div>
    </div>

    <ul class="nav nav-tabs mb-3" id="productTabs">
      <li class="nav-item"><button class="nav-link active" data-subtab="products">Products</button></li>
      <li class="nav-item"><button class="nav-link" data-subtab="categories">Categories</button></li>
      <li class="nav-item"><button class="nav-link" data-subtab="brands">Brands</button></li>
    </ul>

    <div id="productTabContent"></div>
  `;
  document.getElementById('content').innerHTML = html;
  document.querySelectorAll('#productTabs .nav-link').forEach(t => t.addEventListener('click', () => {
    document.querySelectorAll('#productTabs .nav-link').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    productState.subTab = t.dataset.subtab;
    renderProductTab();
  }));
  renderProductTab();
});

function renderProductTab() {
  const c = document.getElementById('productTabContent');
  if (productState.subTab === 'products') renderProductList(c);
  else if (productState.subTab === 'categories') renderCategoryList(c);
  else renderBrandList(c);
}

function renderProductList(c) {
  c.innerHTML = `
    <div class="toolbar">
      <div class="search-box"><i class="bi bi-search"></i><input type="text" class="form-control" id="prodSearch" placeholder="Search by name, SKU, or barcode…" value="${productState.search}"></div>
      <select class="form-select form-select-sm" id="prodCat" style="width:auto;">
        <option value="all">All Categories</option>
        ${CATEGORIES.map(cat => `<option value="${cat.id}" ${productState.category === cat.id ? 'selected' : ''}>${cat.name}</option>`).join('')}
      </select>
      <select class="form-select form-select-sm" id="prodBrand" style="width:auto;">
        <option value="all">All Brands</option>
        ${BRANDS.map(b => `<option value="${b.id}" ${productState.brand === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}
      </select>
      <select class="form-select form-select-sm" id="prodStock" style="width:auto;">
        <option value="all">All Stock</option>
        <option value="in" ${productState.stockStatus === 'in' ? 'selected' : ''}>In Stock</option>
        <option value="low" ${productState.stockStatus === 'low' ? 'selected' : ''}>Low Stock</option>
        <option value="out" ${productState.stockStatus === 'out' ? 'selected' : ''}>Out of Stock</option>
      </select>
      <div class="toolbar-spacer"></div>
      <button class="btn btn-outline-secondary btn-sm" id="importCsvBtn"><i class="bi bi-upload me-1"></i>Import CSV</button>
      <button class="btn btn-outline-secondary btn-sm" id="exportProdBtn"><i class="bi bi-download me-1"></i>Export</button>
      <button class="btn btn-primary btn-sm" id="addProductBtn"><i class="bi bi-plus-lg me-1"></i>Add Product</button>
    </div>
    <div class="card table-card">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle">
            <thead><tr>
              <th><input type="checkbox" class="form-check-input" id="prodSelectAll"></th>
              <th>Product</th><th>SKU / Barcode</th><th>Category</th><th>Brand</th>
              <th>Cost</th><th>Price</th><th>Stock</th><th>Status</th><th class="text-end">Actions</th>
            </tr></thead>
            <tbody id="prodTableBody"></tbody>
          </table>
        </div>
      </div>
      <div class="card-body d-flex justify-content-between align-items-center" id="prodPagination"></div>
    </div>
    <button class="fab" id="fabAddProduct" title="Add Product"><i class="bi bi-plus-lg"></i></button>`;

  document.getElementById('prodSearch').addEventListener('input', e => { productState.search = e.target.value; productState.page = 1; renderProductTable(); });
  document.getElementById('prodCat').addEventListener('change', e => { productState.category = e.target.value; productState.page = 1; renderProductTable(); });
  document.getElementById('prodBrand').addEventListener('change', e => { productState.brand = e.target.value; productState.page = 1; renderProductTable(); });
  document.getElementById('prodStock').addEventListener('change', e => { productState.stockStatus = e.target.value; productState.page = 1; renderProductTable(); });
  document.getElementById('addProductBtn').addEventListener('click', () => productFormModal());
  document.getElementById('fabAddProduct').addEventListener('click', () => productFormModal());
  document.getElementById('importCsvBtn').addEventListener('click', () => showToast('CSV import dialog would open here (demo)', 'info'));
  document.getElementById('exportProdBtn').addEventListener('click', () => {
    exportCSV('products.csv', ['Name','SKU','Barcode','Category','Brand','Cost','Price','Stock','Unit','Status'],
      getFilteredProducts().map(p => [p.name, p.sku, p.barcode, catName(p.category), brandName(p.brand), p.cost, p.price, p.stock, p.unit, p.status]));
  });
  document.getElementById('prodSelectAll').addEventListener('change', e => {
    document.querySelectorAll('#prodTableBody .row-check').forEach(cb => cb.checked = e.target.checked);
  });
  renderProductTable();
}

function getFilteredProducts() {
  let items = [...PRODUCTS];
  if (productState.search) {
    const q = productState.search.toLowerCase();
    items = items.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(q));
  }
  if (productState.category !== 'all') items = items.filter(p => p.category === productState.category);
  if (productState.brand !== 'all') items = items.filter(p => p.brand === productState.brand);
  if (productState.stockStatus === 'in') items = items.filter(p => p.stock > p.reorder);
  if (productState.stockStatus === 'low') items = items.filter(p => p.stock > 0 && p.stock <= p.reorder);
  if (productState.stockStatus === 'out') items = items.filter(p => p.stock <= 0);
  return items;
}

function renderProductTable() {
  const items = getFilteredProducts();
  const paged = paginate(items, productState.page, productState.perPage);
  const body = document.getElementById('prodTableBody');
  if (!items.length) { body.innerHTML = `<tr><td colspan="10">${emptyState('bi-box-seam', 'No products found', 'Try adjusting filters or add a new product.')}</td></tr>`; }
  else {
    body.innerHTML = paged.map(p => `
      <tr>
        <td><input type="checkbox" class="form-check-input row-check" data-id="${p.id}"></td>
        <td><div class="d-flex align-items-center gap-2"><div class="product-thumb">${p.image || '📦'}</div><div><div class="fw-600">${p.name}</div><div class="small text-muted">${p.unit}</div></div></div></td>
        <td><div class="fw-600">${p.sku}</div><div class="small text-muted">${p.barcode}</div></td>
        <td>${catName(p.category)}</td>
        <td>${brandName(p.brand)}</td>
        <td class="text-money">${fmtMoney(p.cost)}</td>
        <td class="text-money fw-600">${fmtMoney(p.price)}</td>
        <td><span class="fw-600">${p.stock}</span> <span class="small text-muted">${p.unit}</span></td>
        <td>${stockBadge(p.stock, p.reorder)}</td>
        <td class="text-end">
          <div class="table-actions">
            <button class="icon-btn" data-barcode="${p.id}" title="Barcode"><i class="bi bi-upc-scan"></i></button>
            <button class="icon-btn" data-edit-prod="${p.id}" title="Edit"><i class="bi bi-pencil"></i></button>
            <button class="icon-btn danger" data-del-prod="${p.id}" title="Delete"><i class="bi bi-trash"></i></button>
          </div>
        </td>
      </tr>`).join('');
    body.querySelectorAll('[data-edit-prod]').forEach(b => b.addEventListener('click', () => productFormModal(b.dataset.editProd)));
    body.querySelectorAll('[data-del-prod]').forEach(b => b.addEventListener('click', () => {
      const p = productById(b.dataset.delProd);
      confirmModal('Delete Product', `Are you sure you want to delete <strong>${p.name}</strong>? This cannot be undone.`, () => {
        const idx = PRODUCTS.findIndex(x => x.id === p.id);
        if (idx >= 0) PRODUCTS.splice(idx, 1);
        renderProductTable();
        showToast('Product deleted successfully', 'success');
      });
    }));
    body.querySelectorAll('[data-barcode]').forEach(b => b.addEventListener('click', () => showBarcode(b.dataset.barcode)));
  }
  const pag = document.getElementById('prodPagination');
  pag.innerHTML = `<div class="small text-muted">${items.length} products</div>${renderPagination(items.length, productState.page, productState.perPage, p => { productState.page = p; renderProductTable(); })}`;
  attachPaginationClicks(pag, p => { productState.page = p; renderProductTable(); });
}

function productFormModal(id) {
  const p = id ? productById(id) : null;
  const isEdit = !!p;
  const body = `
    <form id="productForm" novalidate>
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label">Product Name *</label>
          <input type="text" class="form-control" id="pf_name" value="${p?.name || ''}" required>
          <div class="invalid-feedback">Product name is required.</div>
        </div>
        <div class="col-md-6">
          <label class="form-label">SKU</label>
          <div class="input-group">
            <input type="text" class="form-control" id="pf_sku" value="${p?.sku || ('SKU-' + Math.floor(1000 + Math.random()*9000))}">
            <button class="btn btn-outline-secondary" type="button" id="pf_genSku"><i class="bi bi-arrow-repeat"></i></button>
          </div>
        </div>
        <div class="col-md-6">
          <label class="form-label">Barcode</label>
          <input type="text" class="form-control" id="pf_barcode" value="${p?.barcode || Math.floor(1000000000000 + Math.random()*9000000000000)}">
        </div>
        <div class="col-md-3">
          <label class="form-label">Category *</label>
          <select class="form-select" id="pf_category" required>
            ${CATEGORIES.map(c => `<option value="${c.id}" ${p?.category === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Brand</label>
          <select class="form-select" id="pf_brand">
            <option value="">— None —</option>
            ${BRANDS.map(b => `<option value="${b.id}" ${p?.brand === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Unit *</label>
          <select class="form-select" id="pf_unit">
            ${UNITS.map(u => `<option value="${u}" ${p?.unit === u ? 'selected' : ''}>${u}</option>`).join('')}
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Tax Rate</label>
          <select class="form-select" id="pf_tax">
            ${TAX_RATES.map(t => `<option value="${t.rate}" ${p?.tax === t.rate ? 'selected' : ''}>${t.name} (${t.rate}%)</option>`).join('')}
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label">Cost Price *</label>
          <div class="input-group"><span class="input-group-text">${CURRENCY}</span><input type="number" step="0.01" class="form-control" id="pf_cost" value="${p?.cost || ''}" required></div>
        </div>
        <div class="col-md-4">
          <label class="form-label">Sale Price *</label>
          <div class="input-group"><span class="input-group-text">${CURRENCY}</span><input type="number" step="0.01" class="form-control" id="pf_price" value="${p?.price || ''}" required></div>
        </div>
        <div class="col-md-2">
          <label class="form-label">Opening Stock</label>
          <input type="number" class="form-control" id="pf_stock" value="${p?.stock || 0}">
        </div>
        <div class="col-md-2">
          <label class="form-label">Reorder Level</label>
          <input type="number" class="form-control" id="pf_reorder" value="${p?.reorder || 10}">
        </div>
        <div class="col-md-6">
          <label class="form-label">Supplier</label>
          <select class="form-select" id="pf_supplier">
            <option value="">— None —</option>
            ${SUPPLIERS.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
          </select>
        </div>
        <div class="col-md-6">
          <label class="form-label">Status</label>
          <select class="form-select" id="pf_status">
            <option value="active" ${p?.status === 'active' ? 'selected' : ''}>Active</option>
            <option value="inactive" ${p?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
          </select>
        </div>
        <div class="col-12">
          <label class="form-label">Description</label>
          <textarea class="form-control" id="pf_desc" rows="2"></textarea>
        </div>
        <div class="col-12">
          <label class="form-label">Product Images</label>
          <div class="d-flex gap-2 flex-wrap">
            <div class="product-thumb d-flex align-items-center justify-content-center" style="width:60px;height:60px;font-size:24px;">${p?.image || '📦'}</div>
            <div class="border rounded d-flex align-items-center justify-content-center text-muted" style="width:60px;height:60px;cursor:pointer;" id="pf_upload"><i class="bi bi-plus-lg"></i></div>
          </div>
        </div>
      </div>
    </form>`;
  const footer = `<button class="btn btn-light" data-bs-dismiss="modal">Cancel</button><button class="btn btn-primary" id="pf_save">${isEdit ? 'Update' : 'Add'} Product</button>`;
  const modal = formModal(isEdit ? 'Edit Product' : 'Add New Product', body, footer, 'lg');
  document.getElementById('pf_genSku').addEventListener('click', () => { document.getElementById('pf_sku').value = 'SKU-' + Math.floor(1000 + Math.random()*9000); });
  document.getElementById('pf_upload').addEventListener('click', () => showToast('Image upload (demo)', 'info'));
  document.getElementById('pf_save').addEventListener('click', () => {
    const form = document.getElementById('productForm');
    let valid = true;
    ['pf_name', 'pf_cost', 'pf_price'].forEach(id => {
      const el = document.getElementById(id);
      if (!el.value.trim()) { el.classList.add('is-invalid'); valid = false; } else el.classList.remove('is-invalid');
    });
    if (!valid) { showToast('Please fill in all required fields', 'error'); return; }
    const data = {
      name: document.getElementById('pf_name').value,
      sku: document.getElementById('pf_sku').value,
      barcode: document.getElementById('pf_barcode').value,
      category: document.getElementById('pf_category').value,
      brand: document.getElementById('pf_brand').value,
      unit: document.getElementById('pf_unit').value,
      tax: +document.getElementById('pf_tax').value,
      cost: +document.getElementById('pf_cost').value,
      price: +document.getElementById('pf_price').value,
      stock: +document.getElementById('pf_stock').value,
      reorder: +document.getElementById('pf_reorder').value,
      status: document.getElementById('pf_status').value,
      image: p?.image || '📦',
    };
    if (isEdit) { Object.assign(p, data); showToast('Product updated successfully', 'success'); }
    else { PRODUCTS.push({ id: 'p' + Date.now(), ...data }); showToast('Product added successfully', 'success'); }
    modal.hide();
    renderProductTable();
  });
}

function showBarcode(id) {
  const p = productById(id);
  const body = `
    <div class="text-center">
      <div class="product-thumb mx-auto mb-3" style="width:80px;height:80px;font-size:40px;">${p.image || '📦'}</div>
      <h5 class="fw-700">${p.name}</h5>
      <div class="text-muted mb-3">SKU: ${p.sku}</div>
      <div class="border rounded p-4 mb-3" style="background:#fff;">
        <svg viewBox="0 0 200 80" width="200" height="80">
          ${Array.from({length: 40}, (_, i) => `<rect x="${i*5}" y="10" width="${(i*7%4)+1}" height="50" fill="#000"/>`).join('')}
        </svg>
        <div class="fw-600 mt-2" style="font-family:monospace;letter-spacing:2px;">${p.barcode}</div>
      </div>
      <p class="text-muted small">Barcode preview</p>
    </div>`;
  const footer = `<button class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button><button class="btn btn-primary" id="printBarcodeBtn"><i class="bi bi-printer me-1"></i>Print Labels</button>`;
  const modal = formModal('Barcode / QR — ' + p.name, body, footer);
  document.getElementById('printBarcodeBtn').addEventListener('click', () => {
    printHTML(`<html><head><title>Barcode Label</title></head><body style="text-align:center;padding:20px;"><h4>${p.name}</h4><svg viewBox="0 0 200 80" width="200" height="80">${Array.from({length:40},(_,i)=>`<rect x="${i*5}" y="10" width="${(i*7%4)+1}" height="50" fill="#000"/>`).join('')}</svg><div style="font-family:monospace;letter-spacing:2px;">${p.barcode}</div><p>${fmtMoney(p.price)}</p></body></html>`);
  });
}

function renderCategoryList(c) {
  c.innerHTML = `
    <div class="toolbar">
      <div class="toolbar-spacer"></div>
      <button class="btn btn-primary btn-sm" id="addCatBtn"><i class="bi bi-plus-lg me-1"></i>Add Category</button>
    </div>
    <div class="row g-3" id="catGrid">
      ${CATEGORIES.map(cat => `
        <div class="col-md-4 col-sm-6">
          <div class="card h-100">
            <div class="card-body d-flex align-items-center gap-3">
              <div class="kpi-icon bg-soft-${cat.color}"><i class="bi ${cat.icon}"></i></div>
              <div class="flex-grow-1">
                <div class="fw-700">${cat.name}</div>
                <div class="small text-muted">${PRODUCTS.filter(p => p.category === cat.id).length} products</div>
              </div>
              <div class="table-actions">
                <button class="icon-btn" data-edit-cat="${cat.id}"><i class="bi bi-pencil"></i></button>
                <button class="icon-btn danger" data-del-cat="${cat.id}"><i class="bi bi-trash"></i></button>
              </div>
            </div>
          </div>
        </div>`).join('')}
    </div>`;
  c.querySelector('#addCatBtn').addEventListener('click', () => categoryFormModal());
  c.querySelectorAll('[data-edit-cat]').forEach(b => b.addEventListener('click', () => categoryFormModal(b.dataset.editCat)));
  c.querySelectorAll('[data-del-cat]').forEach(b => b.addEventListener('click', () => {
    const cat = CATEGORIES.find(x => x.id === b.dataset.delCat);
    confirmModal('Delete Category', `Delete <strong>${cat.name}</strong>? Products in this category will be uncategorized.`, () => {
      const idx = CATEGORIES.findIndex(x => x.id === cat.id);
      if (idx >= 0) CATEGORIES.splice(idx, 1);
      renderCategoryList(c);
      showToast('Category deleted', 'success');
    });
  }));
}

function categoryFormModal(id) {
  const cat = id ? CATEGORIES.find(c => c.id === id) : null;
  const body = `
    <form id="catForm">
      <div class="mb-3"><label class="form-label">Category Name *</label><input type="text" class="form-control" id="cf_name" value="${cat?.name || ''}" required></div>
      <div class="mb-3"><label class="form-label">Icon</label><select class="form-select" id="cf_icon">
        ${['bi-tag','bi-cup-straw','bi-cookie','bi-egg-fried','bi-bread-slice','bi-house','bi-droplet','bi-basket','bi-snow','bi-box','bi-phone'].map(i => `<option value="${i}" ${cat?.icon === i ? 'selected' : ''}>${i}</option>`).join('')}
      </select></div>
      <div class="mb-3"><label class="form-label">Color</label><select class="form-select" id="cf_color">
        ${['primary','success','warning','danger','info','secondary'].map(col => `<option value="${col}" ${cat?.color === col ? 'selected' : ''}>${col}</option>`).join('')}
      </select></div>
    </form>`;
  const footer = `<button class="btn btn-light" data-bs-dismiss="modal">Cancel</button><button class="btn btn-primary" id="cf_save">${cat ? 'Update' : 'Add'} Category</button>`;
  const modal = formModal(cat ? 'Edit Category' : 'Add Category', body, footer);
  document.getElementById('cf_save').addEventListener('click', () => {
    const name = document.getElementById('cf_name').value.trim();
    if (!name) { document.getElementById('cf_name').classList.add('is-invalid'); return; }
    const data = { name, icon: document.getElementById('cf_icon').value, color: document.getElementById('cf_color').value };
    if (cat) { Object.assign(cat, data); showToast('Category updated', 'success'); }
    else { CATEGORIES.push({ id: 'cat' + Date.now(), ...data }); showToast('Category added', 'success'); }
    modal.hide();
    renderCategoryList(document.getElementById('productTabContent'));
  });
}

function renderBrandList(c) {
  c.innerHTML = `
    <div class="toolbar">
      <div class="toolbar-spacer"></div>
      <button class="btn btn-primary btn-sm" id="addBrandBtn"><i class="bi bi-plus-lg me-1"></i>Add Brand</button>
    </div>
    <div class="card table-card">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead><tr><th>Brand Name</th><th>Products</th><th class="text-end">Actions</th></tr></thead>
            <tbody>
              ${BRANDS.map(b => `
                <tr>
                  <td class="fw-600">${b.name}</td>
                  <td>${PRODUCTS.filter(p => p.brand === b.id).length} products</td>
                  <td class="text-end">
                    <div class="table-actions">
                      <button class="icon-btn" data-edit-brand="${b.id}"><i class="bi bi-pencil"></i></button>
                      <button class="icon-btn danger" data-del-brand="${b.id}"><i class="bi bi-trash"></i></button>
                    </div>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  c.querySelector('#addBrandBtn').addEventListener('click', () => brandFormModal());
  c.querySelectorAll('[data-edit-brand]').forEach(b => b.addEventListener('click', () => brandFormModal(b.dataset.editBrand)));
  c.querySelectorAll('[data-del-brand]').forEach(b => b.addEventListener('click', () => {
    const br = BRANDS.find(x => x.id === b.dataset.delBrand);
    confirmModal('Delete Brand', `Delete <strong>${br.name}</strong>?`, () => {
      const idx = BRANDS.findIndex(x => x.id === br.id);
      if (idx >= 0) BRANDS.splice(idx, 1);
      renderBrandList(c);
      showToast('Brand deleted', 'success');
    });
  }));
}

function brandFormModal(id) {
  const br = id ? BRANDS.find(b => b.id === id) : null;
  const body = `<form id="brandForm"><div class="mb-3"><label class="form-label">Brand Name *</label><input type="text" class="form-control" id="bf_name" value="${br?.name || ''}" required></div></form>`;
  const footer = `<button class="btn btn-light" data-bs-dismiss="modal">Cancel</button><button class="btn btn-primary" id="bf_save">${br ? 'Update' : 'Add'} Brand</button>`;
  const modal = formModal(br ? 'Edit Brand' : 'Add Brand', body, footer);
  document.getElementById('bf_save').addEventListener('click', () => {
    const name = document.getElementById('bf_name').value.trim();
    if (!name) { document.getElementById('bf_name').classList.add('is-invalid'); return; }
    if (br) { br.name = name; showToast('Brand updated', 'success'); }
    else { BRANDS.push({ id: 'br' + Date.now(), name }); showToast('Brand added', 'success'); }
    modal.hide();
    renderBrandList(document.getElementById('productTabContent'));
  });
}
