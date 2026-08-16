<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PurchaseResource;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PurchaseController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('module:purchases', only: ['index', 'show']),
            new Middleware('module:purchases,add', only: ['store']),
            new Middleware('module:purchases,edit', only: ['receive']),
        ];
    }

    /**
     * GET /catalog/purchases
     * Supports: q (PO number or supplier name), status.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Purchase::query()->withCount('items')->with(['supplier', 'creator']);

        if ($search = $request->string('q')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('po_no', 'like', "%{$search}%")
                    ->orWhereHas('supplier', fn ($s) => $s->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status') && $request->string('status')->value() !== 'all') {
            $query->where('status', $request->string('status'));
        }

        $purchases = $query->latest('purchase_date')->paginate($request->integer('per_page', 10));

        return PurchaseResource::collection($purchases)->response();
    }

    public function show(Purchase $purchase): JsonResponse
    {
        return (new PurchaseResource($purchase->load(['supplier', 'creator', 'items.product.unit'])))->response();
    }

    /**
     * POST /catalog/purchases — creates a purchase order.
     *
     * Same principle as checkout: only product_id + quantity come
     * from the client. unit_cost is always the product's real current
     * cost_price, never a client-submitted number. Starts as a
     * 'draft' PO — no stock moves and nothing is owed to the supplier
     * until goods are actually received (see receive() below).
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'expected_date' => ['nullable', 'date'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'distinct', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'discount' => ['nullable', 'numeric', 'min:0'],
        ]);

        $products = Product::with('tax')
            ->whereIn('id', collect($data['items'])->pluck('product_id'))
            ->get()
            ->keyBy('id');

        $lines = [];
        $subtotal = 0;
        foreach ($data['items'] as $item) {
            $product = $products[$item['product_id']];
            $unitCost = (float) $product->cost_price;
            $lineSubtotal = round($unitCost * $item['quantity'], 2);

            $lines[] = [
                'product' => $product,
                'quantity' => $item['quantity'],
                'unit_cost' => $unitCost,
                'line_subtotal' => $lineSubtotal,
                'tax_rate' => (float) ($product->tax?->rate ?? 0),
            ];
            $subtotal += $lineSubtotal;
        }

        $discountAmount = round(min($data['discount'] ?? 0, $subtotal), 2);

        // Same proportional-discount, per-line-tax-rate math as
        // SaleController — a product's tax rate applies the same way
        // whether it's being bought or sold.
        $taxTotal = 0;
        foreach ($lines as &$line) {
            $discountShare = $subtotal > 0 ? ($line['line_subtotal'] / $subtotal) * $discountAmount : 0;
            $line['tax'] = round(($line['line_subtotal'] - $discountShare) * $line['tax_rate'] / 100, 2);
            $line['line_total'] = round($line['line_subtotal'] + $line['tax'], 2);
            $taxTotal += $line['tax'];
        }
        unset($line);

        $grandTotal = round($subtotal - $discountAmount + $taxTotal, 2);

        $purchase = DB::transaction(function () use ($data, $lines, $subtotal, $discountAmount, $taxTotal, $grandTotal, $request) {
            $purchase = Purchase::create([
                'po_no' => $this->nextPoNo(),
                'supplier_id' => $data['supplier_id'],
                'user_id' => $request->user()->id,
                'purchase_date' => now(),
                'expected_date' => $data['expected_date'] ?? null,
                'subtotal' => round($subtotal, 2),
                'discount' => $discountAmount,
                'tax_total' => round($taxTotal, 2),
                'grand_total' => $grandTotal,
                'paid_amount' => 0,
                'due_amount' => $grandTotal,
                'status' => 'draft',
                'payment_status' => 'due',
            ]);

            foreach ($lines as $line) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $line['product']->id,
                    'quantity' => $line['quantity'],
                    'received_quantity' => 0,
                    'unit_cost' => $line['unit_cost'],
                    'tax' => $line['tax'],
                    'line_total' => $line['line_total'],
                ]);
            }

            return $purchase;
        });

        return (new PurchaseResource($purchase->load(['supplier', 'creator', 'items.product.unit'])))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * POST /catalog/purchases/{purchase}/receive — the Goods Received
     * Note. Supports partial receiving: `quantity` per item is how
     * much arrived in *this* delivery, not the running total, and can
     * be less than what's still outstanding — the purchase can be
     * received across more than one GRN, with status tracking
     * draft/ordered → partially_received → received automatically.
     */
    public function receive(Request $request, Purchase $purchase): JsonResponse
    {
        if (in_array($purchase->status, ['received', 'cancelled'], true)) {
            abort(422, "This purchase order is already {$purchase->status} and can't receive more goods.");
        }

        $data = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.purchase_item_id' => ['required', 'distinct', 'exists:purchase_items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:0'],
        ]);

        DB::transaction(function () use ($data, $purchase, $request) {
            $purchaseItems = PurchaseItem::where('purchase_id', $purchase->id)
                ->whereIn('id', collect($data['items'])->pluck('purchase_item_id'))
                ->get()
                ->keyBy('id');

            foreach ($data['items'] as $item) {
                $qty = $item['quantity'];
                if ($qty <= 0) {
                    continue; // nothing delivered for this line this time
                }

                $purchaseItem = $purchaseItems[$item['purchase_item_id']];
                $outstanding = $purchaseItem->quantity - $purchaseItem->received_quantity;

                if ($qty > $outstanding) {
                    throw ValidationException::withMessages([
                        'items' => "Can't receive {$qty} of {$purchaseItem->product->name} — only {$outstanding} still outstanding on this order.",
                    ]);
                }

                $product = Product::whereKey($purchaseItem->product_id)->lockForUpdate()->first();
                $newStock = $product->current_stock + $qty;
                $product->update(['current_stock' => $newStock]);

                StockMovement::create([
                    'product_id' => $product->id,
                    'type' => 'purchase_in',
                    'quantity' => $qty,
                    'balance_after' => $newStock,
                    'reference_type' => Purchase::class,
                    'reference_id' => $purchase->id,
                    'user_id' => $request->user()->id,
                ]);

                $purchaseItem->update(['received_quantity' => $purchaseItem->received_quantity + $qty]);
            }

            // Receiving only ever increases stock, which can't cross a
            // product *into* low/out-of-stock territory — no
            // StockNotifier call needed here (it only fires on a
            // decrease crossing a threshold; see app/Services/StockNotifier.php).
            $fresh = $purchase->fresh('items');
            $allReceived = $fresh->items->every(fn ($i) => $i->received_quantity >= $i->quantity);
            $anyReceived = $fresh->items->contains(fn ($i) => $i->received_quantity > 0);

            $purchase->update([
                'status' => $allReceived ? 'received' : ($anyReceived ? 'partially_received' : $purchase->status),
            ]);
        });

        return (new PurchaseResource($purchase->fresh()->load(['supplier', 'creator', 'items.product.unit'])))->response();
    }

    /**
     * NOTE: same known limitation as Sale's nextInvoiceNo() — loads
     * every po_no into memory. Fine at today's scale.
     */
    private function nextPoNo(): string
    {
        $last = Purchase::query()
            ->get(['po_no'])
            ->map(fn ($p) => (int) substr($p->po_no, 3))
            ->max() ?? 499;

        return 'PO-' . ($last + 1);
    }
}
