<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SaleResource;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use App\Services\StockNotifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class SaleController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('module:pos,add', only: ['store']),
        ];
    }

    /**
     * POST /catalog/sales — the POS checkout endpoint.
     *
     * Deliberately does NOT trust any price/total the client sends —
     * only product_id + quantity. Every price, tax amount, and total
     * is computed here from the product's real current sale_price and
     * tax rate, exactly as it stands at the moment of sale. A client
     * could send anything for a "price"; only the server's numbers
     * ever get persisted.
     *
     * Split payments across multiple methods on one sale are NOT
     * supported yet — that's the next roadmap item. For now a sale is
     * either paid in full by one method (cash/card/wallet) or sold on
     * credit (payment_method=credit — no Payment row, the full total
     * becomes the customer's due balance).
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customer_id' => ['nullable', 'exists:customers,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'distinct', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'discount_type' => ['nullable', Rule::in(['amount', 'percent'])],
            'discount_value' => ['nullable', 'numeric', 'min:0'],
            'payment_method' => ['required', Rule::in(['cash', 'card', 'wallet', 'credit'])],
            'amount_tendered' => ['nullable', 'numeric', 'min:0'],
        ]);

        $discountType = $data['discount_type'] ?? 'amount';
        $discountValue = $data['discount_value'] ?? 0;

        [$sale, $stockEffects] = DB::transaction(function () use ($data, $discountType, $discountValue, $request) {
            // Lock every product row up front, in a stable (sorted)
            // order, so two simultaneous checkouts touching overlapping
            // products can't deadlock each other.
            $productIds = collect($data['items'])->pluck('product_id')->unique()->sort()->values();
            $products = Product::with(['tax', 'unit'])->whereIn('id', $productIds)->lockForUpdate()->get()->keyBy('id');

            $lines = [];
            $subtotal = 0;

            foreach ($data['items'] as $item) {
                $product = $products[$item['product_id']];
                $qty = $item['quantity'];

                if ($qty > $product->current_stock) {
                    throw ValidationException::withMessages([
                        'items' => "Not enough stock for {$product->name} — only {$product->current_stock} {$product->unit->short_code} left.",
                    ]);
                }

                $unitPrice = (float) $product->sale_price;
                $lineSubtotal = round($unitPrice * $qty, 2);

                $lines[] = [
                    'product' => $product,
                    'quantity' => $qty,
                    'unit_price' => $unitPrice,
                    'line_subtotal' => $lineSubtotal,
                    'tax_rate' => (float) ($product->tax?->rate ?? 0),
                ];
                $subtotal += $lineSubtotal;
            }

            $discountAmount = $discountType === 'percent'
                ? round($subtotal * min($discountValue, 100) / 100, 2)
                : round(min($discountValue, $subtotal), 2);

            // Tax is computed per line, on that line's own product's
            // rate (products have different rates — see docs/erd.md),
            // with the sale-level discount allocated proportionally
            // across lines by their share of the subtotal.
            $taxTotal = 0;
            foreach ($lines as &$line) {
                $discountShare = $subtotal > 0 ? ($line['line_subtotal'] / $subtotal) * $discountAmount : 0;
                $taxableAmount = $line['line_subtotal'] - $discountShare;
                $line['tax'] = round($taxableAmount * $line['tax_rate'] / 100, 2);
                $line['line_total'] = round($line['line_subtotal'] + $line['tax'], 2);
                $taxTotal += $line['tax'];
            }
            unset($line);

            $grandTotal = round($subtotal - $discountAmount + $taxTotal, 2);

            $paidAmount = 0;
            if ($data['payment_method'] === 'cash') {
                $tendered = (float) ($data['amount_tendered'] ?? 0);
                if ($tendered < $grandTotal) {
                    throw ValidationException::withMessages([
                        'amount_tendered' => 'Amount tendered is less than the total due.',
                    ]);
                }
                $paidAmount = $grandTotal;
            } elseif (in_array($data['payment_method'], ['card', 'wallet'], true)) {
                $paidAmount = $grandTotal;
            }
            // 'credit' leaves $paidAmount at 0 — the full total becomes due.

            $dueAmount = round($grandTotal - $paidAmount, 2);
            $paymentStatus = $dueAmount <= 0 ? 'paid' : ($paidAmount > 0 ? 'partial' : 'due');

            $sale = Sale::create([
                'invoice_no' => $this->nextInvoiceNo(),
                'customer_id' => $data['customer_id'] ?? null,
                'user_id' => $request->user()->id,
                'sale_date' => now(),
                'subtotal' => round($subtotal, 2),
                'discount' => $discountAmount,
                'tax_total' => round($taxTotal, 2),
                'grand_total' => $grandTotal,
                'paid_amount' => $paidAmount,
                'due_amount' => $dueAmount,
                'payment_status' => $paymentStatus,
                'status' => 'completed',
            ]);

            $stockEffects = [];
            foreach ($lines as $line) {
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $line['product']->id,
                    'quantity' => $line['quantity'],
                    'unit_price' => $line['unit_price'],
                    'discount' => 0,
                    'tax' => $line['tax'],
                    'line_total' => $line['line_total'],
                ]);

                $previousStock = $line['product']->current_stock;
                $newStock = $previousStock - $line['quantity'];
                $line['product']->update(['current_stock' => $newStock]);

                StockMovement::create([
                    'product_id' => $line['product']->id,
                    'type' => 'sale_out',
                    'quantity' => $line['quantity'],
                    'balance_after' => $newStock,
                    'reference_type' => Sale::class,
                    'reference_id' => $sale->id,
                    'user_id' => $request->user()->id,
                ]);

                $stockEffects[] = ['product' => $line['product'], 'previous' => $previousStock, 'new' => $newStock];
            }

            if ($paidAmount > 0) {
                Payment::create([
                    'payable_type' => Sale::class,
                    'payable_id' => $sale->id,
                    'amount' => $paidAmount,
                    'method' => $data['payment_method'],
                    'received_by' => $request->user()->id,
                    'paid_at' => now(),
                ]);
            }

            // A credit sale to a real (non-walk-in) customer adds to
            // what they owe the shop.
            if ($dueAmount > 0 && $sale->customer_id) {
                Customer::whereKey($sale->customer_id)->increment('current_balance', $dueAmount);
            }

            return [$sale, $stockEffects];
        });

        // Fired after commit, same reasoning as the stock adjustment
        // flow — a notification is a side effect, not part of the
        // transaction's data integrity.
        foreach ($stockEffects as $effect) {
            StockNotifier::checkThresholds($effect['product'], $effect['previous'], $effect['new']);
        }

        return (new SaleResource($sale->load(['customer', 'cashier', 'items.product'])))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * NOTE: loads every invoice_no into memory to find the highest
     * number. Fine at today's scale (seed data + real usage so far);
     * revisit with a proper sequence/counter if the sales table grows
     * large enough for this to matter.
     */
    private function nextInvoiceNo(): string
    {
        $last = Sale::query()
            ->get(['invoice_no'])
            ->map(fn ($s) => (int) substr($s->invoice_no, 4))
            ->max() ?? 999;

        return 'INV-' . ($last + 1);
    }
}
