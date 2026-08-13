<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Staff accounts — mirrors the USERS mock in data.js. All demo
     * accounts share the password "demo1234" (matches the value
     * pre-filled on the current login screen).
     */
    public function run(): void
    {
        $users = [
            ['name' => 'Admin User', 'email' => 'admin@novapos.com', 'phone' => '+1-555-0301', 'role' => 'Admin', 'status' => 'active'],
            ['name' => 'Jane Cashier', 'email' => 'cashier@novapos.com', 'phone' => '+1-555-0302', 'role' => 'Cashier', 'status' => 'active'],
            ['name' => 'Mark Accountant', 'email' => 'accountant@novapos.com', 'phone' => '+1-555-0303', 'role' => 'Accountant', 'status' => 'active'],
            ['name' => 'Lisa Manager', 'email' => 'manager@novapos.com', 'phone' => '+1-555-0304', 'role' => 'Manager', 'status' => 'active'],
            ['name' => 'Tom Cashier', 'email' => 'tom@novapos.com', 'phone' => '+1-555-0305', 'role' => 'Cashier', 'status' => 'inactive'],
        ];

        foreach ($users as $data) {
            $role = Role::where('name', $data['role'])->first();

            User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'phone' => $data['phone'],
                    'role_id' => $role?->id,
                    'status' => $data['status'],
                    'password' => Hash::make('demo1234'),
                ],
            );
        }
    }
}
