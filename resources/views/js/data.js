/* ===========================
   NovaPOS — Mock Data
   =========================== */

const CURRENCY = '$';

const CATEGORIES = [
  { id: 'cat1', name: 'Beverages', icon: 'bi-cup-straw', color: 'primary' },
  { id: 'cat2', name: 'Snacks', icon: 'bi-cookie', color: 'warning' },
  { id: 'cat3', name: 'Dairy', icon: 'bi-egg-fried', color: 'info' },
  { id: 'cat4', name: 'Bakery', icon: 'bi-bread-slice', color: 'secondary' },
  { id: 'cat5', name: 'Household', icon: 'bi-house', color: 'success' },
  { id: 'cat6', name: 'Personal Care', icon: 'bi-droplet', color: 'danger' },
  { id: 'cat7', name: 'Produce', icon: 'bi-basket', color: 'success' },
  { id: 'cat8', name: 'Frozen', icon: 'bi-snow', color: 'info' },
];

const BRANDS = [
  { id: 'br1', name: 'Coca-Cola' },
  { id: 'br2', name: 'PepsiCo' },
  { id: 'br3', name: 'Nestlé' },
  { id: 'br4', name: 'Unilever' },
  { id: 'br5', name: 'Kelloggs' },
  { id: 'br6', name: 'Local Farms' },
  { id: 'br7', name: 'Nabati' },
  { id: 'br8', name: 'Heinz' },
];

const UNITS = ['pcs', 'kg', 'g', 'box', 'pack', 'dozen', 'liter', 'ml'];

