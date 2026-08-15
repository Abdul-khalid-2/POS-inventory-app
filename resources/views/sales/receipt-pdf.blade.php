<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Receipt {{ $sale->invoice_no }}</title>
    <style>
      /* dompdf only supports a fairly old CSS box model — no flexbox,
         no grid, no CSS variables. Tables and floats only. */
      body { font-family: Helvetica, Arial, sans-serif; font-size: 11px; color: #1e293b; margin: 0; padding: 30px 40px; }
      .header { text-align: center; margin-bottom: 20px; }
      .header h1 { font-size: 20px; margin: 0 0 4px; color: #4f46e5; }
      .header .muted { color: #64748b; font-size: 10px; }
      .meta-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
      .meta-table td { padding: 3px 0; vertical-align: top; }
      .meta-table .label { color: #64748b; width: 90px; }
      .meta-table .right { text-align: right; }
      table.items { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
      table.items th { background: #f1f5f9; text-align: left; padding: 6px 8px; font-size: 10px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; }
      table.items td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; }
      table.items .right { text-align: right; }
      table.totals { width: 260px; float: right; border-collapse: collapse; }
      table.totals td { padding: 4px 0; }
      table.totals .right { text-align: right; }
      table.totals .grand td { border-top: 2px solid #1e293b; font-weight: bold; font-size: 13px; padding-top: 8px; }
      .clear { clear: both; }
      .payments { margin-top: 20px; }
      .payments h3 { font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 6px; }
      .due-notice { margin-top: 16px; padding: 8px 12px; background: #fef3c7; border: 1px solid #fde68a; font-size: 11px; }
      .footer { margin-top: 40px; text-align: center; color: #94a3b8; font-size: 10px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>NovaPOS</h1>
      <div class="muted">Point of Sale &amp; Inventory</div>
    </div>

    <table class="meta-table">
      <tr>
        <td class="label">Invoice</td>
        <td>{{ $sale->invoice_no }}</td>
        <td class="label right">Date</td>
        <td class="right">{{ $sale->sale_date->format('M j, Y g:i A') }}</td>
      </tr>
      <tr>
        <td class="label">Customer</td>
        <td>{{ $sale->customer?->name ?? 'Walk-in Customer' }}</td>
        <td class="label right">Served by</td>
        <td class="right">{{ $sale->cashier?->name ?? '—' }}</td>
      </tr>
    </table>

    <table class="items">
      <thead>
        <tr>
          <th>Item</th>
          <th class="right">Qty</th>
          <th class="right">Unit Price</th>
          <th class="right">Tax</th>
          <th class="right">Total</th>
        </tr>
      </thead>
      <tbody>
        @foreach ($sale->items as $item)
          <tr>
            <td>{{ $item->product?->name ?? 'Unknown product' }}<br><span style="color:#94a3b8;font-size:9px;">{{ $item->product?->sku }}</span></td>
            <td class="right">{{ $item->quantity }}</td>
            <td class="right">${{ number_format($item->unit_price, 2) }}</td>
            <td class="right">${{ number_format($item->tax, 2) }}</td>
            <td class="right">${{ number_format($item->line_total, 2) }}</td>
          </tr>
        @endforeach
      </tbody>
    </table>

    <table class="totals">
      <tr><td>Subtotal</td><td class="right">${{ number_format($sale->subtotal, 2) }}</td></tr>
      <tr><td>Discount</td><td class="right">-${{ number_format($sale->discount, 2) }}</td></tr>
      <tr><td>Tax</td><td class="right">${{ number_format($sale->tax_total, 2) }}</td></tr>
      <tr class="grand"><td>Total</td><td class="right">${{ number_format($sale->grand_total, 2) }}</td></tr>
    </table>
    <div class="clear"></div>

    @if ($sale->payments->isNotEmpty())
      <div class="payments">
        <h3>Payments</h3>
        <table class="meta-table">
          @foreach ($sale->payments as $payment)
            <tr>
              <td style="text-transform:capitalize;">{{ $payment->method }}</td>
              <td class="right">${{ number_format($payment->amount, 2) }}</td>
            </tr>
          @endforeach
        </table>
      </div>
    @endif

    @if ($sale->due_amount > 0)
      <div class="due-notice">
        <strong>Balance Due: ${{ number_format($sale->due_amount, 2) }}</strong>
        @if ($sale->customer)
          — added to {{ $sale->customer->name }}'s account balance.
        @endif
      </div>
    @endif

    <div class="footer">
      Thank you for your business!
    </div>
  </body>
</html>
