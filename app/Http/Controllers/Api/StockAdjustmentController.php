<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\StockMovementResource;
use App\Models\Product;
use App\Models\StockMovement;
use App\Services\StockNotifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class StockAdjustmentController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('module:inventory', only: ['index']),
            new Middleware('module:inventory,edit', only: ['store']),
        ];
    }

    /**
     * GET /catalog/stock-adjustments
     * The audit log — every manual stock adjustment ever made. Powers
     * both the flat "Adjustments" tab and (via product_id) the
     * per-product "Stock History" view. Deliberately scoped to
     * adjustment_in/adjustment_out only — purchases and sales already
     * have their own history (Purchases/Sales screens), so mixing
     * every movement type into one feed would blur what this log is
     * actually for: a record of manual corrections.
     */
    public function index(Request $request): JsonResponse
    {
        $query = StockMovement::query()
            ->whereIn('type', ['adjustment_in', 'adjustment_out'])
            ->with(['product.unit', 'user'])
            ->latest('created_at');

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->integer('product_id'));
        }

        $movements = $query->paginate($request->integer('per_page', 20));

        return StockMovementResource::collection($movements)->response();
    }

    /**
     * POST /catalog/stock-adjustments
     * Creates the movement AND updates the product's cached
     * current_stock in one transaction, with a row lock so two
     * simultaneous adjustments on the same product can't race each
     * other into an inconsistent balance.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'type' => ['required', Rule::in(['increase', 'decrease'])],
            'quantity' => ['required', 'integer', 'min:1'],
            'reason' => ['required', Rule::in(['Damaged', 'Returned', 'Correction', 'Lost', 'Found', 'Other'])],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        [$movement, $previousStock, $newBalance] = DB::transaction(function () use ($data, $request) {
            $product = Product::whereKey($data['product_id'])->lockForUpdate()->firstOrFail();
            $previousStock = $product->current_stock;

            $delta = $data['type'] === 'increase' ? $data['quantity'] : -$data['quantity'];
            $newBalance = $previousStock + $delta;

            if ($newBalance < 0) {
                throw ValidationException::withMessages([
                    'quantity' => "Can't decrease by {$data['quantity']} — only {$product->current_stock} in stock.",
                ]);
            }

            $product->update(['current_stock' => $newBalance]);

            $movement = StockMovement::create([
                'product_id' => $product->id,
                'type' => $data['type'] === 'increase' ? 'adjustment_in' : 'adjustment_out',
                'quantity' => $data['quantity'],
                'balance_after' => $newBalance,
                'reason' => $data['reason'],
                'notes' => $data['notes'] ?? null,
                'user_id' => $request->user()->id,
            ]);

            return [$movement, $previousStock, $newBalance];
        });

        // Fired after the transaction commits, not inside it — a
        // notification is a side effect, not part of the data
        // integrity the transaction is protecting.
        StockNotifier::checkThresholds(
            Product::with('unit')->find($data['product_id']),
            $previousStock,
            $newBalance,
        );

        return (new StockMovementResource($movement->load(['product.unit', 'user'])))
            ->response()
            ->setStatusCode(201);
    }
}
