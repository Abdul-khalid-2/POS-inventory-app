<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Purchase */
class PurchaseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'po_no' => $this->po_no,
            'supplier' => $this->whenLoaded('supplier', fn () => [
                'id' => $this->supplier->id,
                'name' => $this->supplier->name,
            ]),
            'creator' => $this->whenLoaded('creator', fn () => [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ]),
            'purchase_date' => $this->purchase_date?->toIso8601String(),
            'expected_date' => $this->expected_date?->toDateString(),
            'subtotal' => (float) $this->subtotal,
            'discount' => (float) $this->discount,
            'tax_total' => (float) $this->tax_total,
            'grand_total' => (float) $this->grand_total,
            'paid_amount' => (float) $this->paid_amount,
            'due_amount' => (float) $this->due_amount,
            'payment_status' => $this->payment_status,
            'status' => $this->status,
            'items_count' => $this->whenCounted('items'),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item) => [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'name' => $item->product?->name,
                'sku' => $item->product?->sku,
                'unit' => $item->product?->unit?->short_code,
                'quantity' => $item->quantity,
                'received_quantity' => $item->received_quantity,
                'returned_quantity' => $item->returned_quantity,
                'unit_cost' => (float) $item->unit_cost,
                'tax' => (float) $item->tax,
                'line_total' => (float) $item->line_total,
            ])),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
