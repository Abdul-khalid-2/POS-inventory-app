<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\View\View;

class ProductLabelController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('module:products'),
        ];
    }

    /**
     * GET /products/labels?ids=1,2,3 (also accepts a single id=5)
     * A print-ready page, independent of the products.js SPA screen —
     * opens in its own tab/window, ready for Ctrl+P.
     */
    public function show(Request $request): View
    {
        $ids = collect(explode(',', (string) $request->query('ids', $request->query('id', ''))))
            ->map(fn ($id) => (int) trim($id))
            ->filter()
            ->unique();

        $products = Product::with('unit')->whereIn('id', $ids)->orderBy('name')->get();

        return view('products.labels', ['products' => $products]);
    }
}
