<?php

namespace Database\Seeders;

use App\Models\Unit;
use Illuminate\Database\Seeder;

class UnitSeeder extends Seeder
{
    /** Mirrors the UNITS mock in data.js. */
    public function run(): void
    {
        $units = [
            'pcs' => 'Pieces',
            'kg' => 'Kilogram',
            'g' => 'Gram',
            'box' => 'Box',
            'pack' => 'Pack',
            'dozen' => 'Dozen',
            'liter' => 'Liter',
            'ml' => 'Milliliter',
        ];

        foreach ($units as $code => $name) {
            Unit::updateOrCreate(
                ['short_code' => $code],
                ['name' => $name],
            );
        }
    }
}
