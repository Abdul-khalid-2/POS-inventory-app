<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UserController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('module:people', only: ['index', 'show']),
            new Middleware('module:people,add', only: ['store']),
            new Middleware('module:people,edit', only: ['update', 'resetPassword']),
            new Middleware('module:people,delete', only: ['destroy']),
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $query = User::query()->with('role');

        if ($search = $request->string('q')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $users = $query->orderBy('name')->paginate($request->integer('per_page', 20));

        return UserResource::collection($users)->response();
    }

    public function show(User $user): JsonResponse
    {
        return (new UserResource($user->load('role')))->response();
    }

    /**
     * POST /catalog/staff — creates a staff account. Requires a
     * password up front (unlike a customer/supplier, this is a real
     * login), returned once in the response so an admin without email
     * infrastructure configured can relay it to the new hire — see
     * the Phase 2 note on password reset needing mail setup first.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $data['password'] = Hash::make($data['password']);

        $user = User::create($data);

        return (new UserResource($user->load('role')))->response()->setStatusCode(201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $this->validated($request, $user);
        // Password isn't part of a normal profile edit — changing it
        // is its own explicit action (resetPassword below), not
        // something that silently happens if a field is left filled
        // in from a previous state.
        unset($data['password']);

        $user->update($data);

        return (new UserResource($user->load('role')))->response();
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            abort(422, "You can't delete your own account.");
        }

        $hasHistory = $user->sales()->exists()
            || $user->purchases()->exists()
            || $user->expenses()->exists()
            || $user->stockMovements()->exists()
            || $user->cashRegisterShifts()->exists()
            || $user->paymentsReceived()->exists();

        if ($hasHistory) {
            return response()->json([
                'message' => 'This staff member has transaction history and can\'t be deleted. Set them to inactive instead.',
            ], 422);
        }

        $user->delete();

        return response()->json(null, 204);
    }

    /**
     * POST /catalog/staff/{user}/reset-password — generates a new
     * random temporary password and returns it once in the response.
     * There's no email infrastructure configured yet (see the Phase 2
     * password-reset note), so relaying it is a manual admin step for
     * now rather than an emailed link.
     */
    public function resetPassword(User $user): JsonResponse
    {
        $newPassword = Str::password(12);
        $user->update(['password' => Hash::make($newPassword)]);

        return response()->json([
            'message' => 'Password reset.',
            'temporary_password' => $newPassword,
        ]);
    }

    private function validated(Request $request, ?User $user = null): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user)],
            'phone' => ['nullable', 'string', 'max:50'],
            'role_id' => ['required', 'exists:roles,id'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];

        if (! $user) {
            $rules['password'] = ['required', 'string', 'min:8'];
        }

        return $request->validate($rules);
    }
}
