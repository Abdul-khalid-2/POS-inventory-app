<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Show the login form. NovaPOS's own JS/CSS renders the visual
     * "login-card" — this is now a real, server-rendered page rather
     * than a client-side gate inside the SPA shell.
     */
    public function showLoginForm()
    {
        return view('auth.login');
    }

    /**
     * Attempt to log the user in.
     */
    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $remember = $request->boolean('remember');

        if (! Auth::attempt($credentials, $remember)) {
            throw ValidationException::withMessages([
                'email' => 'Those credentials don\'t match an account.',
            ]);
        }

        // A deactivated staff account (see UserSeeder — Tom Cashier is
        // seeded inactive) should never get a live session.
        if (Auth::user()->status !== 'active') {
            Auth::logout();

            throw ValidationException::withMessages([
                'email' => 'This account has been deactivated. Contact an administrator.',
            ]);
        }

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    }

    /**
     * Log the user out.
     */
    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
