<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TaxResource;
use App\Models\Tax;
use Illuminate\Http\JsonResponse;

/**
 * Read-only for now — just enough for the product form's tax dropdown
 * to submit a real tax_id. Full tax-rate management (create/edit/
 * delete) belongs to the Settings screen, not built yet.
 */
class TaxController extends Controller
{
    public function index(): JsonResponse
    {
        return TaxResource::collection(Tax::orderBy('name')->get())->response();
    }
}
