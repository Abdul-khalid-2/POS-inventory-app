<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Product */
class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'sku' => $this->sku,
            'barcode' => $this->barcode,
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
            ]),
            'brand' => $this->whenLoaded('brand', fn () => $this->brand ? [
                'id' => $this->brand->id,
                'name' => $this->brand->name,
            ] : null),
            'unit' => $this->whenLoaded('unit', fn () => [
                'id' => $this->unit->id,
                'name' => $this->unit->name,
                'short_code' => $this->unit->short_code,
            ]),
            'tax' => $this->whenLoaded('tax', fn () => $this->tax ? [
                'id' => $this->tax->id,
                'name' => $this->tax->name,
                'rate' => (float) $this->tax->rate,
            ] : null),
            'cost_price' => (float) $this->cost_price,
            'sale_price' => (float) $this->sale_price,
            'current_stock' => $this->current_stock,
            'reorder_level' => $this->reorder_level,
            'is_low_stock' => $this->isLowStock(),
            'description' => $this->description,
            'image' => $this->image,
            'status' => $this->status,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