const PRODUCTS = [
  { id: 'p001', name: 'Coca-Cola 500ml', sku: 'BEV-001', barcode: '5449000000996', category: 'cat1', brand: 'br1', cost: 0.45, price: 0.80, stock: 240, reorder: 50, unit: 'pcs', tax: 5, status: 'active', image: '🥤' },
  { id: 'p002', name: 'Pepsi 330ml Can', sku: 'BEV-002', barcode: '3120000012345', category: 'cat1', brand: 'br2', cost: 0.40, price: 0.75, stock: 12, reorder: 50, unit: 'pcs', tax: 5, status: 'active', image: '🥫' },
  { id: 'p003', name: 'Nestlé Pure Water 1L', sku: 'BEV-003', barcode: '7613034626844', category: 'cat1', brand: 'br3', cost: 0.20, price: 0.50, stock: 500, reorder: 100, unit: 'pcs', tax: 0, status: 'active', image: '💧' },
  { id: 'p004', name: 'Orange Juice 1L', sku: 'BEV-004', barcode: '8056000900011', category: 'cat1', brand: 'br3', cost: 1.20, price: 2.20, stock: 60, reorder: 30, unit: 'pcs', tax: 5, status: 'active', image: '🧃' },
  { id: 'p005', name: 'Lay\'s Classic 150g', sku: 'SNK-001', barcode: '6041000123456', category: 'cat2', brand: 'br2', cost: 0.80, price: 1.50, stock: 80, reorder: 40, unit: 'pcs', tax: 5, status: 'active', image: '🥔' },
  { id: 'p006', name: 'Oreo Cookies 137g', sku: 'SNK-002', barcode: '0440000012345', category: 'cat2', brand: 'br5', cost: 0.90, price: 1.80, stock: 0, reorder: 30, unit: 'pack', tax: 5, status: 'active', image: '🍪' },
  { id: 'p007', name: 'Chocolate Bar 100g', sku: 'SNK-003', barcode: '7622210449283', category: 'cat2', brand: 'br3', cost: 0.50, price: 1.20, stock: 120, reorder: 40, unit: 'pcs', tax: 5, status: 'active', image: '🍫' },
  { id: 'p008', name: 'Mixed Nuts 200g', sku: 'SNK-004', barcode: '5012345678900', category: 'cat2', brand: 'br7', cost: 1.50, price: 3.00, stock: 45, reorder: 20, unit: 'pack', tax: 5, status: 'active', image: '🥜' },
  { id: 'p009', name: 'Fresh Milk 1L', sku: 'DRY-001', barcode: '5449000000123', category: 'cat3', brand: 'br3', cost: 0.80, price: 1.50, stock: 8, reorder: 30, unit: 'pcs', tax: 0, status: 'active', image: '🥛' },
  { id: 'p010', name: 'Cheddar Cheese 250g', sku: 'DRY-002', barcode: '20605839', category: 'cat3', brand: 'br3', cost: 2.00, price: 3.80, stock: 35, reorder: 15, unit: 'pcs', tax: 5, status: 'active', image: '🧀' },
  { id: 'p011', name: 'Greek Yogurt 500g', sku: 'DRY-003', barcode: '8076809513456', category: 'cat3', brand: 'br3', cost: 1.10, price: 2.20, stock: 50, reorder: 20, unit: 'pcs', tax: 0, status: 'active', image: '🍶' },
  { id: 'p012', name: 'Butter 200g', sku: 'DRY-004', barcode: '7012345678901', category: 'cat3', brand: 'br3', cost: 1.30, price: 2.50, stock: 28, reorder: 15, unit: 'pcs', tax: 5, status: 'active', image: '🧈' },
  { id: 'p013', name: 'White Bread Loaf', sku: 'BKY-001', barcode: '2012345678901', category: 'cat4', brand: 'br6', cost: 0.60, price: 1.20, stock: 40, reorder: 20, unit: 'pcs', tax: 0, status: 'active', image: '🍞' },
  { id: 'p014', name: 'Croissant', sku: 'BKY-002', barcode: '2023456789012', category: 'cat4', brand: 'br6', cost: 0.45, price: 0.90, stock: 25, reorder: 15, unit: 'pcs', tax: 5, status: 'active', image: '🥐' },
  { id: 'p015', name: 'Chocolate Donut', sku: 'BKY-003', barcode: '2034567890123', category: 'cat4', brand: 'br6', cost: 0.35, price: 0.80, stock: 18, reorder: 10, unit: 'pcs', tax: 5, status: 'active', image: '🍩' },
  { id: 'p016', name: 'Dish Soap 500ml', sku: 'HSH-001', barcode: '3012345678901', category: 'cat5', brand: 'br4', cost: 1.20, price: 2.50, stock: 55, reorder: 20, unit: 'pcs', tax: 5, status: 'active', image: '🧴' },
  { id: 'p017', name: 'Paper Towels 2-pack', sku: 'HSH-002', barcode: '3012345678902', category: 'cat5', brand: 'br4', cost: 1.50, price: 3.00, stock: 30, reorder: 15, unit: 'pack', tax: 5, status: 'active', image: '🧻' },
  { id: 'p018', name: 'Trash Bags 30ct', sku: 'HSH-003', barcode: '3012345678903', category: 'cat5', brand: 'br4', cost: 2.00, price: 4.00, stock: 22, reorder: 10, unit: 'box', tax: 5, status: 'active', image: '🗑️' },
  { id: 'p019', name: 'Shampoo 400ml', sku: 'PCR-001', barcode: '4012345678901', category: 'cat6', brand: 'br4', cost: 2.50, price: 5.00, stock: 40, reorder: 15, unit: 'pcs', tax: 5, status: 'active', image: '🧴' },
  { id: 'p020', name: 'Toothpaste 100ml', sku: 'PCR-002', barcode: '4012345678902', category: 'cat6', brand: 'br4', cost: 1.00, price: 2.20, stock: 60, reorder: 20, unit: 'pcs', tax: 5, status: 'active', image: '🪥' },
  { id: 'p021', name: 'Hand Soap 300ml', sku: 'PCR-003', barcode: '4012345678903', category: 'cat6', brand: 'br4', cost: 0.80, price: 1.80, stock: 35, reorder: 15, unit: 'pcs', tax: 5, status: 'active', image: '🧼' },
  { id: 'p022', name: 'Banana 1kg', sku: 'PRD-001', barcode: '5012345678901', category: 'cat7', brand: 'br6', cost: 0.50, price: 1.00, stock: 100, reorder: 30, unit: 'kg', tax: 0, status: 'active', image: '🍌' },
  { id: 'p023', name: 'Apple 1kg', sku: 'PRD-002', barcode: '5012345678902', category: 'cat7', brand: 'br6', cost: 0.80, price: 1.50, stock: 70, reorder: 25, unit: 'kg', tax: 0, status: 'active', image: '🍎' },
  { id: 'p024', name: 'Tomato 1kg', sku: 'PRD-003', barcode: '5012345678903', category: 'cat7', brand: 'br6', cost: 0.60, price: 1.20, stock: 15, reorder: 30, unit: 'kg', tax: 0, status: 'active', image: '🍅' },
  { id: 'p025', name: 'Frozen Pizza 400g', sku: 'FRZ-001', barcode: '6012345678901', category: 'cat8', brand: 'br3', cost: 1.80, price: 3.50, stock: 32, reorder: 15, unit: 'pcs', tax: 5, status: 'active', image: '🍕' },
  { id: 'p026', name: 'Ice Cream 1L', sku: 'FRZ-002', barcode: '6012345678902', category: 'cat8', brand: 'br3', cost: 2.00, price: 4.00, stock: 18, reorder: 10, unit: 'pcs', tax: 5, status: 'active', image: '🍦' },
  { id: 'p027', name: 'Frozen Fries 1kg', sku: 'FRZ-003', barcode: '6012345678903', category: 'cat8', brand: 'br2', cost: 1.20, price: 2.50, stock: 42, reorder: 15, unit: 'pack', tax: 5, status: 'active', image: '🍟' },
  { id: 'p028', name: 'Heinz Ketchup 400g', sku: 'HSH-004', barcode: '3012345678904', category: 'cat5', brand: 'br8', cost: 1.10, price: 2.30, stock: 38, reorder: 15, unit: 'pcs', tax: 5, status: 'active', image: '🍅' },
  { id: 'p029', name: 'Green Tea 25 bags', sku: 'BEV-005', barcode: '5449000000456', category: 'cat1', brand: 'br3', cost: 1.50, price: 3.00, stock: 5, reorder: 20, unit: 'box', tax: 5, status: 'active', image: '🍵' },
  { id: 'p030', name: 'Instant Coffee 200g', sku: 'BEV-006', barcode: '5449000000789', category: 'cat1', brand: 'br3', cost: 2.50, price: 5.00, stock: 28, reorder: 15, unit: 'pcs', tax: 5, status: 'inactive', image: '☕' },
];

