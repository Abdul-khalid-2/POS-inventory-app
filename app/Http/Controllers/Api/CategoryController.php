<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryController extends Controller implements HasMiddleware
{
    // Categories are a tab on the Products screen, so they share that
    // screen's module permission rather than having their own.
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
        $categories = Category::withCount('products')->orderBy('name')->get();

        return CategoryResource::collection($categories)->response();
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $data['slug'] = $this->uniqueSlug($data['name']);

        $category = Category::create($data);

        return (new CategoryResource($category))->response()->setStatusCode(201);
    }

    public function show(Category $category): JsonResponse
    {
        return (new CategoryResource($category->loadCount('products')))->response();
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $data = $this->validated($request, $category);

        if ($data['name'] !== $category->name) {
            $data['slug'] = $this->uniqueSlug($data['name'], $category);
        }

        $category->update($data);

        return (new CategoryResource($category))->response();
    }

    public function destroy(Category $category): JsonResponse
    {
        try {
            $category->delete();
        } catch (\Illuminate\Database\QueryException) {
            return response()->json([
                'message' => 'This category still has products or subcategories linked to it.',
            ], 422);
        }

        return response()->json(null, 204);
    }

    private function validated(Request $request, ?Category $category = null): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:100'],
            'parent_id' => ['nullable', 'exists:categories,id'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];

        // A category can't be its own parent.
        if ($category) {
            $rules['parent_id'][] = Rule::notIn([$category->id]);
        }

        return $request->validate($rules);
    }

    private function uniqueSlug(string $name, ?Category $ignore = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $i = 1;

        while (Category::where('slug', $slug)->when($ignore, fn ($q) => $q->whereKeyNot($ignore->id))->exists()) {
            $slug = "{$base}-" . ++$i;
        }

        return $slug;
    }
}
