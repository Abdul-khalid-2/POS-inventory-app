<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * `reason` stays a short category (Damaged, Returned, Correction,
     * etc. — see StockAdjustmentController). `notes` is free text
     * alongside it, which the Inventory > Adjust Stock form has always
     * had a field for but the original stock_movements migration
     * didn't include.
     */
    public function up(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->text('notes')->nullable()->after('reason');
        });
    }

    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropColumn('notes');
        });
    }
};