const CUSTOMERS = [
  { id: 'c001', name: 'Walk-in Customer', phone: '—', email: '—', address: '', totalPurchases: 0, due: 0, loyaltyPoints: 0, type: 'walk-in' },
  { id: 'c002', name: 'Ali Hassan', phone: '+1-555-0101', email: 'ali.hassan@email.com', address: '123 Main St, Springfield', totalPurchases: 3420.50, due: 120.00, loyaltyPoints: 342, type: 'regular' },
  { id: 'c003', name: 'Sarah Johnson', phone: '+1-555-0102', email: 'sarah.j@email.com', address: '45 Oak Ave, Riverdale', totalPurchases: 2150.00, due: 0, loyaltyPoints: 215, type: 'regular' },
  { id: 'c004', name: 'Mohammed Khan', phone: '+1-555-0103', email: 'm.khan@email.com', address: '78 Elm St, Kingston', totalPurchases: 5680.75, due: 340.00, loyaltyPoints: 568, type: 'vip' },
  { id: 'c005', name: 'Emily Davis', phone: '+1-555-0104', email: 'emily.d@email.com', address: '90 Pine Rd, Westfield', totalPurchases: 890.25, due: 0, loyaltyPoints: 89, type: 'regular' },
  { id: 'c006', name: 'David Wilson', phone: '+1-555-0105', email: 'd.wilson@email.com', address: '12 Maple Ln, Eastwood', totalPurchases: 4120.00, due: 75.50, loyaltyPoints: 412, type: 'vip' },
  { id: 'c007', name: 'Fatima Noor', phone: '+1-555-0106', email: 'fatima.n@email.com', address: '34 Cedar St, Lakeside', totalPurchases: 1890.00, due: 0, loyaltyPoints: 189, type: 'regular' },
  { id: 'c008', name: 'James Brown', phone: '+1-555-0107', email: 'j.brown@email.com', address: '56 Birch Dr, Hillcrest', totalPurchases: 2670.80, due: 200.00, loyaltyPoints: 267, type: 'regular' },
  { id: 'c009', name: 'Aisha Malik', phone: '+1-555-0108', email: 'aisha.m@email.com', address: '67 Willow Way, Brookfield', totalPurchases: 3450.00, due: 0, loyaltyPoints: 345, type: 'vip' },
  { id: 'c010', name: 'Robert Taylor', phone: '+1-555-0109', email: 'r.taylor@email.com', address: '89 Spruce St, Meadowbrook', totalPurchases: 670.00, due: 45.00, loyaltyPoints: 67, type: 'regular' },
];

