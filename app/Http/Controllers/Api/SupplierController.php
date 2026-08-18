<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SupplierResource;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Validation\Rule;

class SupplierController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('module:people', only: ['index', 'show']),
            new Middleware('module:people,add', only: ['store']),
            new Middleware('module:people,edit', only: ['update']),
            new Middleware('module:people,delete', only: ['destroy']),
        ];
    }

    public function index(Request $request): JsonResponse
    {
        // Matches Customer's total_purchases filtering logic: only
        // count purchases where something was actually received, not
        // drafts, pending orders, or cancelled ones.
        $query = Supplier::query()->withSum(['purchases as total_purchases' => fn ($q) => $q->whereIn('status', ['received', 'partially_received'])], 'grand_total');

        if ($search = $request->string('q')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('contact_person', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $suppliers = $query->orderBy('name')->paginate($request->integer('per_page', 20));

        return SupplierResource::collection($suppliers)->response();
    }

    public function show(Supplier $supplier): JsonResponse
    {
        $supplier->loadSum(['purchases as total_purchases' => fn ($q) => $q->whereIn('status', ['received', 'partially_received'])], 'grand_total');

        return (new SupplierResource($supplier))->response();
    }

    public function store(Request $request): JsonResponse
    {
        $supplier = Supplier::create($this->validated($request));

        return (new SupplierResource($supplier))->response()->setStatusCode(201);
    }

    public function update(Request $request, Supplier $supplier): JsonResponse
    {
        $supplier->update($this->validated($request));

        return (new SupplierResource($supplier))->response();
    }

    public function destroy(Supplier $supplier): JsonResponse
    {
        if ($supplier->purchases()->exists() || $supplier->products()->exists() || (float) $supplier->current_balance !== 0.0) {
            return response()->json([
                'message' => 'This supplier has purchase history, linked products, or an outstanding balance and can\'t be deleted. Set them to inactive instead.',
            ], 422);
        }

        $supplier->delete();

        return response()->json(null, 204);
    }

    /**
     * opening_balance/current_balance are deliberately never accepted
     * here — same reasoning as Customer: a supplier's balance only
     * changes through real purchases, receipts, and returns.
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);
    }
}
