<!doctype html>
<html lang="en" data-bs-theme="light">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sign In — NovaPOS</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" />
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="{{ asset('assets/css/style.css') }}" />
  </head>
  <body>
    <div class="login-wrapper">
      <div class="login-card">
        <div class="login-logo"><i class="bi bi-bag-check-fill"></i></div>
        <h2 class="text-center fw-700 mb-1">Welcome to NovaPOS</h2>
        <p class="text-center text-muted mb-4">Sign in to your account to continue</p>

        @if ($errors->any())
          <div class="alert alert-danger py-2 small mb-3">
            {{ $errors->first() }}
          </div>
        @endif

        <form method="POST" action="{{ route('login') }}" novalidate>
          @csrf
          <div class="mb-3">
            <label class="form-label">Email</label>
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-person"></i></span>
              <input
                type="email"
                name="email"
                class="form-control @error('email') is-invalid @enderror"
                placeholder="admin@novapos.com"
                value="{{ old('email', 'admin@novapos.com') }}"
                required
                autofocus
              />
              <div class="invalid-feedback">Please enter a valid email.</div>
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-lock"></i></span>
              <input
                type="password"
                name="password"
                id="loginPassword"
                class="form-control @error('password') is-invalid @enderror"
                placeholder="Enter password"
                value="demo1234"
                required
              />
              <button class="btn btn-outline-secondary" type="button" id="togglePass"><i class="bi bi-eye"></i></button>
              <div class="invalid-feedback">Please enter your password.</div>
            </div>
          </div>
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" name="remember" id="rememberMe" checked />
              <label class="form-check-label" for="rememberMe">Remember me</label>
            </div>
            <a href="#" class="text-decoration-none small" title="Not wired up yet — no email sending configured">Forgot password?</a>
          </div>
          <button type="submit" class="btn btn-primary w-100 py-2 fw-600">Sign In</button>
        </form>

        <div class="text-center mt-4">
          <p class="text-muted small mb-0">Demo credentials are pre-filled. Just click Sign In.</p>
          <p class="text-muted small mb-0">Any seeded user works with password <code>demo1234</code>.</p>
        </div>
      </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script>
      document.getElementById('togglePass').addEventListener('click', () => {
        const inp = document.getElementById('loginPassword');
        const icon = document.querySelector('#togglePass i');
        if (inp.type === 'password') { inp.type = 'text'; icon.className = 'bi bi-eye-slash'; }
        else { inp.type = 'password'; icon.className = 'bi bi-eye'; }
      });
    </script>
  </body>
</html>
