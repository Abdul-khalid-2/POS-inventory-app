<?php

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    /** Mirrors the SUPPLIERS mock in data.js. */
    public function run(): void
    {
        // [name, contact_person, phone, email, address, payable]
        $rows = [
            ['Global Beverages Co.', 'John Smith', '+1-555-0201', 'orders@globalbev.com', '100 Industry Pkwy', 1850.00],
            ['Fresh Farms Distributors', 'Lisa Chen', '+1-555-0202', 'sales@freshfarms.com', '200 Harvest Rd', 0],
            ['Nestlé Wholesale', 'Mike Ross', '+1-555-0203', 'wholesale@nestle.com', '300 Corp Blvd', 3200.00],
            ['Unilever Supply Chain', 'Anna White', '+1-555-0204', 'supply@unilever.com', '400 Logistics Ave', 950.00],
            ['Local Bakery Suppliers', 'Tom Baker', '+1-555-0205', 'info@localbakery.com', '500 Baker St', 0],
            ['Heinz Food Service', 'Rachel Green', '+1-555-0206', 'foodservice@heinz.com', '600 Heinz Way', 480.00],
        ];

        foreach ($rows as [$name, $contactPerson, $phone, $email, $address, $payable]) {
            Supplier::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'contact_person' => $contactPerson,
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
