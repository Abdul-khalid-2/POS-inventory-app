/* Notifications View — placeholder, to be built out next */

registerView('notifications', function() {
  breadcrumb([{ label: 'Home', view: 'dashboard' }, { label: 'Notifications' }]);
  document.getElementById('content').innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div><h1 class="page-title">Notifications</h1><div class="subtitle">This module is coming soon</div></div>
    </div>
    <div class="card">
      <div class="card-body text-center py-5 text-muted">
        <i class="bi bi-bell display-4 d-block mb-3"></i>
        <p class="mb-0">The Notifications screen hasn't been built out yet. It's wired into navigation and routing so it's ready to fill in next.</p>
      </div>
    </div>
  `;
});
