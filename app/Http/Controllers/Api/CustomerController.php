<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Read-only for now — the POS terminal's customer picker needs real
 * customer IDs to attach to a sale (and, for credit sales, a real
 * balance to update). Full customer management (create/edit/ledger)
 * is a People-screen feature, Phase 8, not built yet.
 */
class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Customer::query()->where('status', 'active');

        if ($search = $request->string('q')->trim()->value()) {
            $query->where('name', 'like', "%{$search}%");
        }

        return CustomerResource::collection($query->orderBy('name')->get())->response();
    }
}