const SUPPLIERS = [
  { id: 's001', name: 'Global Beverages Co.', contact: 'John Smith', phone: '+1-555-0201', email: 'orders@globalbev.com', address: '100 Industry Pkwy', totalPurchases: 12500.00, payable: 1850.00 },
  { id: 's002', name: 'Fresh Farms Distributors', contact: 'Lisa Chen', phone: '+1-555-0202', email: 'sales@freshfarms.com', address: '200 Harvest Rd', totalPurchases: 8200.00, payable: 0 },
  { id: 's003', name: 'Nestlé Wholesale', contact: 'Mike Ross', phone: '+1-555-0203', email: 'wholesale@nestle.com', address: '300 Corp Blvd', totalPurchases: 15800.00, payable: 3200.00 },
  { id: 's004', name: 'Unilever Supply Chain', contact: 'Anna White', phone: '+1-555-0204', email: 'supply@unilever.com', address: '400 Logistics Ave', totalPurchases: 6700.00, payable: 950.00 },
  { id: 's005', name: 'Local Bakery Suppliers', contact: 'Tom Baker', phone: '+1-555-0205', email: 'info@localbakery.com', address: '500 Baker St', totalPurchases: 3400.00, payable: 0 },
  { id: 's006', name: 'Heinz Food Service', contact: 'Rachel Green', phone: '+1-555-0206', email: 'foodservice@heinz.com', address: '600 Heinz Way', totalPurchases: 4200.00, payable: 480.00 },
];

const USERS = [
  { id: 'u001', name: 'Admin User', email: 'admin@novapos.com', phone: '+1-555-0301', role: 'Admin', status: 'active', avatar: 'A', permissions: { all: true } },
  { id: 'u002', name: 'Jane Cashier', email: 'cashier@novapos.com', phone: '+1-555-0302', role: 'Cashier', status: 'active', avatar: 'J', permissions: { pos: true, products: 'view', sales: true } },
  { id: 'u003', name: 'Mark Accountant', email: 'accountant@novapos.com', phone: '+1-555-0303', role: 'Accountant', status: 'active', avatar: 'M', permissions: { accounts: true, reports: true, purchases: 'view' } },
  { id: 'u004', name: 'Lisa Manager', email: 'manager@novapos.com', phone: '+1-555-0304', role: 'Manager', status: 'active', avatar: 'L', permissions: { all: true } },
  { id: 'u005', name: 'Tom Cashier', email: 'tom@novapos.com', phone: '+1-555-0305', role: 'Cashier', status: 'inactive', avatar: 'T', permissions: { pos: true, sales: true } },
];

