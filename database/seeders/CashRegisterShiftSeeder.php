<?php

namespace Database\Seeders;

use App\Models\CashRegisterShift;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class CashRegisterShiftSeeder extends Seeder
{
    /**
     * Mirrors SHIFT_HISTORY (closed shifts) and SHIFT (the currently
     * open shift) mocks in data.js.
     */
    public function run(): void
    {
        $jane = User::where('email', 'cashier@novapos.com')->first();
        $tom = User::where('email', 'tom@novapos.com')->first();

        // Closed shifts, oldest first.
        $closed = [
            ['user' => $jane, 'daysAgo' => 3, 'opening' => 200, 'expected' => 680.50, 'counted' => 685.00],
            ['user' => $tom, 'daysAgo' => 2, 'opening' => 150, 'expected' => 510.00, 'counted' => 510.00],
            ['user' => $jane, 'daysAgo' => 1, 'opening' => 200, 'expected' => 720.30, 'counted' => 718.00],
        ];

        foreach ($closed as $shift) {
            $openedAt = Carbon::now()->subDays($shift['daysAgo'])->setTime(8, 0);

            CashRegisterShift::updateOrCreate(
                ['user_id' => $shift['user']->id, 'opened_at' => $openedAt],
                [
                    'closed_at' => $openedAt->copy()->setTime(20, 0),
                    'opening_cash' => $shift['opening'],
                    'expected_cash' => $shift['expected'],
                    'counted_cash' => $shift['counted'],
                    'variance' => round($shift['counted'] - $shift['expected'], 2),
                    'status' => 'closed',
                ],
            );
        }

        // Today's still-open shift.
        CashRegisterShift::updateOrCreate(
            ['user_id' => $jane->id, 'opened_at' => Carbon::today()->setTime(8, 0)],
            [
                'closed_at' => null,
                'opening_cash' => 200,
                'expected_cash' => null,
                'counted_cash' => null,
                'variance' => null,
                'status' => 'open',
            ],
        );
    }
}
