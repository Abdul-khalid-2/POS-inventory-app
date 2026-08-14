<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BrandResource;
use App\Models\Brand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class BrandController extends Controller implements HasMiddleware
{
    // Brands are a tab on the Products screen — same module permission.
    public static function middleware(): array
    {
        return [
            new Middleware('module:products', only: ['index', 'show']),
            new Middleware('module:products,add', only: ['store']),
            new Middleware('module:products,edit', only: ['update']),
            new Middleware('module:products,delete', only: ['destroy']),
        ];
    }

    public function index(): JsonResponse
    {
        $brands = Brand::withCount('products')->orderBy('name')->get();

        return BrandResource::collection($brands)->response();
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $data['slug'] = $this->uniqueSlug($data['name']);

        $brand = Brand::create($data);

        return (new BrandResource($brand))->response()->setStatusCode(201);
    }

    public function show(Brand $brand): JsonResponse
    {
        return (new BrandResource($brand->loadCount('products')))->response();
    }

    public function update(Request $request, Brand $brand): JsonResponse
    {
        $data = $this->validated($request);

        if ($data['name'] !== $brand->name) {
            $data['slug'] = $this->uniqueSlug($data['name'], $brand);
        }

        $brand->update($data);

        return (new BrandResource($brand))->response();
    }

    public function destroy(Brand $brand): JsonResponse
    {
        try {
            $brand->delete();
        } catch (\Illuminate\Database\QueryException) {
            return response()->json([
                'message' => 'This brand still has products linked to it.',
            ], 422);
        }

        return response()->json(null, 204);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);
    }

    private function uniqueSlug(string $name, ?Brand $ignore = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $i = 1;

        while (Brand::where('slug', $slug)->when($ignore, fn ($q) => $q->whereKeyNot($ignore->id))->exists()) {
            $slug = "{$base}-" . ++$i;
        }

        return $slug;
    }
}
