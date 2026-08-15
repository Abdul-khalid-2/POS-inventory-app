<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CustomerController as CustomerApiController;
use App\Http\Controllers\Api\NotificationController as NotificationApiController;
use App\Http\Controllers\Api\ProductController as ProductApiController;
use App\Http\Controllers\Api\SaleController as SaleApiController;
use App\Http\Controllers\Api\StockAdjustmentController;
use App\Http\Controllers\Api\TaxController;
use App\Http\Controllers\Api\UnitController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PeopleController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductLabelController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\SettingController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| NovaPOS Web Routes
|--------------------------------------------------------------------------
|
| Every screen below returns the same Blade shell
| (resources/views/app.blade.php) with a different "initial view" key.
| The shell's own JS then renders the requested screen client-side.
| This gives every screen its own real, bookmarkable URL, protected by
| real Laravel session auth (see app/Http/Controllers/Auth).
|
| TODO (next pass): replace the mock-data JS with real Eloquent-backed
| data, and layer role-based access on top of this auth (Phase 2's
| remaining checklist items).
|
*/

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
});

Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth')->name('logout');

Route::middleware('auth')->group(function () {
    Route::get('/', DashboardController::class . '@index')->name('dashboard')->middleware('module:dashboard');

    Route::get('/pos', PosController::class . '@index')->name('pos')->middleware('module:pos');

    Route::get('/products', ProductController::class . '@index')->name('products')->middleware('module:products');
    // Print-ready barcode labels — a real server-rendered page, not
    // part of the products.js SPA screen. GET /products/labels?ids=1,2,3
    Route::get('/products/labels', [ProductLabelController::class, 'show'])->name('products.labels');
    Route::get('/inventory', InventoryController::class . '@index')->name('inventory')->middleware('module:inventory');

    Route::get('/sales', SaleController::class . '@index')->name('sales')->middleware('module:sales');
    // Orders isn't in the role_permissions matrix (see RoleSeeder) —
    // it's slated for removal in Phase 13, so it's left open to any
    // authenticated user rather than inventing permissions for a
    // screen that's going away.
    Route::get('/orders', OrderController::class . '@index')->name('orders');

    Route::get('/purchases', PurchaseController::class . '@index')->name('purchases')->middleware('module:purchases');

    // Customers, Suppliers, Staff & Roles all live under one screen with
    // in-page tabs (see public/assets/js/views/people.js).
    Route::get('/people', PeopleController::class . '@index')->name('people')->middleware('module:people');

    Route::get('/accounts', AccountController::class . '@index')->name('accounts')->middleware('module:accounts');
    Route::get('/reports', ReportController::class . '@index')->name('reports')->middleware('module:reports');

    Route::get('/settings', SettingController::class . '@index')->name('settings')->middleware('module:settings');
    // Notifications also has no matrix entry — every authenticated
    // user gets their own notifications regardless of role.
    Route::get('/notifications', NotificationController::class . '@index')->name('notifications');

    // JSON CRUD endpoints backing the Products screen (and, later,
    // other screens as they're wired up — see README Phase 3+).
    // Each controller gates its own actions per-ability via
    // HasMiddleware, so no extra middleware is applied here.
    Route::prefix('catalog')->name('catalog.')->group(function () {
        // Must come before apiResource('products', ...) — otherwise
        // GET /catalog/products/{product} would swallow these as if
        // "generate-sku"/"generate-barcode" were a product ID.
        Route::get('products/generate-sku', [ProductApiController::class, 'generateSku'])->name('products.generate-sku');
        Route::get('products/generate-barcode', [ProductApiController::class, 'generateBarcode'])->name('products.generate-barcode');

        Route::apiResource('products', ProductApiController::class);
        Route::post('products/{product}/image', [ProductApiController::class, 'uploadImage'])->name('products.image.upload');
        Route::delete('products/{product}/image', [ProductApiController::class, 'deleteImage'])->name('products.image.delete');
        Route::apiResource('categories', CategoryController::class);
        Route::apiResource('brands', BrandController::class);
        Route::apiResource('units', UnitController::class);
        // Read-only — the product form needs real tax IDs to submit;
        // full tax management is a Settings-screen feature, not built yet.
        Route::get('taxes', [TaxController::class, 'index'])->name('taxes.index')->middleware('module:settings');

        // The stock adjustment audit log — see StockAdjustmentController
        // for why this is scoped to manual adjustments only, not every
        // stock_movements row.
        Route::get('stock-adjustments', [StockAdjustmentController::class, 'index'])->name('stock-adjustments.index');
        Route::post('stock-adjustments', [StockAdjustmentController::class, 'store'])->name('stock-adjustments.store');

        // Shared, shop-wide notification feed — see NotificationController.
        Route::get('notifications', [NotificationApiController::class, 'index'])->name('notifications.index');
        Route::post('notifications/read-all', [NotificationApiController::class, 'markAllRead'])->name('notifications.read-all');
        Route::post('notifications/{notification}/read', [NotificationApiController::class, 'markRead'])->name('notifications.read');

        // Read-only — the POS terminal's customer picker needs real
        // customer IDs; full customer management is Phase 8.
        Route::get('customers', [CustomerApiController::class, 'index'])->name('customers.index')->middleware('module:people');

        // The POS checkout endpoint itself — see SaleController for
        // why it only accepts product_id + quantity, never a price.
        Route::post('sales', [SaleApiController::class, 'store'])->name('sales.store');
    });
});
