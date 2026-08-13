<?php

use App\Http\Controllers\AccountController;
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
| NovaPOS is currently a client-rendered app: every route below returns
| the same Blade shell (resources/views/app.blade.php) with a different
| "initial view" key. The shell's JS shows a login gate first, then
| renders the requested screen. This gives every screen its own real,
| bookmarkable URL while the frontend logic stays exactly as designed.
|
| TODO (next pass): replace the mock-data JS with real Eloquent-backed
| data, and add auth middleware once a User/session flow is wired up.
|
*/

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
