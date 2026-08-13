<?php

namespace App\Http\Controllers;

class PosController extends Controller
{
    /**
     * Render the NovaPOS app shell with the "pos" screen active.
     * The shell is a single Blade view; NovaPOS's own JS renders the
     * screen content client-side once the (mock) login gate passes.
     */
    public function index()
    {
        return view('app', [
            'view' => 'pos',
            'title' => 'POS Terminal — NovaPOS',
        ]);
    }
}
