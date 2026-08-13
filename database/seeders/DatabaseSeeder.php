<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seeds the whole app with realistic demo data — mirrors what's
     * already visible in public/assets/js/data.js, so the UI looks
     * identical whether it's reading mock JS or the real database.
     *
     * Order matters: each seeder below depends on the ones before it
     * (e.g. ProductSeeder needs categories/brands/units/taxes to exist).
     */
    public function run(): void
    {
        $this->call([
            // Master / reference data
            RoleSeeder::class,
            UserSeeder::class,
            CategorySeeder::class,
            BrandSeeder::class,
            UnitSeeder::class,
            TaxSeeder::class,
            ProductSeeder::class,
            CustomerSeeder::class,
            SupplierSeeder::class,
            ExpenseCategorySeeder::class,

            // Records that depend on the master data above
            ExpenseSeeder::class,
            CashRegisterShiftSeeder::class,
            TransactionSeeder::class, // purchases, sales, stock_movements, payments
        ]);
    }
}
