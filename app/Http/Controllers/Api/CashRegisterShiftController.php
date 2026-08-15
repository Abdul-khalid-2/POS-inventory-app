<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CashRegisterShiftResource;
use App\Models\CashRegisterShift;
use App\Models\Payment;
use App\Models\Sale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class CashRegisterShiftController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('module:pos', only: ['current', 'index']),
            new Middleware('module:pos,add', only: ['open']),
            new Middleware('module:pos,edit', only: ['close']),
        ];
    }

    /**
     * GET /catalog/shifts/current — the authenticated user's own open
     * shift, or null. Shifts are per-cashier (each cashier opens and
     * closes their own register), not shop-wide.
     *
     * Includes a *live* cash_in_drawer figure — opening_cash plus
     * every cash payment this user has received since the shift
     * opened, computed fresh on every call. This is deliberately kept
     * separate from expected_cash (which stays null until the shift
     * is actually closed) — cash_in_drawer is a running estimate for
     * display (e.g. the dashboard), not the final closing figure.
     */
    public function current(Request $request): JsonResponse
    {
        $shift = CashRegisterShift::where('user_id', $request->user()->id)
            ->where('status', 'open')
            ->latest('opened_at')
            ->first();

        if (! $shift) {
            return response()->json(['data' => null]);
        }

        $cashReceived = Payment::where('received_by', $shift->user_id)
            ->where('method', 'cash')
            ->where('payable_type', Sale::class)
            ->whereBetween('paid_at', [$shift->opened_at, now()])
            ->sum('amount');

        return response()->json([
            'data' => array_merge(
                (new CashRegisterShiftResource($shift))->resolve(),
                ['cash_in_drawer' => round((float) $shift->opening_cash + (float) $cashReceived, 2)],
            ),
        ]);
    }

    /**
     * GET /catalog/shifts — this user's own shift history, newest first.
     */
    public function index(Request $request): JsonResponse
    {
        $shifts = CashRegisterShift::where('user_id', $request->user()->id)
            ->latest('opened_at')
            ->paginate($request->integer('per_page', 10));

        return CashRegisterShiftResource::collection($shifts)->response();
    }

    /**
     * POST /catalog/shifts/open
     */
    public function open(Request $request): JsonResponse
    {
        $data = $request->validate([
            'opening_cash' => ['required', 'numeric', 'min:0'],
        ]);

        $alreadyOpen = CashRegisterShift::where('user_id', $request->user()->id)
            ->where('status', 'open')
            ->exists();

        if ($alreadyOpen) {
            abort(422, 'You already have an open shift — close it before opening a new one.');
        }

        $shift = CashRegisterShift::create([
            'user_id' => $request->user()->id,
            'opened_at' => now(),
            'opening_cash' => $data['opening_cash'],
            'status' => 'open',
        ]);

        return (new CashRegisterShiftResource($shift->load('user')))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * POST /catalog/shifts/{shift}/close
     *
     * expected_cash isn't something the cashier enters — it's
     * computed from the real cash Payment rows recorded against them
     * since the shift opened (opening_cash + every cash payment this
     * user actually received during the shift window). That's the
     * whole payoff of this being real data now instead of a mock:
     * "expected" reflects what genuinely happened at this register,
     * not a guess.
     */
    public function close(Request $request, CashRegisterShift $shift): JsonResponse
    {
        if ($shift->user_id !== $request->user()->id) {
            abort(403, "You can only close your own shift.");
        }
        if ($shift->status !== 'open') {
            abort(422, 'This shift is already closed.');
        }

        $data = $request->validate([
            'counted_cash' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $cashReceived = Payment::where('received_by', $shift->user_id)
            ->where('method', 'cash')
            ->where('payable_type', Sale::class)
            ->whereBetween('paid_at', [$shift->opened_at, now()])
            ->sum('amount');

        $expectedCash = round((float) $shift->opening_cash + (float) $cashReceived, 2);
        $variance = round($data['counted_cash'] - $expectedCash, 2);

        $shift->update([
            'closed_at' => now(),
            'expected_cash' => $expectedCash,
            'counted_cash' => $data['counted_cash'],
            'variance' => $variance,
            'status' => 'closed',
            'notes' => $data['notes'] ?? null,
        ]);

        return (new CashRegisterShiftResource($shift->load('user')))->response();
    }
}
