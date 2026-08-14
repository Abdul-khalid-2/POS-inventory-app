<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Mirrors the CATEGORIES mock in data.js. sku_prefix matches the
     * prefixes already baked into ProductSeeder's SKUs (BEV-001,
     * SNK-002, etc.) so newly generated SKUs stay consistent with them.
     */
    public function run(): void
    {
        $categories = [
            'Beverages' => 'BEV',
            'Snacks' => 'SNK',
            'Dairy' => 'DRY',
            'Bakery' => 'BKY',
            'Household' => 'HSH',
            'Personal Care' => 'PCR',
            'Produce' => 'PRD',
            'Frozen' => 'FRZ',
        ];

        foreach ($categories as $name => $prefix) {
            Category::updateOrCreate(
                ['slug' => str($name)->slug()],
                ['name' => $name, 'sku_prefix' => $prefix, 'status' => 'active'],
            );
        }
    }
}
