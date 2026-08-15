<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * No module-permission gating here — Notifications has no entry in
 * the role_permissions matrix by design (see routes/web.php): every
 * authenticated user gets the shop's shared notification feed
 * regardless of role, same as the Notifications screen route itself.
 */
class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = Notification::with('product')
            ->latest()
            ->paginate($request->integer('per_page', 6));

        return NotificationResource::collection($notifications)
            ->additional(['unread_count' => Notification::whereNull('read_at')->count()])
            ->response();
    }

    public function markRead(Notification $notification): JsonResponse
    {
        $notification->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }

    public function markAllRead(): JsonResponse
    {
        Notification::whereNull('read_at')->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }
}
