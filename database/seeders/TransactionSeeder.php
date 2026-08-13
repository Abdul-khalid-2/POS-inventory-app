<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class TransactionSeeder extends Seeder
{
    /**
     * product_id => [ ['date' => Carbon, 'qty' => int, 'direction' => 1|-1] ]
     */
    private array $ledger = [];

    /**
     * Generates realistic purchase orders and sales invoices — mirrors
     * generateSales()/generatePurchases() in data.js — plus a genuinely
     * consistent stock_movements ledger tying them together.
     *
     * NOTE on stock: each product's current_stock (seeded by
     * ProductSeeder) is treated as the *starting* inventory before this
     * generated history. Every purchase/sale below applies on top of
     * that baseline, and current_stock is updated to the ledger's real
     * ending balance — so the final numbers will be close to, but not
     * identical to, the static figures in data.js. This keeps the
     * ledger internally consistent, which matters more for a real
     * inventory system than matching a mock snapshot exactly.
     */
    public function run(): void
    {
        $products = Product::where('status', 'active')->get();
        $suppliers = Supplier::all();
        $customers = Customer::all();
        $cashiers = User::whereIn('email', ['cashier@novapos.com', 'tom@novapos.com', 'manager@novapos.com'])->get();
        $poCreators = User::whereIn('email', ['admin@novapos.com', 'manager@novapos.com', 'accountant@novapos.com'])->get();

        if ($products->isEmpty() || $suppliers->isEmpty() || $cashiers->isEmpty() || $poCreators->isEmpty()) {
            $this->command?->warn('TransactionSeeder skipped — run the master-data seeders first (products, suppliers, users).');

            return;
        }

        $this->generatePurchases($products, $suppliers, $poCreators);
        $this->generateSales($products, $customers, $cashiers);
        $this->applyLedgerToStock($products);
    }

    private function generatePurchases($products, $suppliers, $poCreators): void
    {
        $statusPool = ['received', 'received', 'received', 'partially_received', 'ordered', 'draft'];
        $paymentPool = ['paid', 'paid', 'partial', 'due'];
        $poNum = 500;

        for ($i = 0; $i < 15; $i++) {
            $date = Carbon::now()->subDays(random_int(1, 45))->setTime(random_int(8, 17), random_int(0, 59));
            $supplier = $suppliers->random();
            $creator = $poCreators->random();
            $status = $statusPool[array_rand($statusPool)];

            $lineCount = random_int(2, 5);
            $lines = [];
            $subtotal = 0;

            foreach ($products->random(min($lineCount, $products->count())) as $product) {
                $qty = random_int(20, 100);
                $unitCost = (float) $product->cost_price;
                $lineTotal = round($unitCost * $qty, 2);
                $received = match ($status) {
                    'received' => $qty,
                    'partially_received' => (int) round($qty * random_int(30, 90) / 100),
                    default => 0,
                };
                $lines[] = compact('product', 'qty', 'unitCost', 'lineTotal', 'received');
                $subtotal += $lineTotal;
            }

            $taxTotal = round($subtotal * 0.05, 2);
            $discount = random_int(1, 10) === 1 ? round($subtotal * 0.03, 2) : 0;
            $grandTotal = round($subtotal + $taxTotal - $discount, 2);

            $paymentStatus = $status === 'draft' ? 'due' : $paymentPool[array_rand($paymentPool)];
            [$paidAmount, $dueAmount] = $this->splitPayment($grandTotal, $paymentStatus);

            $purchase = Purchase::create([
                'po_no' => 'PO-' . ($poNum + $i),
                'supplier_id' => $supplier->id,
                'user_id' => $creator->id,
                'purchase_date' => $date,
                'subtotal' => round($subtotal, 2),
                'discount' => $discount,
                'tax_total' => $taxTotal,
                'grand_total' => $grandTotal,
                'paid_amount' => $paidAmount,
                'due_amount' => $dueAmount,
                'status' => $status,
                'payment_status' => $paymentStatus,
            ]);

            foreach ($lines as $line) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $line['product']->id,
                    'quantity' => $line['qty'],
                    'received_quantity' => $line['received'],
                    'unit_cost' => $line['unitCost'],
                    'tax' => round($line['lineTotal'] * 0.05, 2),
                    'line_total' => $line['lineTotal'],
                ]);

                if ($line['received'] > 0) {
                    $this->ledger[$line['product']->id][] = [
                        'date' => $date,
                        'qty' => $line['received'],
                        'direction' => 1,
                        'type' => 'purchase_in',
                        'reference_type' => Purchase::class,
                        'reference_id' => $purchase->id,
                        'user_id' => $creator->id,
                    ];
                }
            }

            if ($paidAmount > 0) {
                Payment::create([
                    'payable_type' => Purchase::class,
                    'payable_id' => $purchase->id,
                    'amount' => $paidAmount,
                    'method' => ['cash', 'card', 'bank'][array_rand(['cash', 'card', 'bank'])],
                    'received_by' => $creator->id,
                    'paid_at' => $date,
                ]);
            }
        }
    }

    private function generateSales($products, $customers, $cashiers): void
    {
        $statusPool = ['completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'refunded', 'held', 'cancelled'];
        $paymentMethods = ['cash', 'card', 'wallet', 'bank'];
        $invNum = 1000;

        for ($i = 0; $i < 45; $i++) {
            $date = Carbon::now()->subDays(random_int(0, 30))->setTime(random_int(8, 20), random_int(0, 59));
            $status = $statusPool[array_rand($statusPool)];
            $cashier = $cashiers->random();
            $customer = random_int(1, 4) === 1 ? null : $customers->random(); // ~25% walk-in

            $lineCount = random_int(1, 6);
            $lines = [];
            $subtotal = 0;
            $taxTotal = 0;

            foreach ($products->random(min($lineCount, $products->count())) as $product) {
                $qty = random_int(1, 4);
                $unitPrice = (float) $product->sale_price;
                $lineSubtotal = round($unitPrice * $qty, 2);
                $taxRate = (float) ($product->tax?->rate ?? 0);
                $lineTax = round($lineSubtotal * $taxRate / 100, 2);
                $lineTotal = round($lineSubtotal + $lineTax, 2);
                $lines[] = compact('product', 'qty', 'unitPrice', 'lineTotal', 'lineTax');
                $subtotal += $lineSubtotal;
                $taxTotal += $lineTax;
            }

            $discount = random_int(1, 5) === 1 ? round($subtotal * 0.05, 2) : 0;
            $grandTotal = round($subtotal + $taxTotal - $discount, 2);

            $paymentStatus = match ($status) {
                'held', 'cancelled' => 'due',
                default => ['paid', 'paid', 'paid', 'partial', 'due'][array_rand(['paid', 'paid', 'paid', 'partial', 'due'])],
            };
            $paidAmount = in_array($status, ['held', 'cancelled']) ? 0 : $this->splitPayment($grandTotal, $paymentStatus)[0];
            $dueAmount = round($grandTotal - $paidAmount, 2);

            $sale = Sale::create([
                'invoice_no' => 'INV-' . ($invNum + $i),
                'customer_id' => $customer?->id,
                'user_id' => $cashier->id,
                'sale_date' => $date,
                'subtotal' => round($subtotal, 2),
                'discount' => $discount,
                'tax_total' => round($taxTotal, 2),
                'grand_total' => $grandTotal,
                'paid_amount' => $paidAmount,
                'due_amount' => $dueAmount,
                'payment_status' => $paymentStatus,
                'status' => $status,
            ]);

            foreach ($lines as $line) {
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $line['product']->id,
                    'quantity' => $line['qty'],
                    'unit_price' => $line['unitPrice'],
                    'discount' => 0,
                    'tax' => $line['lineTax'],
                    'line_total' => $line['lineTotal'],
                ]);

                // Only completed sales actually move stock — refunds get
                // their own restock logic in Phase 6, held/cancelled
                // never left the register.
                if ($status === 'completed') {
                    $this->ledger[$line['product']->id][] = [
                        'date' => $date,
                        'qty' => $line['qty'],
                        'direction' => -1,
                        'type' => 'sale_out',
                        'reference_type' => Sale::class,
                        'reference_id' => $sale->id,
                        'user_id' => $cashier->id,
                    ];
                }
            }

            if ($paidAmount > 0) {
                Payment::create([
                    'payable_type' => Sale::class,
                    'payable_id' => $sale->id,
                    'amount' => $paidAmount,
                    'method' => $paymentMethods[array_rand($paymentMethods)],
                    'received_by' => $cashier->id,
                    'paid_at' => $date,
                ]);
            }
        }
    }

    /** Splits a total into [paidAmount, dueAmount] for a given payment_status. */
    private function splitPayment(float $total, string $paymentStatus): array
    {
        return match ($paymentStatus) {
            'paid' => [$total, 0],
            'partial' => (function () use ($total) {
                $paid = round($total * random_int(30, 70) / 100, 2);

                return [$paid, round($total - $paid, 2)];
            })(),
            default => [0, $total], // 'due'
        };
    }

    /**
     * Walks every product's collected movements in chronological order,
     * starting from its currently-seeded current_stock, and writes the
     * real stock_movements rows plus the final resting current_stock.
     */
    private function applyLedgerToStock($products): void
    {
        foreach ($products as $product) {
            $events = $this->ledger[$product->id] ?? [];
            if (empty($events)) {
                continue;
            }

            usort($events, fn ($a, $b) => $a['date'] <=> $b['date']);

            $balance = $product->current_stock;

            foreach ($events as $event) {
                $delta = $event['qty'] * $event['direction'];
                // Demo data only: never let the ledger show negative
                // stock, even if a sale would have oversold a product.
                $balance = max(0, $balance + $delta);

                StockMovement::create([
                    'product_id' => $product->id,
                    'type' => $event['type'],
                    'quantity' => $event['qty'],
                    'balance_after' => $balance,
                    'reference_type' => $event['reference_type'],
                    'reference_id' => $event['reference_id'],
                    'user_id' => $event['user_id'],
                ]);
            }

            $product->update(['current_stock' => $balance]);
        }
    }
}
