/* Login / Auth View */

registerView('login', function() {
  const html = `
    <div class="login-wrapper">
      <div class="login-card">
        <div class="login-logo"><i class="bi bi-bag-check-fill"></i></div>
        <h2 class="text-center fw-700 mb-1">Welcome to NovaPOS</h2>
        <p class="text-center text-muted mb-4">Sign in to your account to continue</p>
        <form id="loginForm" novalidate>
          <div class="mb-3">
            <label class="form-label">Email or Username</label>
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-person"></i></span>
              <input type="text" class="form-control" id="loginEmail" placeholder="admin@novapos.com" value="admin@novapos.com" required>
              <div class="invalid-feedback">Please enter your email or username.</div>
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-lock"></i></span>
              <input type="password" class="form-control" id="loginPassword" placeholder="Enter password" value="demo1234" required>
              <button class="btn btn-outline-secondary" type="button" id="togglePass"><i class="bi bi-eye"></i></button>
              <div class="invalid-feedback">Please enter your password.</div>
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label">Login as Role</label>
            <select class="form-select" id="loginRole">
              <option value="Admin">Admin</option>
              <option value="Cashier">Cashier</option>
              <option value="Accountant">Accountant</option>
              <option value="Manager">Manager</option>
            </select>
          </div>
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" id="rememberMe" checked>
              <label class="form-check-label" for="rememberMe">Remember me</label>
            </div>
            <a href="#" class="text-decoration-none small" id="forgotPass">Forgot password?</a>
          </div>
          <button type="submit" class="btn btn-primary w-100 py-2 fw-600">Sign In</button>
        </form>
        <div class="text-center mt-4">
          <p class="text-muted small mb-0">Demo credentials are pre-filled. Just click Sign In.</p>
        </div>
      </div>
    </div>`;
  document.getElementById('login-view').innerHTML = html;

  document.getElementById('togglePass').addEventListener('click', () => {
    const inp = document.getElementById('loginPassword');
    const icon = document.querySelector('#togglePass i');
    if (inp.type === 'password') { inp.type = 'text'; icon.className = 'bi bi-eye-slash'; }
    else { inp.type = 'password'; icon.className = 'bi bi-eye'; }
  });

  document.getElementById('forgotPass').addEventListener('click', e => {
    e.preventDefault();
    showToast('Password reset link sent to your email (demo)', 'info');
  });

  document.getElementById('loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPassword').value.trim();
    const role = document.getElementById('loginRole').value;
    let valid = true;
    if (!email) { document.getElementById('loginEmail').classList.add('is-invalid'); valid = false; }
    else document.getElementById('loginEmail').classList.remove('is-invalid');
    if (!pass) { document.getElementById('loginPassword').classList.add('is-invalid'); valid = false; }
    else document.getElementById('loginPassword').classList.remove('is-invalid');
    if (!valid) return;
    const btn = e.target.querySelector('button[type="submit"]');
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing in...';
    btn.disabled = true;
    setTimeout(() => login(email, role), 600);
  });
});
