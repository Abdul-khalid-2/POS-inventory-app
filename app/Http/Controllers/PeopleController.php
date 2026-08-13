<?php

namespace App\Http\Controllers;

class PeopleController extends Controller
{
    /**
     * Render the NovaPOS app shell with the "people" screen active.
     * The shell is a single Blade view; NovaPOS's own JS renders the
     * screen content client-side once the (mock) login gate passes.
     */
    public function index()
    {
        return view('app', [
            'view' => 'people',
            'title' => 'Customers & Suppliers — NovaPOS',
        ]);
    }
}
