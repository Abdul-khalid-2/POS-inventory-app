/* POS Terminal View — wired to real /catalog/* endpoints. Held orders
   stay in-memory for now (persisting them is the next roadmap item). */

let posState = {
  cart: [],
  customerId: '', // '' = walk-in (customer_id: null)
  discount: 0,
  discountType: 'amount',
  paymentMethod: 'cash',
  activeCategory: 'all',
  search: '',
  heldOrders: [],
};

let posProducts = [];
let posCategories = [];
let posCustomers = [];

registerView('pos', async function() {
  breadcrumb([{ label: 'Home', view: 'dashboard' }, { label: 'POS Terminal' }]);
  posState.cart = [];
  posState.discount = 0;

  document.getElementById('content').innerHTML = simpleLoading();
  try {
    const [productsRes, categoriesRes, customersRes] = await Promise.all([
      apiFetch('/catalog/products?status=active&per_page=1000'),
      apiFetch('/catalog/categories'),
      apiFetch('/catalog/customers'),
    ]);
    posProducts = productsRes.data;
    posCategories = categoriesRes.data;
    posCustomers = customersRes.data;
  } catch (e) {
    document.getElementById('content').innerHTML = emptyState('bi-exclamation-triangle', "Couldn't load the POS terminal", e.message);
    return;
  }

  const html = `
    <div class="pos-layout">
      <div class="pos-left">
        <div class="pos-search-row">
          <div class="search-box flex-grow-1" style="position:relative;">
            <i class="bi bi-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);"></i>
            <input type="text" class="form-control" id="posSearch" placeholder="Search products or scan barcode… (F2)" style="padding-left:34px;" autofocus>
          </div>
          <button class="btn btn-outline-secondary" id="heldOrdersBtn" title="Held Orders (F6)">
            <i class="bi bi-pause-circle"></i> <span class="badge bg-secondary" id="heldCount">${posState.heldOrders.length}</span>
          </button>
          <button class="btn btn-outline-secondary d-none d-md-block" id="shortcutInfo" title="Shortcuts">
            <i class="bi bi-keyboard"></i>
          </button>
        </div>
        <div class="pos-cat-tabs" id="posCatTabs">
          <button class="pos-cat-tab active" data-cat="all">All</button>
          ${posCategories.map(c => `<button class="pos-cat-tab" data-cat="${c.id}">${c.name}</button>`).join('')}
        </div>
        <div class="pos-product-grid" id="posProductGrid"></div>
      </div>

      <div class="pos-right">
        <div class="cart-header">
          <div>
            <span class="fw-700 fs-5">Current Order</span>
            <span class="badge bg-soft-primary ms-2" id="cartCount">0 items</span>
          </div>
          <button class="btn btn-soft-danger btn-sm" id="clearCart" title="Clear cart"><i class="bi bi-trash"></i></button>
        </div>
        <div class="cart-items" id="cartItems">
          <div class="empty-state" style="padding:30px 10px;">
            <div class="empty-icon"><i class="bi bi-cart-x"></i></div>
            <p class="small mb-0">Cart is empty. Tap a product to add.</p>
          </div>
        </div>
        <div class="cart-footer">
          <div class="mb-2">
            <label class="form-label small fw-600 mb-1">Customer</label>
            <select class="form-select form-select-sm" id="posCustomer">
              <option value="">Walk-in Customer</option>
              ${posCustomers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
          </div>
          <div class="row g-2 mb-2">
            <div class="col-7">
              <label class="form-label small fw-600 mb-1">Discount</label>
              <div class="input-group input-group-sm">
                <input type="number" class="form-control" id="posDiscount" placeholder="0" min="0" value="0">
                <select class="form-select" id="posDiscountType" style="max-width:50px;">
                  <option value="amount">${CURRENCY}</option>
                  <option value="percent">%</option>
                </select>
              </div>
            </div>
            <div class="col-5">
              <label class="form-label small fw-600 mb-1">Tax</label>
              <input type="text" class="form-control form-control-sm" id="posTax" readonly value="${CURRENCY}0.00">
            </div>
          </div>
          <div class="cart-totals">
            <div class="total-row"><span>Subtotal</span><span id="posSubtotal">${CURRENCY}0.00</span></div>
            <div class="total-row"><span>Discount</span><span id="posDiscountShow">-${CURRENCY}0.00</span></div>
            <div class="total-row"><span>Tax</span><span id="posTaxShow">${CURRENCY}0.00</span></div>
            <div class="total-row grand"><span>Total</span><span id="posGrandTotal">${CURRENCY}0.00</span></div>
          </div>
          <div class="payment-tabs" id="paymentTabs">
            <div class="payment-tab active" data-method="cash"><i class="bi bi-cash-coin"></i>Cash</div>
            <div class="payment-tab" data-method="card"><i class="bi bi-credit-card"></i>Card</div>
            <div class="payment-tab" data-method="wallet"><i class="bi bi-phone"></i>Wallet</div>
            <div class="payment-tab" data-method="credit"><i class="bi bi-wallet2"></i>Credit</div>
          </div>
          <div class="row g-2 mb-2" id="cashPaymentRow">
            <div class="col-7">
              <label class="form-label small fw-600 mb-1">Amount Tendered</label>
              <input type="number" class="form-control form-control-sm" id="posTendered" placeholder="0.00" min="0">
            </div>
            <div class="col-5">
              <label class="form-label small fw-600 mb-1">Change</label>
              <input type="text" class="form-control form-control-sm" id="posChange" readonly value="${CURRENCY}0.00">
            </div>
          </div>
          <div class="small text-muted mb-2" id="creditNote" style="display:none;">
            <i class="bi bi-info-circle me-1"></i>No payment collected — the full total is added to this customer's balance.
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-secondary flex-grow-1" id="holdOrderBtn"><i class="bi bi-pause-circle me-1"></i>Hold</button>
            <button class="btn btn-success flex-grow-1" id="chargeBtn"><i class="bi bi-check2-circle me-1"></i>Charge</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Held Orders Drawer -->
    <div class="held-orders-drawer" id="heldDrawer">
      <div class="cart-header">
        <span class="fw-700 fs-5">Held Orders</span>
        <button class="btn-close" id="closeHeldDrawer"></button>
      </div>
      <div class="cart-items" id="heldList">
        <div class="empty-state" style="padding:30px 10px;"><p class="small mb-0">No held orders.</p></div>
      </div>
    </div>
    <div class="sidebar-overlay" id="heldOverlay"></div>
  `;

  document.getElementById('content').innerHTML = html;
  attachPOSEvents();
  renderPOSProducts();
  renderCart();
});