const ROLES = [
  { id: 'r1', name: 'Admin', description: 'Full access to all modules' },
  { id: 'r2', name: 'Cashier', description: 'POS terminal and sales' },
  { id: 'r3', name: 'Accountant', description: 'Finance and reports' },
  { id: 'r4', name: 'Manager', description: 'Management and oversight' },
];

const ROLE_PERMISSIONS = {
  'Admin': { dashboard: ['view','add','edit','delete'], pos: ['view','add','edit','delete'], products: ['view','add','edit','delete'], inventory: ['view','add','edit','delete'], sales: ['view','add','edit','delete'], purchases: ['view','add','edit','delete'], people: ['view','add','edit','delete'], orders: ['view','add','edit','delete'], accounts: ['view','add','edit','delete'], reports: ['view'], settings: ['view','add','edit','delete'] },
  'Cashier': { dashboard: ['view'], pos: ['view','add','edit'], products: ['view'], inventory: [], sales: ['view','add'], purchases: [], people: ['view'], orders: ['view'], accounts: [], reports: [], settings: [] },
  'Accountant': { dashboard: ['view'], pos: [], products: ['view'], inventory: ['view'], sales: ['view'], purchases: ['view','add','edit'], people: ['view'], orders: ['view'], accounts: ['view','add','edit','delete'], reports: ['view'], settings: ['view'] },
  'Manager': { dashboard: ['view'], pos: ['view','add','edit','delete'], products: ['view','add','edit','delete'], inventory: ['view','add','edit','delete'], sales: ['view','add','edit','delete'], purchases: ['view','add','edit','delete'], people: ['view','add','edit','delete'], orders: ['view','add','edit','delete'], accounts: ['view','add','edit'], reports: ['view'], settings: ['view','add','edit'] },
};

function generateSales() {
  const sales = [];
  const statuses = ['completed', 'completed', 'completed', 'completed', 'pending', 'refunded'];
  const paymentMethods = ['cash', 'card', 'wallet', 'credit'];
  const salespeople = ['Jane Cashier', 'Tom Cashier', 'Lisa Manager'];
  let invNum = 1000;
  for (let i = 0; i < 48; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(); date.setDate(date.getDate() - daysAgo);
    date.setHours(8 + Math.floor(Math.random()*12), Math.floor(Math.random()*60));
    const itemCount = 1 + Math.floor(Math.random() * 8);
    const items = [];
    let subtotal = 0;
    for (let j = 0; j < itemCount; j++) {
      const p = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
      const qty = 1 + Math.floor(Math.random() * 4);
      const lineTotal = +(p.price * qty).toFixed(2);
      items.push({ productId: p.id, name: p.name, price: p.price, qty, total: lineTotal });
      subtotal += lineTotal;
    }
    const tax = +(subtotal * 0.05).toFixed(2);
    const discount = Math.random() > 0.8 ? +(subtotal * 0.05).toFixed(2) : 0;
    const total = +(subtotal + tax - discount).toFixed(2);
    const method = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const paid = status === 'pending' && method === 'credit' ? 0 : (method === 'credit' ? +(total * 0.5).toFixed(2) : total);
    const due = +(total - paid).toFixed(2);
    const customer = CUSTOMERS[1 + Math.floor(Math.random() * (CUSTOMERS.length - 1))];
    sales.push({
      id: 'sale-' + (invNum + i),
      invoice: 'INV-' + (invNum + i),
      date: date.toISOString(),
      customerId: customer.id, customerName: customer.name,
      items, itemCount, subtotal: +subtotal.toFixed(2), tax, discount, total,
      paid, due, method, status,
      salesperson: salespeople[Math.floor(Math.random() * salespeople.length)],
    });
  }
  return sales.sort((a,b) => new Date(b.date) - new Date(a.date));
}

const SALES = generateSales();

