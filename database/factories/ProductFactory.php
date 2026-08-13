<?php

namespace Database\Factories;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Tax;
use App\Models\Unit;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    public function definition(): array
    {
        $cost = $this->faker->randomFloat(2, 0.2, 20);

        return [
            'name' => ucfirst($this->faker->words(2, true)),
            'sku' => strtoupper($this->faker->unique()->bothify('???-###')),
            'barcode' => $this->faker->unique()->ean13(),
            'category_id' => Category::factory(),
            'brand_id' => Brand::factory(),
            'unit_id' => Unit::factory(),
            'tax_id' => Tax::factory(),
            'supplier_id' => null,
            'cost_price' => $cost,
            'sale_price' => round($cost * $this->faker->randomFloat(2, 1.3, 2), 2),
            'current_stock' => $this->faker->numberBetween(0, 300),
            'reorder_level' => $this->faker->numberBetween(10, 50),
            'status' => 'active',
        ];
    }
}
