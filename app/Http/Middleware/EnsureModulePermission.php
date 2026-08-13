<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gates a route behind the current user's role permissions for a given
 * module — see database/seeders/RoleSeeder.php for the actual matrix
 * and docs/erd.md for the role_permissions design.
 *
 * Usage in routes: ->middleware('module:purchases') for a view check,
 * or ->middleware('module:purchases,edit') for a specific ability.
 */
class EnsureModulePermission
{
    public function handle(Request $request, Closure $next, string $module, string $ability = 'view'): Response
    {
        $user = $request->user();

        if (! $user || ! $user->hasModulePermission($module, $ability)) {
            abort(403, "Your role doesn't have access to this section.");
        }

        return $next($request);
    }
}