function generatePurchases() {
  const purchases = [];
  const statuses = ['draft', 'ordered', 'received', 'partially_received'];
  const payStatuses = ['unpaid', 'partial', 'paid'];
  let poNum = 500;
  for (let i = 0; i < 18; i++) {
    const daysAgo = Math.floor(Math.random() * 45);
    const date = new Date(); date.setDate(date.getDate() - daysAgo);
    const supplier = SUPPLIERS[Math.floor(Math.random() * SUPPLIERS.length)];
    const itemCount = 2 + Math.floor(Math.random() * 5);
    const items = [];
    let total = 0;
    for (let j = 0; j < itemCount; j++) {
      const p = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
      const qty = 20 + Math.floor(Math.random() * 100);
      const cost = p.cost;
      const lineTotal = +(cost * qty).toFixed(2);
      items.push({ productId: p.id, name: p.name, cost, qty, received: Math.random() > 0.3 ? qty : Math.floor(qty * 0.5), total: lineTotal });
      total += lineTotal;
    }
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const payStatus = payStatuses[Math.floor(Math.random() * payStatuses.length)];
    purchases.push({
      id: 'po-' + (poNum + i),
      poNumber: 'PO-' + (poNum + i),
      date: date.toISOString(),
      supplierId: supplier.id, supplierName: supplier.name,
      items, total: +total.toFixed(2),
      status, payStatus,
      expectedDate: new Date(date.getTime() + 7*24*60*60*1000).toISOString(),
    });
  }
  return purchases.sort((a,b) => new Date(b.date) - new Date(a.date));
}

const PURCHASES = generatePurchases();

const EXPENSES = [
  { id: 'e001', date: '2024-08-01', category: 'Rent', amount: 1500, method: 'bank', notes: 'Monthly shop rent' },
  { id: 'e002', date: '2024-08-02', category: 'Utilities', amount: 320, method: 'bank', notes: 'Electricity bill' },
  { id: 'e003', date: '2024-08-03', category: 'Salaries', amount: 2800, method: 'bank', notes: 'Staff salaries' },
  { id: 'e004', date: '2024-08-05', category: 'Supplies', amount: 145, method: 'cash', notes: 'Cleaning supplies' },
  { id: 'e005', date: '2024-08-07', category: 'Marketing', amount: 200, method: 'card', notes: 'Social media ads' },
  { id: 'e006', date: '2024-08-08', category: 'Utilities', amount: 85, method: 'cash', notes: 'Water bill' },
  { id: 'e007', date: '2024-08-10', category: 'Maintenance', amount: 175, method: 'cash', notes: 'AC repair' },
  { id: 'e008', date: '2024-08-12', category: 'Transport', amount: 60, method: 'cash', notes: 'Delivery fuel' },
];

const EXPENSE_CATEGORIES = ['Rent', 'Utilities', 'Salaries', 'Supplies', 'Marketing', 'Maintenance', 'Transport', 'Miscellaneous'];

const ORDERS = [
  { id: 'o001', number: 'ORD-2001', customer: 'Ali Hassan', date: '2024-08-12', items: 5, total: 42.50, status: 'pending', type: 'delivery' },
  { id: 'o002', number: 'ORD-2002', customer: 'Sarah Johnson', date: '2024-08-12', items: 3, total: 18.75, status: 'processing', type: 'pickup' },
  { id: 'o003', number: 'ORD-2003', customer: 'Mohammed Khan', date: '2024-08-11', items: 8, total: 65.20, status: 'ready', type: 'delivery' },
  { id: 'o004', number: 'ORD-2004', customer: 'Emily Davis', date: '2024-08-11', items: 2, total: 12.40, status: 'completed', type: 'pickup' },
  { id: 'o005', number: 'ORD-2005', customer: 'David Wilson', date: '2024-08-10', items: 6, total: 38.90, status: 'completed', type: 'delivery' },
  { id: 'o006', number: 'ORD-2006', customer: 'Fatima Noor', date: '2024-08-10', items: 4, total: 24.50, status: 'pending', type: 'pickup' },
  { id: 'o007', number: 'ORD-2007', customer: 'James Brown', date: '2024-08-09', items: 7, total: 52.30, status: 'processing', type: 'delivery' },
  { id: 'o008', number: 'ORD-2008', customer: 'Aisha Malik', date: '2024-08-09', items: 3, total: 19.80, status: 'ready', type: 'pickup' },
  { id: 'o009', number: 'ORD-2009', customer: 'Robert Taylor', date: '2024-08-08', items: 5, total: 31.20, status: 'completed', type: 'delivery' },
  { id: 'o010', number: 'ORD-2010', customer: 'Ali Hassan', date: '2024-08-08', items: 2, total: 8.50, status: 'cancelled', type: 'pickup' },
];

