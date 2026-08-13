<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->enum('type', [
                'purchase_in', 'sale_out', 'adjustment_in', 'adjustment_out',
                'return_in', 'return_out',
            ]);
            $table->integer('quantity'); // always positive; `type` gives direction
            $table->integer('balance_after'); // running stock snapshot after this movement
            // Polymorphic link back to whatever caused it (Sale, Purchase, etc.)
            $table->nullableMorphs('reference');
            $table->string('reason')->nullable(); // used for manual adjustments
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
