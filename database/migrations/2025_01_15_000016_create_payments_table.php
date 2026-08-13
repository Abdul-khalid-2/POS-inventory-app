<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            // Polymorphic: a payment can belong to a Sale (customer paying)
            // or a Purchase (paying a supplier).
            $table->morphs('payable');
            $table->decimal('amount', 12, 2);
            $table->enum('method', ['cash', 'card', 'wallet', 'bank']);
            $table->string('reference_no')->nullable();
            $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('paid_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
