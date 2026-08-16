<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Sale */
class SaleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_no' => $this->invoice_no,
            'customer' => $this->whenLoaded('customer', fn () => $this->customer ? [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
            ] : null),
            'cashier' => $this->whenLoaded('cashier', fn () => [
                'id' => $this->cashier->id,
                'name' => $this->cashier->name,
            ]),
            'sale_date' => $this->sale_date?->toIso8601String(),
            'subtotal' => (float) $this->subtotal,
            'discount' => (float) $this->discount,
            'tax_total' => (float) $this->tax_total,
            'grand_total' => (float) $this->grand_total,
            'paid_amount' => (float) $this->paid_amount,
            'due_amount' => (float) $this->due_amount,
            'payment_status' => $this->payment_status,
            'payment_method_label' => $this->paymentMethodLabel(),
            'status' => $this->status,
            'items_count' => $this->whenCounted('items'),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item) => [
                'product_id' => $item->product_id,
                'name' => $item->product?->name,
                'sku' => $item->product?->sku,
                'quantity' => $item->quantity,
                'unit_price' => (float) $item->unit_price,
                'tax' => (float) $item->tax,
                'line_total' => (float) $item->line_total,
            ])),
            'payments' => $this->whenLoaded('payments', fn () => $this->payments->map(fn ($payment) => [
                'method' => $payment->method,
                'amount' => (float) $payment->amount,
            ])),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    /**
     * A single-word summary for the sales list's "Method" column — a
     * sale can have zero payments (pure credit), one, or several
     * (split payment), so there's no single "the" method to show
     * without this.
     */
    private function paymentMethodLabel(): ?string
    {
        if (! $this->relationLoaded('payments')) {
            return null;
        }

        $methods = $this->payments->pluck('method')->unique();

        return match (true) {
            $methods->isEmpty() => 'Credit',
            $methods->count() === 1 => ucfirst($methods->first()),
            default => 'Split',
        };
    }
}
