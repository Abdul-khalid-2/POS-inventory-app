<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\CashRegisterShift */
class CashRegisterShiftResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'opened_at' => $this->opened_at?->toIso8601String(),
            'closed_at' => $this->closed_at?->toIso8601String(),
            'opening_cash' => (float) $this->opening_cash,
            'expected_cash' => is_null($this->expected_cash) ? null : (float) $this->expected_cash,
            'counted_cash' => is_null($this->counted_cash) ? null : (float) $this->counted_cash,
            'variance' => is_null($this->variance) ? null : (float) $this->variance,
            'status' => $this->status,
            'notes' => $this->notes,
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ]),
        ];
    }
}
