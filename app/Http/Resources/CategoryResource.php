<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Category */
class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'sku_prefix' => $this->sku_prefix,
            'parent_id' => $this->parent_id,
            'status' => $this->status,
            'products_count' => $this->whenCounted('products'),
        ];
    }
}
