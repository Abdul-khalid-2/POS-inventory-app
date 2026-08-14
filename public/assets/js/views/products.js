/* Products View — wired to real /catalog/* endpoints (see routes/web.php) */

let productState = { page: 1, perPage: 20, search: '', categoryId: 'all', brandId: 'all', stockStatus: 'all', subTab: 'products' };

// Loaded once per view entry, reused by filter dropdowns and the
// product form. Categories/Brands screens still do their own fresh
// fetch (see renderCategoryList/renderBrandList) so product counts
// stay current after edits.
let catalogLookups = { categories: [], brands: [], units: [], taxes: [] };

registerView('products', async function() {
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

  document.getElementById('productTabContent').innerHTML = simpleLoading();
  try {
    const [categories, brands, units, taxes] = await Promise.all([
      apiFetch('/catalog/categories'),
      apiFetch('/catalog/brands'),
      apiFetch('/catalog/units'),
      apiFetch('/catalog/taxes'),
    ]);
    catalogLookups = { categories: categories.data, brands: brands.data, units: units.data, taxes: taxes.data };
  } catch (e) {
    document.getElementById('productTabContent').innerHTML = emptyState('bi-exclamation-triangle', "Couldn't load catalog data", e.message);
    return;
  }

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
        ${catalogLookups.categories.map(cat => `<option value="${cat.id}" ${String(productState.categoryId) === String(cat.id) ? 'selected' : ''}>${cat.name}</option>`).join('')}
      </select>
      <select class="form-select form-select-sm" id="prodBrand" style="width:auto;">
        <option value="all">All Brands</option>
        ${catalogLookups.brands.map(b => `<option value="${b.id}" ${String(productState.brandId) === String(b.id) ? 'selected' : ''}>${b.name}</option>`).join('')}
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

  document.getElementById('prodSearch').addEventListener('input', debounce(e => { productState.search = e.target.value; productState.page = 1; renderProductTable(); }, 350));
  document.getElementById('prodCat').addEventListener('change', e => { productState.categoryId = e.target.value; productState.page = 1; renderProductTable(); });
  document.getElementById('prodBrand').addEventListener('change', e => { productState.brandId = e.target.value; productState.page = 1; renderProductTable(); });
  document.getElementById('prodStock').addEventListener('change', e => { productState.stockStatus = e.target.value; productState.page = 1; renderProductTable(); });
  document.getElementById('addProductBtn').addEventListener('click', () => productFormModal());
  document.getElementById('fabAddProduct').addEventListener('click', () => productFormModal());
  document.getElementById('importCsvBtn').addEventListener('click', () => showToast('CSV import is not built yet', 'info'));
  document.getElementById('exportProdBtn').addEventListener('click', exportFilteredProducts);
  document.getElementById('prodSelectAll').addEventListener('change', e => {
    document.querySelectorAll('#prodTableBody .row-check').forEach(cb => cb.checked = e.target.checked);
  });
  renderProductTable();
}

function buildProductQuery(extra = {}) {
  const params = new URLSearchParams();
  if (productState.search) params.set('q', productState.search);
  if (productState.categoryId !== 'all') params.set('category_id', productState.categoryId);
  if (productState.brandId !== 'all') params.set('brand_id', productState.brandId);
  if (productState.stockStatus !== 'all') params.set('stock_status', productState.stockStatus);
  Object.entries(extra).forEach(([k, v]) => params.set(k, v));
  return params.toString();
}

let lastLoadedProducts = [];

async function renderProductTable() {
  const body = document.getElementById('prodTableBody');
  body.innerHTML = skeletonRows(6, 9);

  let result;
  try {
    const qs = buildProductQuery({ page: productState.page, per_page: productState.perPage });
    result = await apiFetch(`/catalog/products?${qs}`);
  } catch (e) {
    body.innerHTML = `<tr><td colspan="9">${emptyState('bi-exclamation-triangle', "Couldn't load products", e.message)}</td></tr>`;
    document.getElementById('prodPagination').innerHTML = '';
    return;
  }

  const items = result.data;
  const meta = result.meta;
  lastLoadedProducts = items;

  if (!items.length) {
    body.innerHTML = `<tr><td colspan="9">${emptyState('bi-box-seam', 'No products found', 'Try adjusting filters or add a new product.')}</td></tr>`;
  } else {
    body.innerHTML = items.map(p => `
      <tr>
        <td><input type="checkbox" class="form-check-input row-check" data-id="${p.id}"></td>
        <td><div class="d-flex align-items-center gap-2">${productThumb(p)}<div><div class="fw-600">${p.name}</div><div class="small text-muted">${p.unit.short_code}</div></div></div></td>
        <td><div class="fw-600">${p.sku}</div><div class="small text-muted">${p.barcode || '—'}</div></td>
        <td>${p.category?.name || '—'}</td>
        <td>${p.brand?.name || '—'}</td>
        <td class="text-money">${fmtMoney(p.cost_price)}</td>
        <td class="text-money fw-600">${fmtMoney(p.sale_price)}</td>
        <td><span class="fw-600">${p.current_stock}</span> <span class="small text-muted">${p.unit.short_code}</span></td>
        <td>${stockBadge(p.current_stock, p.reorder_level)}</td>
        <td class="text-end">
          <div class="table-actions">
            <button class="icon-btn" data-barcode="${p.id}" title="Barcode"><i class="bi bi-upc-scan"></i></button>
            <button class="icon-btn" data-edit-prod="${p.id}" title="Edit"><i class="bi bi-pencil"></i></button>
            <button class="icon-btn danger" data-del-prod="${p.id}" title="Delete"><i class="bi bi-trash"></i></button>
          </div>
        </td>
      </tr>`).join('');

    body.querySelectorAll('[data-edit-prod]').forEach(b => b.addEventListener('click', () => {
      const p = items.find(x => String(x.id) === b.dataset.editProd);
      productFormModal(p);
    }));
    body.querySelectorAll('[data-del-prod]').forEach(b => b.addEventListener('click', () => {
      const p = items.find(x => String(x.id) === b.dataset.delProd);
      confirmModal('Delete Product', `Are you sure you want to delete <strong>${p.name}</strong>? This cannot be undone.`, async () => {
        try {
          await apiFetch(`/catalog/products/${p.id}`, { method: 'DELETE' });
          showToast('Product deleted successfully', 'success');
          renderProductTable();
        } catch (e) {
          showToast(e.message, 'error');
        }
      });
    }));
    body.querySelectorAll('[data-barcode]').forEach(b => b.addEventListener('click', () => {
      const p = items.find(x => String(x.id) === b.dataset.barcode);
      showBarcode(p);
    }));
  }

  const pag = document.getElementById('prodPagination');
  pag.innerHTML = `<div class="small text-muted">${meta.total} products</div>${renderPagination(meta.total, meta.current_page, meta.per_page, p => { productState.page = p; renderProductTable(); })}`;
  attachPaginationClicks(pag, p => { productState.page = p; renderProductTable(); });
}

function productThumb(p, size = 40) {
  if (p.image_url) {
    return `<img src="${p.image_url}" class="product-thumb" style="width:${size}px;height:${size}px;">`;
  }
  return `<div class="product-thumb" style="width:${size}px;height:${size}px;"><i class="bi bi-box-seam"></i></div>`;
}

async function exportFilteredProducts() {
  let result;
  try {
    const qs = buildProductQuery({ per_page: 1000 });
    result = await apiFetch(`/catalog/products?${qs}`);
  } catch (e) {
    showToast("Couldn't export: " + e.message, 'error');
    return;
  }
  exportCSV('products.csv', ['Name', 'SKU', 'Barcode', 'Category', 'Brand', 'Cost', 'Price', 'Stock', 'Unit', 'Status'],
    result.data.map(p => [p.name, p.sku, p.barcode, p.category?.name, p.brand?.name, p.cost_price, p.sale_price, p.current_stock, p.unit.short_code, p.status]));
}

function productFormModal(p) {
  const isEdit = !!p;
  let selectedImageFile = null;
  let imageRemoved = false;

  const body = `
    <form id="productForm" novalidate>
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label">Product Name *</label>
          <input type="text" class="form-control" id="pf_name" value="${p?.name || ''}" required>
          <div class="invalid-feedback">Product name is required.</div>
        </div>
        <div class="col-md-6">
          <label class="form-label">SKU *</label>
          <div class="input-group">
            <input type="text" class="form-control" id="pf_sku" value="${p?.sku || ''}" required>
            <button class="btn btn-outline-secondary" type="button" id="pf_genSku" title="Generate from category"><i class="bi bi-arrow-repeat"></i></button>
          </div>
        </div>
        <div class="col-md-6">
          <label class="form-label">Barcode</label>
          <div class="input-group">
            <input type="text" class="form-control" id="pf_barcode" value="${p?.barcode || ''}">
            <button class="btn btn-outline-secondary" type="button" id="pf_genBarcode" title="Generate EAN-13"><i class="bi bi-upc-scan"></i></button>
          </div>
        </div>
        <div class="col-md-3">
          <label class="form-label">Category *</label>
          <select class="form-select" id="pf_category" required>
            ${catalogLookups.categories.map(c => `<option value="${c.id}" ${p?.category?.id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Brand</label>
          <select class="form-select" id="pf_brand">
            <option value="">— None —</option>
            ${catalogLookups.brands.map(b => `<option value="${b.id}" ${p?.brand?.id === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Unit *</label>
          <select class="form-select" id="pf_unit" required>
            ${catalogLookups.units.map(u => `<option value="${u.id}" ${p?.unit?.id === u.id ? 'selected' : ''}>${u.name} (${u.short_code})</option>`).join('')}
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Tax Rate</label>
          <select class="form-select" id="pf_tax">
            <option value="">— None —</option>
            ${catalogLookups.taxes.map(t => `<option value="${t.id}" ${p?.tax?.id === t.id ? 'selected' : ''}>${t.name} (${t.rate}%)</option>`).join('')}
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label">Cost Price *</label>
          <div class="input-group"><span class="input-group-text">${CURRENCY}</span><input type="number" step="0.01" class="form-control" id="pf_cost" value="${p?.cost_price ?? ''}" required></div>
        </div>
        <div class="col-md-4">
          <label class="form-label">Sale Price *</label>
          <div class="input-group"><span class="input-group-text">${CURRENCY}</span><input type="number" step="0.01" class="form-control" id="pf_price" value="${p?.sale_price ?? ''}" required></div>
        </div>
        ${isEdit ? '' : `
        <div class="col-md-2">
          <label class="form-label">Opening Stock</label>
          <input type="number" class="form-control" id="pf_stock" value="0">
        </div>`}
        <div class="col-md-2">
          <label class="form-label">Reorder Level</label>
          <input type="number" class="form-control" id="pf_reorder" value="${p?.reorder_level ?? 10}">
        </div>
        ${isEdit ? `
        <div class="col-md-4">
          <label class="form-label">Current Stock</label>
          <input type="number" class="form-control" value="${p.current_stock}" disabled>
          <div class="form-text">Use Inventory adjustments to change stock, not this form.</div>
        </div>` : ''}
        <div class="col-md-6">
          <label class="form-label">Status</label>
          <select class="form-select" id="pf_status">
            <option value="active" ${(!p || p?.status === 'active') ? 'selected' : ''}>Active</option>
            <option value="inactive" ${p?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
          </select>
        </div>
        <div class="col-12">
          <label class="form-label">Description</label>
          <textarea class="form-control" id="pf_desc" rows="2">${p?.description || ''}</textarea>
        </div>
        <div class="col-12">
          <label class="form-label">Product Image</label>
          <div class="d-flex gap-2 align-items-center flex-wrap">
            <div id="pf_image_preview">${productThumb({ image_url: p?.image_url }, 60)}</div>
            <button type="button" class="btn btn-outline-secondary btn-sm" id="pf_upload_btn">
              <i class="bi bi-upload me-1"></i>${p?.image_url ? 'Replace' : 'Upload'}
            </button>
            ${p?.image_url ? '<button type="button" class="btn btn-outline-danger btn-sm" id="pf_remove_image_btn"><i class="bi bi-trash me-1"></i>Remove</button>' : ''}
            <input type="file" accept="image/png,image/jpeg,image/webp" id="pf_image_file" class="d-none">
          </div>
          <div class="form-text">JPG, PNG, or WEBP, up to 2MB.</div>
        </div>
      </div>
    </form>`;
  const footer = `<button class="btn btn-light" data-bs-dismiss="modal">Cancel</button><button class="btn btn-primary" id="pf_save">${isEdit ? 'Update' : 'Add'} Product</button>`;
  const modal = formModal(isEdit ? 'Edit Product' : 'Add New Product', body, footer, 'lg');

  document.getElementById('pf_genSku').addEventListener('click', async () => {
    const categoryId = document.getElementById('pf_category').value;
    if (!categoryId) { showToast('Pick a category first', 'error'); return; }
    try {
      const { sku } = await apiFetch(`/catalog/products/generate-sku?category_id=${categoryId}`);
      document.getElementById('pf_sku').value = sku;
    } catch (e) { showToast(e.message, 'error'); }
  });
  document.getElementById('pf_genBarcode').addEventListener('click', async () => {
    try {
      const { barcode } = await apiFetch('/catalog/products/generate-barcode');
      document.getElementById('pf_barcode').value = barcode;
    } catch (e) { showToast(e.message, 'error'); }
  });
  document.getElementById('pf_upload_btn').addEventListener('click', () => document.getElementById('pf_image_file').click());
  document.getElementById('pf_image_file').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    selectedImageFile = file;
    imageRemoved = false;
    const reader = new FileReader();
    reader.onload = ev => {
      document.getElementById('pf_image_preview').innerHTML = `<img src="${ev.target.result}" class="product-thumb" style="width:60px;height:60px;">`;
    };
    reader.readAsDataURL(file);
  });
  document.getElementById('pf_remove_image_btn')?.addEventListener('click', () => {
    selectedImageFile = null;
    imageRemoved = true;
    document.getElementById('pf_image_preview').innerHTML = productThumb({ image_url: null }, 60);
  });

  document.getElementById('pf_save').addEventListener('click', async () => {
    let valid = true;
    ['pf_name', 'pf_sku', 'pf_cost', 'pf_price'].forEach(id => {
      const el = document.getElementById(id);
      if (!el.value.trim()) { el.classList.add('is-invalid'); valid = false; } else el.classList.remove('is-invalid');
    });
    if (!valid) { showToast('Please fill in all required fields', 'error'); return; }

    const payload = {
      name: document.getElementById('pf_name').value,
      sku: document.getElementById('pf_sku').value,
      barcode: document.getElementById('pf_barcode').value || null,
      category_id: +document.getElementById('pf_category').value,
      brand_id: document.getElementById('pf_brand').value ? +document.getElementById('pf_brand').value : null,
      unit_id: +document.getElementById('pf_unit').value,
      tax_id: document.getElementById('pf_tax').value ? +document.getElementById('pf_tax').value : null,
      cost_price: +document.getElementById('pf_cost').value,
      sale_price: +document.getElementById('pf_price').value,
      reorder_level: +document.getElementById('pf_reorder').value,
      description: document.getElementById('pf_desc').value || null,
      status: document.getElementById('pf_status').value,
    };
    if (!isEdit) payload.current_stock = +document.getElementById('pf_stock').value;

    const saveBtn = document.getElementById('pf_save');
    saveBtn.disabled = true;

    let saved;
    try {
      saved = isEdit
        ? await apiFetch(`/catalog/products/${p.id}`, { method: 'PUT', body: payload })
        : await apiFetch('/catalog/products', { method: 'POST', body: payload });
    } catch (e) {
      saveBtn.disabled = false;
      showToast(e.errors ? Object.values(e.errors).flat()[0] : e.message, 'error');
      return;
    }

    const productId = saved.data.id;

    if (selectedImageFile) {
      const fd = new FormData();
      fd.append('image', selectedImageFile);
      try { await apiFetch(`/catalog/products/${productId}/image`, { method: 'POST', body: fd }); }
      catch (e) { showToast('Product saved, but image upload failed: ' + e.message, 'error'); }
    } else if (imageRemoved && isEdit) {
      try { await apiFetch(`/catalog/products/${productId}/image`, { method: 'DELETE' }); }
      catch (e) { /* non-critical */ }
    }

    showToast(isEdit ? 'Product updated successfully' : 'Product added successfully', 'success');
    modal.hide();
    renderProductTable();
  });
}

function showBarcode(p) {
  const body = `
    <div class="text-center">
      ${productThumb(p, 80)}
      <h5 class="fw-700 mt-3">${p.name}</h5>
      <div class="text-muted mb-3">SKU: ${p.sku}</div>
      ${p.barcode
        ? `<div class="border rounded p-3 mb-3 fw-600" style="font-family:monospace;letter-spacing:2px;">${p.barcode}</div>`
        : `<div class="text-danger small mb-3">No barcode set for this product yet.</div>`}
      <p class="text-muted small">Labels print as real scannable barcodes on the next screen.</p>
    </div>`;
  const footer = `<button class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
    <button class="btn btn-primary" id="printBarcodeBtn" ${p.barcode ? '' : 'disabled'}><i class="bi bi-printer me-1"></i>Print Label</button>`;
  formModal('Barcode — ' + p.name, body, footer);
  document.getElementById('printBarcodeBtn')?.addEventListener('click', () => {
    window.open(`/products/labels?ids=${p.id}`, '_blank');
  });
}

function renderCategoryList(c) {
  c.innerHTML = simpleLoading();
  apiFetch('/catalog/categories').then(({ data: categories }) => {
    c.innerHTML = `
      <div class="toolbar">
        <div class="toolbar-spacer"></div>
        <button class="btn btn-primary btn-sm" id="addCatBtn"><i class="bi bi-plus-lg me-1"></i>Add Category</button>
      </div>
      <div class="row g-3" id="catGrid">
        ${categories.map(cat => `
          <div class="col-md-4 col-sm-6">
            <div class="card h-100">
              <div class="card-body d-flex align-items-center gap-3">
                <div class="kpi-icon bg-soft-primary"><i class="bi bi-tag"></i></div>
                <div class="flex-grow-1">
                  <div class="fw-700">${cat.name}</div>
                  <div class="small text-muted">${cat.products_count} products &middot; SKU prefix: ${cat.sku_prefix || '—'}</div>
                </div>
                <div class="table-actions">
                  <button class="icon-btn" data-edit-cat="${cat.id}"><i class="bi bi-pencil"></i></button>
                  <button class="icon-btn danger" data-del-cat="${cat.id}"><i class="bi bi-trash"></i></button>
                </div>
              </div>
            </div>
          </div>`).join('')}
      </div>`;
    c.querySelector('#addCatBtn').addEventListener('click', () => categoryFormModal(null, categories));
    c.querySelectorAll('[data-edit-cat]').forEach(b => b.addEventListener('click', () => {
      categoryFormModal(categories.find(x => String(x.id) === b.dataset.editCat), categories);
    }));
    c.querySelectorAll('[data-del-cat]').forEach(b => b.addEventListener('click', () => {
      const cat = categories.find(x => String(x.id) === b.dataset.delCat);
      confirmModal('Delete Category', `Delete <strong>${cat.name}</strong>?`, async () => {
        try {
          await apiFetch(`/catalog/categories/${cat.id}`, { method: 'DELETE' });
          showToast('Category deleted', 'success');
          renderCategoryList(c);
        } catch (e) { showToast(e.message, 'error'); }
      });
    }));
  }).catch(e => { c.innerHTML = emptyState('bi-exclamation-triangle', "Couldn't load categories", e.message); });
}

function categoryFormModal(cat, allCategories) {
  const body = `
    <form id="catForm">
      <div class="mb-3"><label class="form-label">Category Name *</label><input type="text" class="form-control" id="cf_name" value="${cat?.name || ''}" required></div>
      <div class="mb-3"><label class="form-label">SKU Prefix</label><input type="text" class="form-control text-uppercase" id="cf_prefix" maxlength="5" value="${cat?.sku_prefix || ''}" placeholder="e.g. BEV">
        <div class="form-text">Used for auto-generated SKUs like BEV-007. Leave blank to use the first 3 letters of the name.</div>
      </div>
      <div class="mb-3"><label class="form-label">Status</label><select class="form-select" id="cf_status">
        <option value="active" ${(!cat || cat?.status === 'active') ? 'selected' : ''}>Active</option>
        <option value="inactive" ${cat?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
      </select></div>
    </form>`;
  const footer = `<button class="btn btn-light" data-bs-dismiss="modal">Cancel</button><button class="btn btn-primary" id="cf_save">${cat ? 'Update' : 'Add'} Category</button>`;
  const modal = formModal(cat ? 'Edit Category' : 'Add Category', body, footer);
  document.getElementById('cf_save').addEventListener('click', async () => {
    const name = document.getElementById('cf_name').value.trim();
    if (!name) { document.getElementById('cf_name').classList.add('is-invalid'); return; }
    const payload = {
      name,
      sku_prefix: document.getElementById('cf_prefix').value.trim() || null,
      status: document.getElementById('cf_status').value,
    };
    try {
      if (cat) await apiFetch(`/catalog/categories/${cat.id}`, { method: 'PUT', body: payload });
      else await apiFetch('/catalog/categories', { method: 'POST', body: payload });
      showToast(cat ? 'Category updated' : 'Category added', 'success');
      modal.hide();
      renderCategoryList(document.getElementById('productTabContent'));
    } catch (e) {
      showToast(e.errors ? Object.values(e.errors).flat()[0] : e.message, 'error');
    }
  });
}

function renderBrandList(c) {
  c.innerHTML = simpleLoading();
  apiFetch('/catalog/brands').then(({ data: brands }) => {
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
                ${brands.map(b => `
                  <tr>
                    <td class="fw-600">${b.name}</td>
                    <td>${b.products_count} products</td>
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
    c.querySelectorAll('[data-edit-brand]').forEach(b => b.addEventListener('click', () => {
      brandFormModal(brands.find(x => String(x.id) === b.dataset.editBrand));
    }));
    c.querySelectorAll('[data-del-brand]').forEach(b => b.addEventListener('click', () => {
      const br = brands.find(x => String(x.id) === b.dataset.delBrand);
      confirmModal('Delete Brand', `Delete <strong>${br.name}</strong>?`, async () => {
        try {
          await apiFetch(`/catalog/brands/${br.id}`, { method: 'DELETE' });
          showToast('Brand deleted', 'success');
          renderBrandList(c);
        } catch (e) { showToast(e.message, 'error'); }
      });
    }));
  }).catch(e => { c.innerHTML = emptyState('bi-exclamation-triangle', "Couldn't load brands", e.message); });
}

function brandFormModal(br) {
  const body = `
    <form id="brandForm">
      <div class="mb-3"><label class="form-label">Brand Name *</label><input type="text" class="form-control" id="bf_name" value="${br?.name || ''}" required></div>
      <div class="mb-3"><label class="form-label">Status</label><select class="form-select" id="bf_status">
        <option value="active" ${(!br || br?.status === 'active') ? 'selected' : ''}>Active</option>
        <option value="inactive" ${br?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
      </select></div>
    </form>`;
  const footer = `<button class="btn btn-light" data-bs-dismiss="modal">Cancel</button><button class="btn btn-primary" id="bf_save">${br ? 'Update' : 'Add'} Brand</button>`;
  const modal = formModal(br ? 'Edit Brand' : 'Add Brand', body, footer);
  document.getElementById('bf_save').addEventListener('click', async () => {
    const name = document.getElementById('bf_name').value.trim();
    if (!name) { document.getElementById('bf_name').classList.add('is-invalid'); return; }
    const payload = { name, status: document.getElementById('bf_status').value };
    try {
      if (br) await apiFetch(`/catalog/brands/${br.id}`, { method: 'PUT', body: payload });
      else await apiFetch('/catalog/brands', { method: 'POST', body: payload });
      showToast(br ? 'Brand updated' : 'Brand added', 'success');
      modal.hide();
      renderBrandList(document.getElementById('productTabContent'));
    } catch (e) {
      showToast(e.errors ? Object.values(e.errors).flat()[0] : e.message, 'error');
    }
  });
}
