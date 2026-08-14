<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Product;

class ProductCodeGenerator
{
    /**
     * Next SKU for a category, e.g. "BEV-007" — prefix from
     * Category::sku_prefix (falls back to the first 3 letters of the
     * category name), dash, then that prefix's next 3-digit sequence
     * number based on the highest existing SKU with the same prefix.
     */
    public static function nextSku(Category $category): string
    {
        $prefix = $category->sku_prefix ?: strtoupper(substr($category->name, 0, 3));

        $lastNumber = Product::where('sku', 'like', "{$prefix}-%")
            ->get()
            ->map(fn (Product $product) => (int) substr($product->sku, strlen($prefix) + 1))
            ->max() ?? 0;

        $next = $lastNumber + 1;

        // If every number up to 999 is somehow taken, fall back to a
        // wider zero-padding rather than generating a duplicate.
        $padded = $next > 999 ? (string) $next : str_pad((string) $next, 3, '0', STR_PAD_LEFT);

        return "{$prefix}-{$padded}";
    }

    /**
     * A valid, unique EAN-13 barcode. Uses the 20–29 prefix range,
     * conventionally reserved for in-store/internal use (not assigned
     * to real GS1 member companies), so these never collide with a
     * genuine manufacturer barcode.
     */
    public static function nextBarcode(): string
    {
        do {
            $body = '20' . str_pad((string) random_int(0, 9999999999), 10, '0', STR_PAD_LEFT);
            $barcode = $body . self::ean13CheckDigit($body);
        } while (Product::where('barcode', $barcode)->exists());

        return $barcode;
    }

    /** Standard EAN-13 check digit algorithm over the first 12 digits. */
    private static function ean13CheckDigit(string $twelveDigits): int
    {
        $sum = 0;

        foreach (str_split($twelveDigits) as $i => $digit) {
            $sum += (int) $digit * ($i % 2 === 0 ? 1 : 3);
        }

        return (10 - ($sum % 10)) % 10;
    }
}
