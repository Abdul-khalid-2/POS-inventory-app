<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ProductController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('module:products', only: ['index', 'show']),
            new Middleware('module:products,add', only: ['store']),
            new Middleware('module:products,edit', only: ['update']),
            new Middleware('module:products,delete', only: ['destroy']),
        ];
    }

    /**
     * GET /catalog/products
     * Supports: q (search name/sku/barcode), category_id, brand_id,
     * status, low_stock=1, per_page (default 20).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::query()->with(['category', 'brand', 'unit', 'tax']);

        if ($search = $request->string('q')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }

        if ($request->filled('brand_id')) {
            $query->where('brand_id', $request->integer('brand_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->boolean('low_stock')) {
            $query->whereColumn('current_stock', '<=', 'reorder_level');
        }

        $products = $query->orderBy('name')->paginate($request->integer('per_page', 20));

        return ProductResource::collection($products)->response();
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);

        $product = Product::create($data);

        return (new ProductResource($product->load(['category', 'brand', 'unit', 'tax'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Product $product): JsonResponse
    {
        return (new ProductResource($product->load(['category', 'brand', 'unit', 'tax'])))->response();
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $data = $this->validated($request, $product);

        $product->update($data);

        return (new ProductResource($product->load(['category', 'brand', 'unit', 'tax'])))->response();
    }

    public function destroy(Product $product): JsonResponse
    {
        try {
            $product->delete();
        } catch (\Illuminate\Database\QueryException) {
            return response()->json([
                'message' => 'This product has sales, purchase, or stock history and can\'t be deleted. Set it to inactive instead.',
            ], 422);
        }

        return response()->json(null, 204);
    }

    /**
     * Shared validation for store/update. current_stock is only
     * settable on create (opening stock) — once a product exists,
     * stock changes must go through stock_movements (Phase 4), not a
     * direct product edit, so the field is dropped on update.
     */
    private function validated(Request $request, ?Product $product = null): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'sku' => ['required', 'string', 'max:50', Rule::unique('products', 'sku')->ignore($product)],
            'barcode' => ['nullable', 'string', 'max:50', Rule::unique('products', 'barcode')->ignore($product)],
            'category_id' => ['required', 'exists:categories,id'],
            'brand_id' => ['nullable', 'exists:brands,id'],
            'unit_id' => ['required', 'exists:units,id'],
            'tax_id' => ['nullable', 'exists:taxes,id'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'sale_price' => ['required', 'numeric', 'min:0'],
            'reorder_level' => ['nullable', 'integer', 'min:0'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];

        if (! $product) {
            $rules['current_stock'] = ['nullable', 'integer', 'min:0'];
        }

        $data = $request->validate($rules);

        if (! $product) {
            $data['current_stock'] = $data['current_stock'] ?? 0;
        }

        return $data;
    }
}
