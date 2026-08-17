<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\StockMovement */
class StockMovementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'quantity' => $this->quantity,
            'balance_after' => $this->balance_after,
            'reason' => $this->reason,
            'notes' => $this->notes,
            'product' => $this->whenLoaded('product', fn () => [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'sku' => $this->product->sku,
                'unit' => $this->product->relationLoaded('unit') && $this->product->unit
                    ? ['short_code' => $this->product->unit->short_code]
                    : null,
            ]),
            'user' => $this->whenLoaded('user', fn () => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ] : null),
            // The Sale or Purchase this movement is tied to, if any —
            // e.g. which PO a supplier return relates back to.
            'reference' => $this->whenLoaded('reference', fn () => $this->reference ? [
                'type' => match ($this->reference_type) {
                    \App\Models\Sale::class => 'sale',
                    \App\Models\Purchase::class => 'purchase',
                    default => 'other',
                },
                'id' => $this->reference->id,
                'label' => $this->reference->invoice_no ?? $this->reference->po_no ?? (string) $this->reference->id,
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
