<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Validation\Rule;

class CustomerController extends Controller implements HasMiddleware
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

    /**
     * GET /catalog/customers
     * Paginated, like every other list endpoint — the POS terminal's
     * customer picker (small dataset) just requests a high per_page
     * and status=active rather than this endpoint having two
     * different response shapes depending on caller.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Customer::query()->withSum(['sales as total_purchases' => fn ($q) => $q->where('status', 'completed')], 'grand_total');

        if ($search = $request->string('q')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $customers = $query->orderBy('name')->paginate($request->integer('per_page', 20));

        return CustomerResource::collection($customers)->response();
    }

    public function show(Customer $customer): JsonResponse
    {
        $customer->loadSum(['sales as total_purchases' => fn ($q) => $q->where('status', 'completed')], 'grand_total');

        return (new CustomerResource($customer))->response();
    }

    public function store(Request $request): JsonResponse
    {
        $customer = Customer::create($this->validated($request));

        return (new CustomerResource($customer))->response()->setStatusCode(201);
    }

    public function update(Request $request, Customer $customer): JsonResponse
    {
        $customer->update($this->validated($request));

        return (new CustomerResource($customer))->response();
    }

    public function destroy(Customer $customer): JsonResponse
    {
        if ($customer->sales()->exists() || (float) $customer->current_balance !== 0.0) {
            return response()->json([
                'message' => 'This customer has purchase history or an outstanding balance and can\'t be deleted. Set them to inactive instead.',
            ], 422);
        }

        $customer->delete();

        return response()->json(null, 204);
    }

    /**
     * opening_balance/current_balance are deliberately never accepted
     * here — a customer's balance only changes through real
     * transactions (a sale on credit, a refund, a recorded payment),
     * never a direct edit.
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);
    }
}
