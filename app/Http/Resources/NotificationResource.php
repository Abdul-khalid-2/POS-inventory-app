<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Notification */
class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'icon' => $this->icon,
            'color' => $this->color,
            'title' => $this->title,
            'message' => $this->message,
            'is_read' => ! is_null($this->read_at),
            'time_ago' => $this->created_at?->diffForHumans(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
