<!doctype html>
<html lang="en" data-bs-theme="light">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Access Denied — NovaPOS</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" />
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="{{ asset('assets/css/style.css') }}" />
  </head>
  <body>
    <div class="login-wrapper">
      <div class="login-card text-center">
        <div class="login-logo login-logo-danger"><i class="bi bi-shield-lock"></i></div>
        <h2 class="fw-700 mb-1">Access Denied</h2>
        <p class="text-muted mb-4">
          {{ $exception->getMessage() ?: "Your role doesn't have access to this section." }}
        </p>
        @auth
          <p class="text-muted small mb-4">
            Signed in as <strong>{{ auth()->user()->name }}</strong>
            ({{ auth()->user()->role?->name ?? 'No role assigned' }}).
            If this looks wrong, ask an administrator to check your permissions.
          </p>
        @endauth
        <a href="{{ route('dashboard') }}" class="btn btn-primary w-100 py-2 fw-600">
          <i class="bi bi-speedometer2 me-1"></i> Back to Dashboard
        </a>
      </div>
    </div>
  </body>
</html>
