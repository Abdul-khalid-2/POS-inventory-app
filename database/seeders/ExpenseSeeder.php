<?php

namespace Database\Seeders;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class ExpenseSeeder extends Seeder
{
    /**
     * Mirrors the EXPENSES mock in data.js. Dates are anchored to
     * "today minus N days" (rather than the mock's hardcoded 2024-08
     * dates) so the demo data always looks current, keeping the same
     * day-to-day spacing as the original list.
     */
    public function run(): void
    {
        // [daysAgo, category, amount, method, notes]
        $rows = [
            [11, 'Rent', 1500, 'bank', 'Monthly shop rent'],
            [10, 'Utilities', 320, 'bank', 'Electricity bill'],
            [9, 'Salaries', 2800, 'bank', 'Staff salaries'],
            [7, 'Supplies', 145, 'cash', 'Cleaning supplies'],
            [5, 'Marketing', 200, 'card', 'Social media ads'],
            [4, 'Utilities', 85, 'cash', 'Water bill'],
            [2, 'Maintenance', 175, 'cash', 'AC repair'],
            [0, 'Transport', 60, 'cash', 'Delivery fuel'],
        ];

        $accountant = User::where('email', 'accountant@novapos.com')->first();

        foreach ($rows as [$daysAgo, $categoryName, $amount, $method, $notes]) {
            $category = ExpenseCategory::where('name', $categoryName)->first();

            Expense::updateOrCreate(
                [
                    'expense_category_id' => $category->id,
                    'expense_date' => Carbon::now()->subDays($daysAgo)->toDateString(),
                    'amount' => $amount,
                ],
                [
                    'payment_method' => $method,
                    'notes' => $notes,
                    'user_id' => $accountant->id,
                ],
            );
        }
    }
}