const NOTIFICATIONS = [
  { id: 'n001', type: 'stock', icon: 'bi-exclamation-triangle', color: 'warning', title: 'Low Stock Alert', message: 'Pepsi 330ml Can is running low (12 pcs left)', time: '5 min ago', read: false },
  { id: 'n002', type: 'stock', icon: 'bi-x-circle', color: 'danger', title: 'Out of Stock', message: 'Oreo Cookies 137g is out of stock', time: '1 hour ago', read: false },
  { id: 'n003', type: 'order', icon: 'bi-bag', color: 'primary', title: 'New Order', message: 'Order ORD-2001 received from Ali Hassan', time: '2 hours ago', read: false },
  { id: 'n004', type: 'payment', icon: 'bi-credit-card', color: 'success', title: 'Payment Received', message: 'Payment of $340 received from Mohammed Khan', time: '3 hours ago', read: true },
  { id: 'n005', type: 'shift', icon: 'bi-clock', color: 'info', title: 'Shift Reminder', message: 'Current shift has been open for 6 hours', time: '4 hours ago', read: true },
  { id: 'n006', type: 'stock', icon: 'bi-exclamation-triangle', color: 'warning', title: 'Low Stock Alert', message: 'Fresh Milk 1L is running low (8 pcs left)', time: '5 hours ago', read: true },
  { id: 'n007', type: 'order', icon: 'bi-bag', color: 'primary', title: 'New Order', message: 'Order ORD-2006 received from Fatima Noor', time: '6 hours ago', read: true },
  { id: 'n008', type: 'payment', icon: 'bi-credit-card', color: 'success', title: 'Payment Received', message: 'Payment of $120 received from Ali Hassan', time: '8 hours ago', read: true },
];

const ACTIVITY_LOG = [
  { user: 'Jane Cashier', action: 'completed sale', detail: 'INV-1047 — $42.50', time: '5 min ago', icon: 'bi-receipt', color: 'success' },
  { user: 'Admin User', action: 'added new product', detail: 'Heinz Ketchup 400g', time: '20 min ago', icon: 'bi-box-seam', color: 'primary' },
  { user: 'Lisa Manager', action: 'updated inventory', detail: 'Stock adjustment for Fresh Milk 1L', time: '45 min ago', icon: 'bi-pencil-square', color: 'info' },
  { user: 'Mark Accountant', action: 'recorded expense', detail: 'AC repair — $175', time: '1 hour ago', icon: 'bi-cash-coin', color: 'warning' },
  { user: 'Jane Cashier', action: 'completed sale', detail: 'INV-1046 — $18.75', time: '2 hours ago', icon: 'bi-receipt', color: 'success' },
  { user: 'Tom Cashier', action: 'held order', detail: 'Held order #3 at register', time: '3 hours ago', icon: 'bi-pause-circle', color: 'secondary' },
  { user: 'Admin User', action: 'added new customer', detail: 'Robert Taylor', time: '5 hours ago', icon: 'bi-person-plus', color: 'primary' },
];

