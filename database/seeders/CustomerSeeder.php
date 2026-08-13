<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    /**
     * Mirrors the CUSTOMERS mock in data.js. "Walk-in Customer" is
     * intentionally not seeded as a row — walk-in sales use a null
     * customer_id (see docs/erd.md).
     */
    public function run(): void
    {
        // [name, phone, email, address, due]
        $rows = [
            ['Ali Hassan', '+1-555-0101', 'ali.hassan@email.com', '123 Main St, Springfield', 120.00],
            ['Sarah Johnson', '+1-555-0102', 'sarah.j@email.com', '45 Oak Ave, Riverdale', 0],
            ['Mohammed Khan', '+1-555-0103', 'm.khan@email.com', '78 Elm St, Kingston', 340.00],
            ['Emily Davis', '+1-555-0104', 'emily.d@email.com', '90 Pine Rd, Westfield', 0],
            ['David Wilson', '+1-555-0105', 'd.wilson@email.com', '12 Maple Ln, Eastwood', 75.50],
            ['Fatima Noor', '+1-555-0106', 'fatima.n@email.com', '34 Cedar St, Lakeside', 0],
            ['James Brown', '+1-555-0107', 'j.brown@email.com', '56 Birch Dr, Hillcrest', 200.00],
            ['Aisha Malik', '+1-555-0108', 'aisha.m@email.com', '67 Willow Way, Brookfield', 0],
            ['Robert Taylor', '+1-555-0109', 'r.taylor@email.com', '89 Spruce St, Meadowbrook', 45.00],
        ];

        foreach ($rows as [$name, $phone, $email, $address, $due]) {
            Customer::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'phone' => $phone,
                    'address' => $address,
                    'opening_balance' => 0,
                    'current_balance' => $due,
                    'status' => 'active',
                ],
            );
        }
    }
}
