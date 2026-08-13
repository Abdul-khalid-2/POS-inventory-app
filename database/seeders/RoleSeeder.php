<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Roles and their per-module permission matrix — mirrors the
     * ROLE_PERMISSIONS mock in public/assets/js/data.js (Orders module
     * dropped, since Orders was cut from scope).
     */
    public function run(): void
    {
        $matrix = [
            'Admin' => [
                'dashboard' => ['view'],
                'pos' => ['view', 'add', 'edit', 'delete'],
                'products' => ['view', 'add', 'edit', 'delete'],
                'inventory' => ['view', 'add', 'edit', 'delete'],
                'sales' => ['view', 'add', 'edit', 'delete'],
                'purchases' => ['view', 'add', 'edit', 'delete'],
                'people' => ['view', 'add', 'edit', 'delete'],
                'accounts' => ['view', 'add', 'edit', 'delete'],
                'reports' => ['view'],
                'settings' => ['view', 'add', 'edit', 'delete'],
            ],
            'Cashier' => [
                'dashboard' => ['view'],
                'pos' => ['view', 'add', 'edit'],
                'products' => ['view'],
                'inventory' => [],
                'sales' => ['view', 'add'],
                'purchases' => [],
                'people' => ['view'],
                'accounts' => [],
                'reports' => [],
                'settings' => [],
            ],
            'Accountant' => [
                'dashboard' => ['view'],
                'pos' => [],
                'products' => ['view'],
                'inventory' => ['view'],
                'sales' => ['view'],
                'purchases' => ['view', 'add', 'edit'],
                'people' => ['view'],
                'accounts' => ['view', 'add', 'edit', 'delete'],
                'reports' => ['view'],
                'settings' => ['view'],
            ],
            'Manager' => [
                'dashboard' => ['view'],
                'pos' => ['view', 'add', 'edit', 'delete'],
                'products' => ['view', 'add', 'edit', 'delete'],
                'inventory' => ['view', 'add', 'edit', 'delete'],
                'sales' => ['view', 'add', 'edit', 'delete'],
                'purchases' => ['view', 'add', 'edit', 'delete'],
                'people' => ['view', 'add', 'edit', 'delete'],
                'accounts' => ['view', 'add', 'edit'],
                'reports' => ['view'],
                'settings' => ['view', 'add', 'edit'],
            ],
        ];

        foreach ($matrix as $roleName => $modules) {
            $role = Role::updateOrCreate(
                ['slug' => str($roleName)->slug()],
                ['name' => $roleName],
            );

            foreach ($modules as $module => $abilities) {
                $role->permissions()->updateOrCreate(
                    ['module' => $module],
                    [
                        'can_view' => in_array('view', $abilities),
                        'can_add' => in_array('add', $abilities),
                        'can_edit' => in_array('edit', $abilities),
                        'can_delete' => in_array('delete', $abilities),
                    ],
                );
            }
        }
    }
}
