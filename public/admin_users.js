// =====================================================
// Admin User Management Logic - admin_users.js
// =====================================================

document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
    injectSidebar();
    initTheme();
    initBackground();
    loadUsers();

    // Live search
    const searchEl = document.getElementById('userSearch');
    if (searchEl) searchEl.addEventListener('input', debounce(loadUsers, 500));
});

function loadUsers() {
    const search = document.getElementById('userSearch') ? document.getElementById('userSearch').value : '';
    const roleFilter = document.getElementById('roleFilter') ? document.getElementById('roleFilter').value : 'all';
    
    fetch(`/api/admin/users?search=${encodeURIComponent(search)}&role=${roleFilter}`)
        .then(res => res.json())
        .then(users => {
            const grid = document.getElementById('userGrid');
            if (!grid) return;
            
            // Filter out Admins from the display
            const filteredUsers = users.filter(u => u.role !== 'admin');

            if (filteredUsers.length === 0) {
                grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:100px; color:#666; font-family:\'Orbitron\';">NO USERS FOUND MATCHING CRITERIA</div>';
                return;
            }

            grid.innerHTML = filteredUsers.map(user => {
                const date = new Date(user.createdAt).toLocaleDateString();
                const statusColor = user.status === 'active' ? 'var(--neon-green)' : '#ff4444';
                const name = user.email.split('@')[0].toUpperCase();

                return `
                <div class="user-card glass-panel">
                    <div class="card-header">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00ff88&color=000&bold=true" class="avatar">
                        <div class="user-info">
                            <h3>${name}</h3>
                            <p>${user.email}</p>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="meta-row">
                            <span class="meta-label">ROLE</span>
                            <span class="meta-value" style="color: var(--neon-green); letter-spacing:1px;">${user.role.toUpperCase()}</span>
                        </div>
                        <div class="meta-row">
                            <span class="meta-label">STATUS</span>
                            <span style="color:${statusColor}; font-weight:bold; font-size:11px; letter-spacing:1px;">${user.status.toUpperCase()}</span>
                        </div>
                        <div class="meta-row">
                            <span class="meta-label">JOINED</span>
                            <span style="color:#888; font-size:11px;">${date}</span>
                        </div>
                        <div class="card-actions">
                            <button onclick="toggleUserStatus('${user._id}', '${user.status}')" class="glow-button sm ${user.status === 'active' ? 'outline' : ''}" style="border-color: ${user.status === 'active' ? '#ffaa00' : 'var(--neon-green)'}; color: ${user.status === 'active' ? '#ffaa00' : 'var(--neon-green)'};">
                                ${user.status === 'active' ? 'BLOCK' : 'UNBLOCK'}
                            </button>
                            <button onclick="deleteUser('${user._id}', '${user.email}')" class="glow-button sm" style="border-color: #ff3e3e; color: #ff3e3e;">
                                DELETE
                            </button>
                        </div>
                    </div>
                </div>`;
            }).join('');
        })
        .catch(err => {
            console.error('Failed to load users:', err);
            showToast('Failed to load users', 'error');
        });
}

function toggleUserStatus(id, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    const action = newStatus === 'active' ? 'UNBLOCK' : 'BLOCK';

    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast(`User ${newStatus === 'active' ? 'unblocked' : 'blocked'} successfully`);
            loadUsers();
        } else {
            showToast(data.error || 'Update failed', 'error');
        }
    })
    .catch(err => showToast('Connection error', 'error'));
}

function deleteUser(id, email) {
    if (!confirm(`CRITICAL ACTION: Permanently delete user ${email}?\n\nThis cannot be undone.`)) return;

    fetch(`/api/admin/users/${id}`, {
        method: 'DELETE'
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('User account deleted permanently');
            loadUsers();
        } else {
            showToast(data.error || 'Deletion failed', 'error');
        }
    })
    .catch(err => showToast('Connection error', 'error'));
}

function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}
