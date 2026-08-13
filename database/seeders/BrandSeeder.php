<?php

namespace Database\Seeders;

use App\Models\Brand;
use Illuminate\Database\Seeder;

class BrandSeeder extends Seeder
{
    /** Mirrors the BRANDS mock in data.js. */
    public function run(): void
    {
        $names = [
            'Coca-Cola', 'PepsiCo', 'Nestlé', 'Unilever',
            'Kelloggs', 'Local Farms', 'Nabati', 'Heinz',
        ];

        foreach ($names as $name) {
            Brand::updateOrCreate(
                ['slug' => str($name)->slug()],
                ['name' => $name, 'status' => 'active'],
            );
        }
    }
}