function renderPOSProducts() {
  const grid = document.getElementById('posProductGrid');
  let items = posProducts;
  if (posState.activeCategory !== 'all') items = items.filter(p => String(p.category?.id) === String(posState.activeCategory));
  if (posState.search) {
    const q = posState.search.toLowerCase();
    items = items.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.barcode || '').includes(q));
  }
  if (!items.length) { grid.innerHTML = emptyState('bi-search', 'No products found', 'Try a different search or category.'); return; }
  grid.innerHTML = items.map(p => `
    <div class="pos-product-card ${p.current_stock <= 0 ? 'out-of-stock' : ''}" data-product="${p.id}">
      <div class="pos-product-img">${p.image_url ? `<img src="${p.image_url}" style="width:100%;height:100%;object-fit:cover;">` : '<i class="bi bi-box-seam"></i>'}</div>
      <div class="pos-product-name">${p.name}</div>
      <div class="pos-product-price">${fmtMoney(p.sale_price)}</div>
      <div class="pos-product-stock">${p.current_stock <= 0 ? 'Out of stock' : p.current_stock + ' ' + p.unit.short_code + ' left'}</div>
    </div>`).join('');
  grid.querySelectorAll('.pos-product-card').forEach(card => {
    card.addEventListener('click', () => {
      if (card.classList.contains('out-of-stock')) { showToast('Product is out of stock', 'warning'); return; }
      addToCart(card.dataset.product);
    });
  });
}

