<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Named app_notifications, not notifications — Laravel's own
     * built-in notification system (Notifiable + DatabaseNotification)
     * also defaults to a table called "notifications" but with a
     * completely different schema (UUID keys, polymorphic
     * notifiable_type/id, a JSON data column). This is a much simpler,
     * purpose-built table for NovaPOS's own shop-wide feed, so it gets
     * its own name to avoid ever colliding with that if this app
     * starts using Laravel's notification system for something else
     * later (e.g. queued emails).
     *
     * A shared, shop-wide feed (not per-user) — matches how the
     * existing mock notification list already worked: one list,
     * everyone sees the same read/unread state. Scoped for now to
     * stock triggers (type: low_stock, out_of_stock); Phase 12 adds
     * more trigger types on top of this same table as the screens
     * that need them (payments, shifts) get built.
     */
    public function up(): void
    {
        Schema::create('app_notifications', function (Blueprint $table) {
            $table->id();
            $table->string('type');
            $table->string('icon');
            $table->string('color');
            $table->string('title');
            $table->string('message');
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_notifications');
    }
};
