<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Symfony\Component\HttpFoundation\Response;

class SaleReceiptController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('module:pos'),
        ];
    }

    /**
     * GET /sales/{sale}/receipt — streams a real PDF inline (opens in
     * the browser's own PDF viewer, which has its own save/print
     * controls) rather than forcing a download. Separate from the
     * narrow thermal-receipt print in pos.js — this is a proper
     * full-page invoice document meant for records or emailing, not
     * for a register printer.
     */
    public function show(Sale $sale): Response
    {
        $sale->load(['customer', 'cashier', 'items.product', 'payments']);

        $pdf = Pdf::loadView('sales.receipt-pdf', ['sale' => $sale]);

        return $pdf->stream("receipt-{$sale->invoice_no}.pdf");
    }
}
