<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * When the supplier is expected to deliver — the Purchases screen
     * always had this field, but the original purchases migration
     * didn't include a column for it.
     */
    public function up(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->date('expected_date')->nullable()->after('purchase_date');
        });
    }

    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->dropColumn('expected_date');
        });
    }
};
