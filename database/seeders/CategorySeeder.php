<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /** Mirrors the CATEGORIES mock in data.js. */
    public function run(): void
    {
        $names = [
            'Beverages', 'Snacks', 'Dairy', 'Bakery',
            'Household', 'Personal Care', 'Produce', 'Frozen',
        ];

        foreach ($names as $name) {
            Category::updateOrCreate(
                ['slug' => str($name)->slug()],
                ['name' => $name, 'status' => 'active'],
            );
        }
    }
}
