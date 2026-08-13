<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'role_id',
        'status',
        'avatar',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Whether this user's role grants a given ability on a module —
     * e.g. hasModulePermission('purchases', 'edit'). Named to avoid
     * colliding with Authorizable::can(), which this class already
     * inherits for Gate/Policy checks.
     */
    public function hasModulePermission(string $module, string $ability = 'view'): bool
    {
        $permission = $this->role?->permissions->firstWhere('module', $module);

        if (! $permission) {
            return false;
        }

        return match ($ability) {
            'view' => $permission->can_view,
            'add' => $permission->can_add,
            'edit' => $permission->can_edit,
            'delete' => $permission->can_delete,
            default => false,
        };
    }

    /** Sales this user made as a cashier. */
    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    /** Purchase orders this user created. */
    public function purchases(): HasMany
    {
        return $this->hasMany(Purchase::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function cashRegisterShifts(): HasMany
    {
        return $this->hasMany(CashRegisterShift::class);
    }

    public function paymentsReceived(): HasMany
    {
        return $this->hasMany(Payment::class, 'received_by');
    }
}
