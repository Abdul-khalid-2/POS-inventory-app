<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Powers auto-generated SKUs like "BEV-007" — the letters before the
     * dash. Nullable: a category without one falls back to the first 3
     * letters of its name at generation time (see ProductCodeGenerator).
     */
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->string('sku_prefix', 5)->nullable()->after('slug');
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn('sku_prefix');
        });
    }
};
