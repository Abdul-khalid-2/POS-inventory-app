<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UnitResource;
use App\Models\Unit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class UnitController extends Controller implements HasMiddleware
{
    // Units of measurement live under Settings, not the Products screen.
    public static function middleware(): array
    {
        return [
            new Middleware('module:settings', only: ['index', 'show']),
            new Middleware('module:settings,add', only: ['store']),
            new Middleware('module:settings,edit', only: ['update']),
            new Middleware('module:settings,delete', only: ['destroy']),
        ];
    }

    public function index(): JsonResponse
    {
        return UnitResource::collection(Unit::orderBy('name')->get())->response();
    }

    public function store(Request $request): JsonResponse
    {
        $unit = Unit::create($this->validated($request));

        return (new UnitResource($unit))->response()->setStatusCode(201);
    }

    public function show(Unit $unit): JsonResponse
    {
        return (new UnitResource($unit))->response();
    }

    public function update(Request $request, Unit $unit): JsonResponse
    {
        $unit->update($this->validated($request));

        return (new UnitResource($unit))->response();
    }

    public function destroy(Unit $unit): JsonResponse
    {
        try {
            $unit->delete();
        } catch (\Illuminate\Database\QueryException) {
            return response()->json([
                'message' => 'This unit is still used by one or more products.',
            ], 422);
        }

        return response()->json(null, 204);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:50'],
            'short_code' => ['required', 'string', 'max:10'],
        ]);
    }
}