function addToCart(productId) {
  const p = posProducts.find(x => String(x.id) === String(productId));
  if (!p) return;
  const existing = posState.cart.find(i => String(i.productId) === String(productId));
  if (existing) {
    if (existing.qty >= p.current_stock) { showToast(`Only ${p.current_stock} ${p.unit.short_code} in stock`, 'warning'); return; }
    existing.qty++;
  } else {
    posState.cart.push({ productId: p.id, name: p.name, price: p.sale_price, qty: 1, taxRate: p.tax?.rate || 0, unit: p.unit.short_code, maxStock: p.current_stock });
  }
  renderCart();
}

function renderCart() {
  const container = document.getElementById('cartItems');
  if (!container) return;
  if (!posState.cart.length) {
    container.innerHTML = `<div class="empty-state" style="padding:30px 10px;"><div class="empty-icon"><i class="bi bi-cart-x"></i></div><p class="small mb-0">Cart is empty. Tap a product to add.</p></div>`;
  } else {
    container.innerHTML = posState.cart.map((item, i) => `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${fmtMoney(item.price)} each</div>
        </div>
        <div class="qty-stepper">
          <button data-qty-dec="${i}">−</button>
          <input class="qty-val" value="${item.qty}" data-qty-input="${i}" readonly>
          <button data-qty-inc="${i}">+</button>
        </div>
        <div class="cart-item-total">${fmtMoney(item.price * item.qty)}</div>
        <button class="icon-btn danger" data-remove="${i}"><i class="bi bi-x-lg"></i></button>
      </div>`).join('');
    container.querySelectorAll('[data-qty-inc]').forEach(b => b.addEventListener('click', () => {
      const i = +b.dataset.qtyInc;
      const item = posState.cart[i];
      if (item.qty >= item.maxStock) { showToast(`Only ${item.maxStock} ${item.unit} in stock`, 'warning'); return; }
      item.qty++;
      renderCart();
    }));
    container.querySelectorAll('[data-qty-dec]').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.qtyDec; if (posState.cart[i].qty > 1) posState.cart[i].qty--; else posState.cart.splice(i, 1); renderCart(); }));
    container.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => { posState.cart.splice(+b.dataset.remove, 1); renderCart(); }));
  }
  updateTotals();
}

/**
 * Mirrors the server's checkout math exactly (proportional discount
 * allocation across lines, per-line tax at that product's own rate) —
 * this is only ever a preview; the actual charge is always computed
 * authoritatively server-side in SaleController::store from
 * product_id + quantity alone, never from anything calculated here.
 */
function calcTotals() {
  const subtotal = posState.cart.reduce((s, i) => s + i.price * i.qty, 0);
  let discount = 0;
  if (posState.discountType === 'amount') discount = Math.min(posState.discount, subtotal);
  else discount = +(subtotal * Math.min(posState.discount, 100) / 100).toFixed(2);

  let tax = 0;
  posState.cart.forEach(item => {
    const lineSubtotal = item.price * item.qty;
    const share = subtotal > 0 ? (lineSubtotal / subtotal) * discount : 0;
    tax += (lineSubtotal - share) * (item.taxRate / 100);
  });
  tax = +tax.toFixed(2);
  const total = +(subtotal - discount + tax).toFixed(2);
  return { subtotal, discount, tax, total };
}

function updateTotals() {
  const { subtotal, discount, tax, total } = calcTotals();
  document.getElementById('posSubtotal').textContent = fmtMoney(subtotal);
  document.getElementById('posDiscountShow').textContent = '-' + fmtMoney(discount);
  document.getElementById('posTaxShow').textContent = fmtMoney(tax);
  document.getElementById('posTax').value = fmtMoney(tax);
  document.getElementById('posGrandTotal').textContent = fmtMoney(total);
  document.getElementById('cartCount').textContent = posState.cart.reduce((s, i) => s + i.qty, 0) + ' items';
  const tendered = parseFloat(document.getElementById('posTendered')?.value) || 0;
  const change = Math.max(0, tendered - total);
  const changeEl = document.getElementById('posChange');
  if (changeEl) changeEl.value = fmtMoney(change);
}

