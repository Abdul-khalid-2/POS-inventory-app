<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Tax;
use App\Models\Unit;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Mirrors the 30 products in the PRODUCTS mock in data.js, so the
     * database matches exactly what's already visible in the UI.
     */
    public function run(): void
    {
        // [name, sku, barcode, category, brand, cost, price, stock, reorder, unit, taxPercent, status]
        $rows = [
            ['Coca-Cola 500ml', 'BEV-001', '5449000000996', 'Beverages', 'Coca-Cola', 0.45, 0.80, 240, 50, 'pcs', 5, 'active'],
            ['Pepsi 330ml Can', 'BEV-002', '3120000012345', 'Beverages', 'PepsiCo', 0.40, 0.75, 12, 50, 'pcs', 5, 'active'],
            ['Nestlé Pure Water 1L', 'BEV-003', '7613034626844', 'Beverages', 'Nestlé', 0.20, 0.50, 500, 100, 'pcs', 0, 'active'],
            ['Orange Juice 1L', 'BEV-004', '8056000900011', 'Beverages', 'Nestlé', 1.20, 2.20, 60, 30, 'pcs', 5, 'active'],
            ["Lay's Classic 150g", 'SNK-001', '6041000123456', 'Snacks', 'PepsiCo', 0.80, 1.50, 80, 40, 'pcs', 5, 'active'],
            ['Oreo Cookies 137g', 'SNK-002', '0440000012345', 'Snacks', 'Kelloggs', 0.90, 1.80, 0, 30, 'pack', 5, 'active'],
            ['Chocolate Bar 100g', 'SNK-003', '7622210449283', 'Snacks', 'Nestlé', 0.50, 1.20, 120, 40, 'pcs', 5, 'active'],
            ['Mixed Nuts 200g', 'SNK-004', '5012345678900', 'Snacks', 'Nabati', 1.50, 3.00, 45, 20, 'pack', 5, 'active'],
            ['Fresh Milk 1L', 'DRY-001', '5449000000123', 'Dairy', 'Nestlé', 0.80, 1.50, 8, 30, 'pcs', 0, 'active'],
            ['Cheddar Cheese 250g', 'DRY-002', '20605839', 'Dairy', 'Nestlé', 2.00, 3.80, 35, 15, 'pcs', 5, 'active'],
            ['Greek Yogurt 500g', 'DRY-003', '8076809513456', 'Dairy', 'Nestlé', 1.10, 2.20, 50, 20, 'pcs', 0, 'active'],
            ['Butter 200g', 'DRY-004', '7012345678901', 'Dairy', 'Nestlé', 1.30, 2.50, 28, 15, 'pcs', 5, 'active'],
            ['White Bread Loaf', 'BKY-001', '2012345678901', 'Bakery', 'Local Farms', 0.60, 1.20, 40, 20, 'pcs', 0, 'active'],
            ['Croissant', 'BKY-002', '2023456789012', 'Bakery', 'Local Farms', 0.45, 0.90, 25, 15, 'pcs', 5, 'active'],
            ['Chocolate Donut', 'BKY-003', '2034567890123', 'Bakery', 'Local Farms', 0.35, 0.80, 18, 10, 'pcs', 5, 'active'],
            ['Dish Soap 500ml', 'HSH-001', '3012345678901', 'Household', 'Unilever', 1.20, 2.50, 55, 20, 'pcs', 5, 'active'],
            ['Paper Towels 2-pack', 'HSH-002', '3012345678902', 'Household', 'Unilever', 1.50, 3.00, 30, 15, 'pack', 5, 'active'],
            ['Trash Bags 30ct', 'HSH-003', '3012345678903', 'Household', 'Unilever', 2.00, 4.00, 22, 10, 'box', 5, 'active'],
            ['Shampoo 400ml', 'PCR-001', '4012345678901', 'Personal Care', 'Unilever', 2.50, 5.00, 40, 15, 'pcs', 5, 'active'],
            ['Toothpaste 100ml', 'PCR-002', '4012345678902', 'Personal Care', 'Unilever', 1.00, 2.20, 60, 20, 'pcs', 5, 'active'],
            ['Hand Soap 300ml', 'PCR-003', '4012345678903', 'Personal Care', 'Unilever', 0.80, 1.80, 35, 15, 'pcs', 5, 'active'],
            ['Banana 1kg', 'PRD-001', '5012345678901', 'Produce', 'Local Farms', 0.50, 1.00, 100, 30, 'kg', 0, 'active'],
            ['Apple 1kg', 'PRD-002', '5012345678902', 'Produce', 'Local Farms', 0.80, 1.50, 70, 25, 'kg', 0, 'active'],
            ['Tomato 1kg', 'PRD-003', '5012345678903', 'Produce', 'Local Farms', 0.60, 1.20, 15, 30, 'kg', 0, 'active'],
            ['Frozen Pizza 400g', 'FRZ-001', '6012345678901', 'Frozen', 'Nestlé', 1.80, 3.50, 32, 15, 'pcs', 5, 'active'],
            ['Ice Cream 1L', 'FRZ-002', '6012345678902', 'Frozen', 'Nestlé', 2.00, 4.00, 18, 10, 'pcs', 5, 'active'],
            ['Frozen Fries 1kg', 'FRZ-003', '6012345678903', 'Frozen', 'PepsiCo', 1.20, 2.50, 42, 15, 'pack', 5, 'active'],
            ['Heinz Ketchup 400g', 'HSH-004', '3012345678904', 'Household', 'Heinz', 1.10, 2.30, 38, 15, 'pcs', 5, 'active'],
            ['Green Tea 25 bags', 'BEV-005', '5449000000456', 'Beverages', 'Nestlé', 1.50, 3.00, 5, 20, 'box', 5, 'active'],
            ['Instant Coffee 200g', 'BEV-006', '5449000000789', 'Beverages', 'Nestlé', 2.50, 5.00, 28, 15, 'pcs', 5, 'inactive'],
        ];

        $categories = Category::pluck('id', 'name');
        $brands = Brand::pluck('id', 'name');
        $units = Unit::pluck('id', 'short_code');
        $standardVat = Tax::where('name', 'Standard VAT')->value('id');
        $zeroRate = Tax::where('name', 'Zero Rate')->value('id');

        foreach ($rows as [$name, $sku, $barcode, $category, $brand, $cost, $price, $stock, $reorder, $unit, $taxPercent, $status]) {
            Product::updateOrCreate(
                ['sku' => $sku],
                [
                    'name' => $name,
                    'barcode' => $barcode,
                    'category_id' => $categories[$category],
                    'brand_id' => $brands[$brand] ?? null,
                    'unit_id' => $units[$unit],
                    'tax_id' => $taxPercent > 0 ? $standardVat : $zeroRate,
                    'cost_price' => $cost,
                    'sale_price' => $price,
                    'current_stock' => $stock,
                    'reorder_level' => $reorder,
                    'status' => $status,
                ],
            );
        }
    }
}
