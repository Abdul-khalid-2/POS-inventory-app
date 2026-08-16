<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SupplierResource;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Read-only for now — the purchase order form's supplier picker needs
 * real supplier IDs. Full supplier management (create/edit/ledger) is
 * a People-screen feature, Phase 8, not built yet.
 */
class SupplierController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Supplier::query()->where('status', 'active');

        if ($search = $request->string('q')->trim()->value()) {
            $query->where('name', 'like', "%{$search}%");
        }

        return SupplierResource::collection($query->orderBy('name')->get())->response();
    }
}
