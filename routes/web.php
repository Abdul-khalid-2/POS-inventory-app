<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PeopleController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\ProductController;
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
    Route::get('/', DashboardController::class . '@index')->name('dashboard');

    Route::get('/pos', PosController::class . '@index')->name('pos');

    Route::get('/products', ProductController::class . '@index')->name('products');
    Route::get('/inventory', InventoryController::class . '@index')->name('inventory');

    Route::get('/sales', SaleController::class . '@index')->name('sales');
    Route::get('/orders', OrderController::class . '@index')->name('orders');

    Route::get('/purchases', PurchaseController::class . '@index')->name('purchases');

    // Customers, Suppliers, Staff & Roles all live under one screen with
    // in-page tabs (see public/assets/js/views/people.js).
    Route::get('/people', PeopleController::class . '@index')->name('people');

    Route::get('/accounts', AccountController::class . '@index')->name('accounts');
    Route::get('/reports', ReportController::class . '@index')->name('reports');

    Route::get('/settings', SettingController::class . '@index')->name('settings');
    Route::get('/notifications', NotificationController::class . '@index')->name('notifications');
});