function attachPOSEvents() {
  document.getElementById('posSearch').addEventListener('input', e => { posState.search = e.target.value; renderPOSProducts(); });
  document.getElementById('posSearch').focus();

  document.querySelectorAll('.pos-cat-tab').forEach(t => t.addEventListener('click', () => {
    document.querySelectorAll('.pos-cat-tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    posState.activeCategory = t.dataset.cat;
    renderPOSProducts();
  }));

  document.getElementById('posCustomer').addEventListener('change', e => { posState.customerId = e.target.value; });
  document.getElementById('posDiscount').addEventListener('input', e => { posState.discount = parseFloat(e.target.value) || 0; updateTotals(); });
  document.getElementById('posDiscountType').addEventListener('change', e => { posState.discountType = e.target.value; updateTotals(); });
  document.getElementById('posTendered').addEventListener('input', () => updateTotals());

  document.querySelectorAll('.payment-tab').forEach(t => t.addEventListener('click', () => {
    document.querySelectorAll('.payment-tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    posState.paymentMethod = t.dataset.method;
    document.getElementById('cashPaymentRow').style.display = (t.dataset.method === 'cash') ? '' : 'none';
    document.getElementById('creditNote').style.display = (t.dataset.method === 'credit') ? '' : 'none';
  }));

  document.getElementById('clearCart').addEventListener('click', () => {
    if (!posState.cart.length) return;
    confirmModal('Clear Cart', 'Remove all items from the current order?', () => { posState.cart = []; renderCart(); showToast('Cart cleared', 'info'); }, 'Clear');
  });

  document.getElementById('holdOrderBtn').addEventListener('click', holdOrder);
  document.getElementById('heldOrdersBtn').addEventListener('click', openHeldDrawer);
  document.getElementById('closeHeldDrawer').addEventListener('click', closeHeldDrawer);
  document.getElementById('heldOverlay').addEventListener('click', closeHeldDrawer);
  document.getElementById('shortcutInfo')?.addEventListener('click', showShortcuts);

  document.getElementById('chargeBtn').addEventListener('click', completeSale);

  document.addEventListener('keydown', posKeyHandler);
}

function posKeyHandler(e) {
  if (currentView !== 'pos') return;
  if (e.key === 'F2') { e.preventDefault(); document.getElementById('posSearch').focus(); }
  if (e.key === 'F4') { e.preventDefault(); document.getElementById('chargeBtn').click(); }
  if (e.key === 'F6') { e.preventDefault(); openHeldDrawer(); }
  if (e.key === 'F9') { e.preventDefault(); holdOrder(); }
}

function holdOrder() {
  if (!posState.cart.length) { showToast('Cart is empty — nothing to hold', 'warning'); return; }
  const { total } = calcTotals();
  posState.heldOrders.push({ id: Date.now(), cart: [...posState.cart], customerId: posState.customerId, discount: posState.discount, discountType: posState.discountType, total });
  posState.cart = [];
  posState.discount = 0;
  document.getElementById('posDiscount').value = 0;
  renderCart();
  document.getElementById('heldCount').textContent = posState.heldOrders.length;
  showToast('Order held successfully', 'success');
  renderHeldList();
}

function openHeldDrawer() {
  document.getElementById('heldDrawer').classList.add('open');
  document.getElementById('heldOverlay').classList.add('show');
  renderHeldList();
}

function closeHeldDrawer() {
  document.getElementById('heldDrawer').classList.remove('open');
  document.getElementById('heldOverlay').classList.remove('show');
}

function renderHeldList() {
  const list = document.getElementById('heldList');
  if (!list) return;
  if (!posState.heldOrders.length) { list.innerHTML = '<div class="empty-state" style="padding:30px 10px;"><p class="small mb-0">No held orders.</p></div>'; return; }
  list.innerHTML = posState.heldOrders.map((h, i) => {
    const customer = posCustomers.find(c => String(c.id) === String(h.customerId));
    return `
    <div class="cart-item" style="flex-direction:column;align-items:stretch;">
      <div class="d-flex justify-content-between">
        <span class="fw-600">Held Order #${i + 1}</span>
        <span class="fw-700">${fmtMoney(h.total)}</span>
      </div>
      <div class="small text-muted">${h.cart.length} items &middot; ${customer ? customer.name : 'Walk-in Customer'}</div>
      <div class="d-flex gap-2 mt-2">
        <button class="btn btn-soft-success btn-sm flex-grow-1" data-resume="${i}"><i class="bi bi-play-circle me-1"></i>Resume</button>
        <button class="btn btn-soft-danger btn-sm" data-delete-held="${i}"><i class="bi bi-trash"></i></button>
      </div>
    </div>`;
  }).join('');
  list.querySelectorAll('[data-resume]').forEach(b => b.addEventListener('click', () => {
    const idx = +b.dataset.resume;
    const held = posState.heldOrders[idx];
    posState.cart = held.cart;
    posState.customerId = held.customerId;
    posState.discount = held.discount;
    posState.discountType = held.discountType;
    document.getElementById('posCustomer').value = held.customerId;
    document.getElementById('posDiscount').value = held.discount;
    document.getElementById('posDiscountType').value = held.discountType;
    posState.heldOrders.splice(idx, 1);
    document.getElementById('heldCount').textContent = posState.heldOrders.length;
    renderCart();
    closeHeldDrawer();
    showToast('Held order resumed', 'success');
  }));
  list.querySelectorAll('[data-delete-held]').forEach(b => b.addEventListener('click', () => {
    const idx = +b.dataset.deleteHeld;
    posState.heldOrders.splice(idx, 1);
    document.getElementById('heldCount').textContent = posState.heldOrders.length;
    renderHeldList();
    showToast('Held order deleted', 'info');
  }));
}

function showShortcuts() {
  formModal('Keyboard Shortcuts', `
    <table class="table">
      <tr><td><kbd>F2</kbd></td><td>Focus search / barcode scan</td></tr>
      <tr><td><kbd>F4</kbd></td><td>Complete sale (charge)</td></tr>
      <tr><td><kbd>F6</kbd></td><td>Open held orders</td></tr>
      <tr><td><kbd>F9</kbd></td><td>Hold current order</td></tr>
    </table>`, `<button class="btn btn-primary" data-bs-dismiss="modal">Got it</button>`);
}

async function completeSale() {
  if (!posState.cart.length) { showToast('Cart is empty — add products first', 'warning'); return; }

  const { total } = calcTotals();
  const tendered = parseFloat(document.getElementById('posTendered').value) || 0;
  if (posState.paymentMethod === 'cash' && tendered < total) {
    showToast('Insufficient cash tendered', 'error');
    return;
  }

  const payload = {
    customer_id: posState.customerId || null,
    items: posState.cart.map(i => ({ product_id: i.productId, quantity: i.qty })),
    discount_type: posState.discountType,
    discount_value: posState.discount,
    payment_method: posState.paymentMethod,
    amount_tendered: posState.paymentMethod === 'cash' ? tendered : undefined,
  };

  const chargeBtn = document.getElementById('chargeBtn');
  chargeBtn.disabled = true;

  let sale;
  try {
    const result = await apiFetch('/catalog/sales', { method: 'POST', body: payload });
    sale = result.data;
  } catch (e) {
    chargeBtn.disabled = false;
    showToast(e.errors ? Object.values(e.errors).flat()[0] : e.message, 'error');
    return;
  }

  const change = Math.max(0, tendered - sale.grand_total);
  showSaleReceipt(sale, change);

  posState.cart = [];
  posState.discount = 0;
  renderCart();

  // Stock just changed server-side — refresh the grid so quantities
  // (and out-of-stock styling) reflect what actually happened.
  try {
    const refreshed = await apiFetch('/catalog/products?status=active&per_page=1000');
    posProducts = refreshed.data;
    renderPOSProducts();
  } catch (e) { /* non-critical — grid just stays stale until next navigation */ }
}

function showSaleReceipt(sale, change) {
  const itemCount = sale.items.reduce((s, i) => s + i.quantity, 0);
  const successHtml = `
    <div class="text-center py-3">
      <div class="kpi-icon mx-auto mb-3 bg-soft-success" style="width:64px;height:64px;font-size:32px;"><i class="bi bi-check-lg"></i></div>
      <h4 class="fw-700">Sale Completed!</h4>
      <p class="text-muted">Invoice ${sale.invoice_no}</p>
      <div class="row text-start mt-4">
        <div class="col-6"><div class="text-muted small">Customer</div><div class="fw-600">${sale.customer?.name || 'Walk-in Customer'}</div></div>
        <div class="col-6 text-end"><div class="text-muted small">Date</div><div class="fw-600">${fmtDate(sale.sale_date)}</div></div>
        <div class="col-6 mt-2"><div class="text-muted small">Items</div><div class="fw-600">${itemCount}</div></div>
        <div class="col-6 mt-2 text-end"><div class="text-muted small">Payment</div><div class="fw-600 text-capitalize">${sale.payment_status === 'due' ? 'Credit' : sale.payment_status}</div></div>
        <div class="col-12 mt-3"><hr></div>
        <div class="col-6"><div class="text-muted small">Subtotal</div><div class="fw-600">${fmtMoney(sale.subtotal)}</div></div>
        <div class="col-6 text-end"><div class="text-muted small">Discount</div><div class="fw-600">-${fmtMoney(sale.discount)}</div></div>
        <div class="col-6 mt-1"><div class="text-muted small">Tax</div><div class="fw-600">${fmtMoney(sale.tax_total)}</div></div>
        <div class="col-6 mt-1 text-end"><div class="text-muted small">Total</div><div class="fw-700 fs-5">${fmtMoney(sale.grand_total)}</div></div>
        ${sale.paid_amount > 0 && change > 0 ? `<div class="col-6 mt-1"><div class="text-muted small">Tendered</div><div class="fw-600">${fmtMoney(sale.paid_amount + change)}</div></div><div class="col-6 mt-1 text-end"><div class="text-muted small">Change</div><div class="fw-600 text-success">${fmtMoney(change)}</div></div>` : ''}
        ${sale.due_amount > 0 ? `<div class="col-12 mt-2"><div class="alert alert-warning py-2 small mb-0">Added ${fmtMoney(sale.due_amount)} to this customer's balance.</div></div>` : ''}
      </div>
    </div>`;

  const footer = `
    <button class="btn btn-outline-secondary" id="printReceiptBtn"><i class="bi bi-printer me-1"></i>Print</button>
    <button class="btn btn-primary" id="newSaleBtn"><i class="bi bi-bag-check me-1"></i>New Sale</button>`;

  const modal = formModal('Sale Completed', successHtml, footer);
  document.getElementById('printReceiptBtn').addEventListener('click', () => printReceipt(sale, change));
  document.getElementById('newSaleBtn').addEventListener('click', () => { modal.hide(); navigateTo('pos'); });
}

function printReceipt(sale, change) {
  const html = `<html><head><title>Receipt ${sale.invoice_no}</title><style>
    body{font-family:monospace;font-size:12px;max-width:300px;margin:0 auto;padding:20px;}
    h3{text-align:center;margin:5px 0;} .center{text-align:center;} .line{border-top:1px dashed #000;margin:8px 0;}
    table{width:100%;} td{padding:2px 0;} .right{text-align:right;} .bold{font-weight:bold;}
  </style></head><body>
    <h3>${SETTINGS.business.name}</h3>
    <div class="center">${SETTINGS.business.address}</div>
    <div class="center">${SETTINGS.business.phone}</div>
    <div class="line"></div>
    <div>Invoice: ${sale.invoice_no}</div>
    <div>Date: ${fmtDateTime(sale.sale_date)}</div>
    <div>Customer: ${sale.customer?.name || 'Walk-in Customer'}</div>
    <div class="line"></div>
    <table>
      ${sale.items.map(i => `<tr><td>${i.quantity}x ${i.name}</td><td class="right">${fmtMoney(i.line_total)}</td></tr>`).join('')}
    </table>
    <div class="line"></div>
    <table>
      <tr><td>Subtotal</td><td class="right">${fmtMoney(sale.subtotal)}</td></tr>
      <tr><td>Discount</td><td class="right">-${fmtMoney(sale.discount)}</td></tr>
      <tr><td>Tax</td><td class="right">${fmtMoney(sale.tax_total)}</td></tr>
      <tr class="bold"><td>TOTAL</td><td class="right">${fmtMoney(sale.grand_total)}</td></tr>
      ${change > 0 ? `<tr><td>Change</td><td class="right">${fmtMoney(change)}</td></tr>` : ''}
    </table>
    <div class="line"></div>
    <div class="center">${SETTINGS.receipt.footer}</div>
  </body></html>`;
  printHTML(html);
}
