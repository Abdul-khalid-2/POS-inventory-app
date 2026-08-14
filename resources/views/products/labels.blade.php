<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Barcode Labels — NovaPOS</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 16px; background: #f1f1f4; }
      .toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
      .toolbar button { font: inherit; padding: 8px 16px; border-radius: 6px; border: 1px solid #4f46e5; background: #4f46e5; color: #fff; cursor: pointer; }
      .toolbar button:hover { background: #4338ca; }
      .toolbar a { color: #4f46e5; text-decoration: none; font-size: 14px; }
      .empty { text-align: center; color: #888; padding: 60px 0; }

      .sheet {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }
      .label {
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 8px;
        text-align: center;
        width: 2.5in;
        height: 1.3in;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        overflow: hidden;
      }
      .label .name { font-size: 11px; font-weight: 700; line-height: 1.2; max-height: 26px; overflow: hidden; margin-bottom: 2px; }
      .label .price { font-size: 13px; font-weight: 800; margin-top: 2px; }
      .label .sku { font-size: 9px; color: #666; letter-spacing: 0.5px; margin-top: 1px; }
      .label .no-barcode { font-size: 9px; color: #b91c1c; margin: 4px 0; }
      .label svg { max-width: 100%; height: 40px; }

      @media print {
        body { background: #fff; padding: 0; }
        .toolbar { display: none; }
        .label { border: 1px dashed #999; break-inside: avoid; }
        .sheet { gap: 4mm; }
      }
    </style>
  </head>
  <body>
    <div class="toolbar">
      <a href="{{ route('products') }}">&larr; Back to Products</a>
      @if ($products->isNotEmpty())
        <button onclick="window.print()"><i>🖨</i> Print Labels</button>
      @endif
    </div>

    @if ($products->isEmpty())
      <div class="empty">No products found for the given IDs.</div>
    @else
      <div class="sheet">
        @foreach ($products as $product)
          <div class="label">
            <div class="name">{{ $product->name }}</div>
            @if ($product->barcode)
              <svg class="barcode" data-code="{{ $product->barcode }}"></svg>
            @else
              <div class="no-barcode">No barcode set</div>
            @endif
            <div class="price">${{ number_format($product->sale_price, 2) }}</div>
            <div class="sku">{{ $product->sku }}</div>
          </div>
        @endforeach
      </div>
    @endif

    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
    <script>
      document.querySelectorAll('svg.barcode').forEach(el => {
        try {
          JsBarcode(el, el.dataset.code, {
            format: 'ean13',
            width: 1.4,
            height: 40,
            fontSize: 11,
            margin: 0,
          });
        } catch (e) {
          // Not a valid EAN-13 (e.g. a legacy/manufacturer barcode of a
          // different length) — fall back to Code128, which accepts
          // any string.
          JsBarcode(el, el.dataset.code, { format: 'CODE128', width: 1.4, height: 40, fontSize: 11, margin: 0 });
        }
      });
    </script>
  </body>
</html>
