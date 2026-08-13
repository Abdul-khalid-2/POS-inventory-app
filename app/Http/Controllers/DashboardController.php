<?php

namespace App\Http\Controllers;

class DashboardController extends Controller
{
    /**
     * Render the NovaPOS app shell with the "dashboard" screen active.
     * The shell is a single Blade view; NovaPOS's own JS renders the
     * screen content client-side once the (mock) login gate passes.
     */
    public function index()
    {
        return view('app', [
            'view' => 'dashboard',
            'title' => 'Dashboard — NovaPOS',
        ]);
    }
}
