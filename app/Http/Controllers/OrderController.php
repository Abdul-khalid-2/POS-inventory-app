<?php

namespace App\Http\Controllers;

class OrderController extends Controller
{
    /**
     * Render the NovaPOS app shell with the "orders" screen active.
     * The shell is a single Blade view; NovaPOS's own JS renders the
     * screen content client-side once the (mock) login gate passes.
     */
    public function index()
    {
        return view('app', [
            'view' => 'orders',
            'title' => 'Orders — NovaPOS',
        ]);
    }
}