const WAREHOUSES = [
  { id: 'w1', name: 'Main Store' },
  { id: 'w2', name: 'Back Storage' },
  { id: 'w3', name: 'Branch — Eastside' },
];

const STOCK_ADJUSTMENTS = [
  { id: 'adj001', date: '2024-08-10', product: 'Fresh Milk 1L', type: 'decrease', qty: 5, reason: 'damaged', ref: 'ADJ-001', notes: '5 units expired' },
  { id: 'adj002', date: '2024-08-08', product: 'Coca-Cola 500ml', type: 'increase', qty: 24, reason: 'correction', ref: 'ADJ-002', notes: 'Found in back storage' },
  { id: 'adj003', date: '2024-08-05', product: 'Cheddar Cheese 250g', type: 'decrease', qty: 2, reason: 'returned', ref: 'ADJ-003', notes: 'Customer return' },
  { id: 'adj004', date: '2024-08-03', product: 'Banana 1kg', type: 'decrease', qty: 10, reason: 'damaged', ref: 'ADJ-004', notes: 'Overripe, disposed' },
];

const TAX_RATES = [
  { id: 't1', name: 'Standard VAT', rate: 5, type: 'percentage' },
  { id: 't2', name: 'Zero Rate', rate: 0, type: 'percentage' },
  { id: 't3', name: 'Exempt', rate: 0, type: 'exempt' },
];

const PAYMENT_METHODS_CONFIG = [
  { id: 'pm1', name: 'Cash', icon: 'bi-cash-coin', enabled: true },
  { id: 'pm2', name: 'Card', icon: 'bi-credit-card', enabled: true },
  { id: 'pm3', name: 'Mobile Wallet', icon: 'bi-phone', enabled: true },
  { id: 'pm4', name: 'Credit', icon: 'bi-wallet2', enabled: true },
];

const SETTINGS = {
  business: { name: 'NovaPOS Mini Mart', address: '123 Commerce Street, Springfield, IL 62701', phone: '+1-555-1000', email: 'info@novapos.com', currency: 'USD', taxId: 'TAX-2024-001', invoicePrefix: 'INV', invoiceStart: 1000 },
  tax: { defaultRate: 5, inclusive: false },
  receipt: { showLogo: true, showTax: true, footer: 'Thank you for shopping with us!', width: 80 },
  notifications: { lowStockThreshold: 20, emailAlerts: true, newOrderAlert: true, paymentAlert: false },
};

const SHIFT = {
  status: 'open', openedAt: '2024-08-12 08:00', openedBy: 'Jane Cashier', openingCash: 200, expectedCash: 845.50, countedCash: null, variance: null,
};

const SHIFT_HISTORY = [
  { id: 'sh001', date: '2024-08-11', openedBy: 'Jane Cashier', opening: 200, expected: 720.30, counted: 718.00, variance: -2.30, status: 'closed' },
  { id: 'sh002', date: '2024-08-10', openedBy: 'Tom Cashier', opening: 150, expected: 510.00, counted: 510.00, variance: 0, status: 'closed' },
  { id: 'sh003', date: '2024-08-09', openedBy: 'Jane Cashier', opening: 200, expected: 680.50, counted: 685.00, variance: 4.50, status: 'closed' },
];

// Helper to get category name
function catName(id) { return (CATEGORIES.find(c => c.id === id) || {}).name || '—'; }
function catIcon(id) { return (CATEGORIES.find(c => c.id === id) || {}).icon || 'bi-tag'; }
function brandName(id) { return (BRANDS.find(b => b.id === id) || {}).name || '—'; }
function productName(id) { return (PRODUCTS.find(p => p.id === id) || {}).name || 'Unknown'; }
function productById(id) { return PRODUCTS.find(p => p.id === id); }
function customerName(id) { return (CUSTOMERS.find(c => c.id === id) || {}).name || 'Walk-in'; }
function supplierName(id) { return (SUPPLIERS.find(s => s.id === id) || {}).name || '—'; }
