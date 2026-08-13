<?php

namespace App\Http\Controllers;

class ProductController extends Controller
{
    /**
     * Render the NovaPOS app shell with the "products" screen active.
     * The shell is a single Blade view; NovaPOS's own JS renders the
     * screen content client-side once the (mock) login gate passes.
     */
    public function index()
    {
        return view('app', [
            'view' => 'products',
            'title' => 'Products — NovaPOS',
        ]);
    }
}
