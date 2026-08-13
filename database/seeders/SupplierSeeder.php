<?php

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    /** Mirrors the SUPPLIERS mock in data.js. */
    public function run(): void
    {
        // [name, phone, email, address, payable]
        $rows = [
            ['Global Beverages Co.', '+1-555-0201', 'orders@globalbev.com', '100 Industry Pkwy', 1850.00],
            ['Fresh Farms Distributors', '+1-555-0202', 'sales@freshfarms.com', '200 Harvest Rd', 0],
            ['Nestlé Wholesale', '+1-555-0203', 'wholesale@nestle.com', '300 Corp Blvd', 3200.00],
            ['Unilever Supply Chain', '+1-555-0204', 'supply@unilever.com', '400 Logistics Ave', 950.00],
            ['Local Bakery Suppliers', '+1-555-0205', 'info@localbakery.com', '500 Baker St', 0],
            ['Heinz Food Service', '+1-555-0206', 'foodservice@heinz.com', '600 Heinz Way', 480.00],
        ];

        foreach ($rows as [$name, $phone, $email, $address, $payable]) {
            Supplier::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'phone' => $phone,
                    'address' => $address,
                    'opening_balance' => 0,
                    'current_balance' => $payable,
                    'status' => 'active',
                ],
            );
        }
    }
}
