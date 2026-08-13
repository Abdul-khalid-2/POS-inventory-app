<?php

namespace Database\Seeders;

use App\Models\ExpenseCategory;
use Illuminate\Database\Seeder;

class ExpenseCategorySeeder extends Seeder
{
    /** Mirrors the EXPENSE_CATEGORIES mock in data.js. */
    public function run(): void
    {
        $names = [
            'Rent', 'Utilities', 'Salaries', 'Supplies',
            'Marketing', 'Maintenance', 'Transport', 'Miscellaneous',
        ];

        foreach ($names as $name) {
            ExpenseCategory::updateOrCreate(['name' => $name]);
        }
    }
}
