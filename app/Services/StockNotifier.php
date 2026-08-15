<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Product;

class StockNotifier
{
    /**
     * Fires a notification only when stock actually crosses INTO low
     * or out-of-stock territory — not on every subsequent change while
     * it stays there. Otherwise every small adjustment on an
     * already-low product would spam a fresh notification.
     *
     * For a brand-new product, pass PHP_INT_MAX as $previousStock —
     * there's no real "previous" state to compare against, and using
     * a sentinel above any possible threshold means a product created
     * already low/out still notifies once, through the same crossing
     * logic, without a separate code path.
     */
    public static function checkThresholds(Product $product, int $previousStock, int $newStock): void
    {
        if ($newStock <= 0 && $previousStock > 0) {
            self::create(
                $product,
                'out_of_stock',
                'bi-x-octagon',
                'danger',
                'Out of Stock',
                "{$product->name} is now out of stock.",
            );

            return;
        }

        if ($newStock <= $product->reorder_level && $previousStock > $product->reorder_level) {
            $unit = $product->unit?->short_code ?? '';

            self::create(
                $product,
                'low_stock',
                'bi-exclamation-triangle',
                'warning',
                'Low Stock Alert',
                trim("{$product->name} is running low ({$newStock} {$unit} left).")
            );
        }
    }

    private static function create(Product $product, string $type, string $icon, string $color, string $title, string $message): void
    {
        Notification::create([
            'type' => $type,
            'icon' => $icon,
            'color' => $color,
            'title' => $title,
            'message' => $message,
            'product_id' => $product->id,
        ]);
    }
}
