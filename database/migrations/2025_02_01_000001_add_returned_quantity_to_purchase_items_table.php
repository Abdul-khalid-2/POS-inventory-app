<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tracked separately from received_quantity so a return can be
     * validated against "how much is still actually here to return"
     * (received minus already-returned), not just against how much
     * was originally ordered.
     */
    public function up(): void
    {
        Schema::table('purchase_items', function (Blueprint $table) {
            $table->integer('returned_quantity')->default(0)->after('received_quantity');
        });
    }

    public function down(): void
    {
        Schema::table('purchase_items', function (Blueprint $table) {
            $table->dropColumn('returned_quantity');
        });
    }
};
