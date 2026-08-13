<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\Tax>
 */
class TaxFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => 'Standard VAT',
            'rate' => 5,
            'is_default' => false,
        ];
    }
}
