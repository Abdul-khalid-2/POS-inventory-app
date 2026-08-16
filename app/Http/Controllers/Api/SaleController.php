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
            new Middleware('module:pos,add', only: ['store', 'hold', 'destroyHeld']),
            new Middleware('module:pos', only: ['heldIndex']),
            // Sales history is a Sales-screen concern, not a POS one —
            // a different module permission than checkout/hold above.
            new Middleware('module:sales', only: ['index', 'show']),
        ];
    }

    /**
     * GET /catalog/sales — sales history for the Sales screen.
     * Excludes held orders by default (those live in the POS
     * terminal's own drawer, not sales history — see heldIndex()) and
     * never returns them even if a status filter is passed, since a
     * held order was never actually a completed transaction.
     *
     * Supports: q (invoice number or customer name), status
     * (completed/refunded/cancelled), payment_method
     * (cash/card/wallet/credit — 'credit' means still has a balance
     * due; the others match sales with at least one Payment of that
     * method, since a split-payment sale can have more than one).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Sale::query()->where('status', '!=', 'held')->withCount('items')->with(['customer', 'cashier', 'payments']);

        if ($search = $request->string('q')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('invoice_no', 'like', "%{$search}%")
                    ->orWhereHas('customer', fn ($c) => $c->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status') && $request->string('status')->value() !== 'all') {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('payment_method') && $request->string('payment_method')->value() !== 'all') {
            $method = $request->string('payment_method')->value();
            if ($method === 'credit') {
                $query->where('due_amount', '>', 0);
            } else {
                $query->whereHas('payments', fn ($p) => $p->where('method', $method));
            }
        }

        $sales = $query->latest('sale_date')->paginate($request->integer('per_page', 10));

        return SaleResource::collection($sales)->response();
    }

    /**
     * GET /catalog/sales/{sale} — full detail for one sale, including
     * line items and every payment (a split-payment sale can have
     * more than one).
     */
    public function show(Sale $sale): JsonResponse
    {
        return (new SaleResource($sale->load(['customer', 'cashier', 'items.product', 'payments'])))->response();
    }

    /**
     * POST /catalog/sales — the POS checkout endpoint.
     *
     * Deliberately does NOT trust any price/total the client sends —
     * only product_id + quantity. Every price, tax amount, and total
     * is computed here from the product's real current sale_price and
     * tax rate, exactly as it stands at the moment of sale — including
     * when this is finalizing a previously-held order: stock and
     * prices are re-checked fresh right now, not trusted from
     * whenever the order was originally held.
     *
     * Supports genuine split payments: `payments` is an array of
     * {method, amount} — one Payment row per entry, same polymorphic
     * relation Purchases already use. An empty array (or one that
     * doesn't cover the full total) means the remainder is due; that's
     * only allowed for a real customer, never a walk-in sale — you
     * can't extend credit to someone with no account to bill.
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
            'payments' => ['nullable', 'array'],
            'payments.*.method' => ['required_with:payments', Rule::in(['cash', 'card', 'wallet'])],
            'payments.*.amount' => ['required_with:payments', 'numeric', 'min:0.01'],
            // Set when this checkout is finalizing a previously-held
            // order — see hold()/heldIndex() below. Only a sale still
            // sitting at status=held gets deleted; a bogus/stale id is
            // silently ignored rather than erroring the whole checkout.
            'resume_held_sale_id' => ['nullable', 'integer', 'exists:sales,id'],
        ]);

        $discountType = $data['discount_type'] ?? 'amount';
        $discountValue = $data['discount_value'] ?? 0;
        $payments = $data['payments'] ?? [];

        [$sale, $stockEffects] = DB::transaction(function () use ($data, $discountType, $discountValue, $payments, $request) {
            ['lines' => $lines, 'subtotal' => $subtotal] = $this->priceItems($data['items'], lock: true);
            $this->assertSufficientStock($lines);

            ['lines' => $lines, 'discountAmount' => $discountAmount, 'taxTotal' => $taxTotal, 'grandTotal' => $grandTotal]
                = $this->applyDiscountAndTax($lines, $subtotal, $discountType, $discountValue);

            $paidAmount = round(array_sum(array_column($payments, 'amount')), 2);

            if ($paidAmount > $grandTotal + 0.01) { // small epsilon for float rounding
                throw ValidationException::withMessages([
                    'payments' => 'Payments add up to more than the total due. Reduce an amount, or handle change separately.',
                ]);
            }

            $dueAmount = round(max($grandTotal - $paidAmount, 0), 2);

            if ($dueAmount > 0 && empty($data['customer_id'])) {
                throw ValidationException::withMessages([
                    'customer_id' => 'Select a customer to put the remaining balance on credit — a walk-in sale must be paid in full.',
                ]);
            }

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

            // One Payment row per entry — this is the actual "split":
            // a $30 cash + $15.50 card sale creates two rows here,
            // both pointing at the same sale via the polymorphic
            // payable relation.
            foreach ($payments as $payment) {
                Payment::create([
                    'payable_type' => Sale::class,
                    'payable_id' => $sale->id,
                    'amount' => $payment['amount'],
                    'method' => $payment['method'],
                    'received_by' => $request->user()->id,
                    'paid_at' => now(),
                ]);
            }

            // Whatever's left (partial split payment, or fully on
            // credit) adds to what this customer owes the shop.
            if ($dueAmount > 0 && $sale->customer_id) {
                Customer::whereKey($sale->customer_id)->increment('current_balance', $dueAmount);
            }

            // This checkout finalized a held order — the held record
            // is now superseded by the real completed sale just
            // created above, so it goes away. Guarded to status=held
            // so a stale/bogus id can never delete a real sale.
            if (! empty($data['resume_held_sale_id'])) {
                Sale::where('id', $data['resume_held_sale_id'])->where('status', 'held')->delete();
            }

            return [$sale, $stockEffects];
        });

        // Fired after commit, same reasoning as the stock adjustment
        // flow — a notification is a side effect, not part of the
        // transaction's data integrity.
        foreach ($stockEffects as $effect) {
            StockNotifier::checkThresholds($effect['product'], $effect['previous'], $effect['new']);
        }

        return (new SaleResource($sale->load(['customer', 'cashier', 'items.product', 'payments'])))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * POST /catalog/sales/hold — parks the current cart as a real,
     * persisted Sale (status=held) instead of only living in the
     * browser tab's memory. No stock is deducted and no Payment is
     * created — holding commits nothing, it's just a durable "save
     * this cart for later" that survives a page reload, a crashed
     * tab, or another cashier picking it up on a different terminal.
     *
     * Uses the product's *current* price/tax for the persisted total
     * (so the Held Orders list shows a sensible number), but that
     * total is provisional — finalizing a held order goes through
     * store() again, which always re-prices fresh at that moment.
     */
    public function hold(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customer_id' => ['nullable', 'exists:customers,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'distinct', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'discount_type' => ['nullable', Rule::in(['amount', 'percent'])],
            'discount_value' => ['nullable', 'numeric', 'min:0'],
        ]);

        ['lines' => $lines, 'subtotal' => $subtotal] = $this->priceItems($data['items']);
        ['lines' => $lines, 'discountAmount' => $discountAmount, 'taxTotal' => $taxTotal, 'grandTotal' => $grandTotal]
            = $this->applyDiscountAndTax($lines, $subtotal, $data['discount_type'] ?? 'amount', $data['discount_value'] ?? 0);

        $sale = DB::transaction(function () use ($data, $lines, $subtotal, $discountAmount, $taxTotal, $grandTotal, $request) {
            $sale = Sale::create([
                'invoice_no' => $this->nextInvoiceNo(),
                'customer_id' => $data['customer_id'] ?? null,
                'user_id' => $request->user()->id,
                'sale_date' => now(),
                'subtotal' => round($subtotal, 2),
                'discount' => $discountAmount,
                'tax_total' => round($taxTotal, 2),
                'grand_total' => $grandTotal,
                'paid_amount' => 0,
                'due_amount' => $grandTotal,
                'payment_status' => 'due',
                'status' => 'held',
            ]);

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
            }

            return $sale;
        });

        return (new SaleResource($sale->load(['customer', 'cashier', 'items.product'])))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * GET /catalog/sales/held — every currently-held order, shop-wide
     * (not scoped to the current cashier — a held order should be
     * pickable by any cashier, e.g. if the one who parked it goes on
     * break or switches terminals).
     */
    public function heldIndex(): JsonResponse
    {
        $held = Sale::where('status', 'held')
            ->with(['customer', 'cashier', 'items.product'])
            ->latest()
            ->get();

        return SaleResource::collection($held)->response();
    }

    /**
     * DELETE /catalog/sales/{sale}/held — discards a held order.
     * Guarded to status=held so this can never be used to delete a
     * real completed sale.
     */
    public function destroyHeld(Sale $sale): JsonResponse
    {
        if ($sale->status !== 'held') {
            abort(422, 'Only a held order can be deleted this way.');
        }

        $sale->delete();

        return response()->json(null, 204);
    }

    /**
     * Prices a set of {product_id, quantity} lines against each
     * product's CURRENT sale_price/tax rate. No stock check here —
     * callers that actually commit stock (store()) call
     * assertSufficientStock() explicitly afterward; hold() doesn't,
     * since parking a cart shouldn't be blocked by stock at all.
     */
    private function priceItems(array $items, bool $lock = false): array
    {
        $productIds = collect($items)->pluck('product_id')->unique()->sort()->values();
        $query = Product::with(['tax', 'unit'])->whereIn('id', $productIds);
        if ($lock) {
            $query->lockForUpdate();
        }
        $products = $query->get()->keyBy('id');

        $lines = [];
        $subtotal = 0;

        foreach ($items as $item) {
            $product = $products[$item['product_id']];
            $unitPrice = (float) $product->sale_price;
            $lineSubtotal = round($unitPrice * $item['quantity'], 2);

            $lines[] = [
                'product' => $product,
                'quantity' => $item['quantity'],
                'unit_price' => $unitPrice,
                'line_subtotal' => $lineSubtotal,
                'tax_rate' => (float) ($product->tax?->rate ?? 0),
            ];
            $subtotal += $lineSubtotal;
        }

        return ['lines' => $lines, 'subtotal' => $subtotal];
    }

    private function assertSufficientStock(array $lines): void
    {
        foreach ($lines as $line) {
            if ($line['quantity'] > $line['product']->current_stock) {
                throw ValidationException::withMessages([
                    'items' => "Not enough stock for {$line['product']->name} — only {$line['product']->current_stock} {$line['product']->unit->short_code} left.",
                ]);
            }
        }
    }

    /**
     * Allocates a sale-level discount proportionally across lines by
     * their share of the subtotal, then computes tax per line at that
     * line's own product's rate (products have different rates — see
     * docs/erd.md).
     */
    private function applyDiscountAndTax(array $lines, float $subtotal, string $discountType, float $discountValue): array
    {
        $discountAmount = $discountType === 'percent'
            ? round($subtotal * min($discountValue, 100) / 100, 2)
            : round(min($discountValue, $subtotal), 2);

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

        return ['lines' => $lines, 'discountAmount' => $discountAmount, 'taxTotal' => $taxTotal, 'grandTotal' => $grandTotal];
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
