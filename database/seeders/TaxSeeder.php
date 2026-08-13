<?php

namespace Database\Seeders;

use App\Models\Tax;
use Illuminate\Database\Seeder;

class TaxSeeder extends Seeder
{
    /** Mirrors the TAX_RATES mock in data.js. */
    public function run(): void
    {
        Tax::updateOrCreate(['name' => 'Standard VAT'], ['rate' => 5, 'is_default' => true]);
        Tax::updateOrCreate(['name' => 'Zero Rate'], ['rate' => 0, 'is_default' => false]);
    }
}
