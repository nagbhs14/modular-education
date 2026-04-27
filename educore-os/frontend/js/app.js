// Subdomain Routing & Multi-Tenant Frontend Logic
const host = window.location.hostname;
let subdomain = null;

// Determine if we are on a subdomain (e.g., springfield.localhost -> springfield)
if (host.includes('.')) {
    const parts = host.split('.');
    if (parts[0] !== 'www' && parts[0] !== 'localhost') {
        subdomain = parts[0];
    }
}

// API CONFIG
// To support subdomains locally, we call the API on the exact same host/subdomain but port 3000.
// If the frontend is springfield.localhost:5500, the API is springfield.localhost:3000
const API_BASE = `http://${host}:3000`; 

// If global host, API is just localhost:3000
const GLOBAL_API = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    if (!subdomain) {
        initGlobalView();
    } else {
        initTenantPortal();
    }
});

/* ================================
   GLOBAL VIEW (Shopify model)
   ================================*/
async function initGlobalView() {
    document.getElementById('global-view').classList.remove('hidden');
    loadTenants();

    document.getElementById('create-tenant-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('t-name').value;
        const sub = document.getElementById('t-subdomain').value;
        const msgBox = document.getElementById('t-message');

        try {
            const res = await fetch(`${GLOBAL_API}/tenants`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, subdomain: sub })
            });
            const data = await res.json();
            
            if (res.ok) {
                msgBox.innerHTML = `<span style="color: #4ade80;">Success! Generating your campus...</span>`;
                // Redirect to the new subdomain's port (assumes frontend is on port window.location.port or standard)
                const port = window.location.port ? `:${window.location.port}` : '';
                setTimeout(() => {
                    window.location.href = `http://${sub}.localhost${port}`;
                }, 1500);
            } else {
                msgBox.innerHTML = `<span style="color: #ef4444;">${data.error}</span>`;
            }
        } catch (e) {
            msgBox.innerHTML = `<span style="color: #ef4444;">API Error: Make sure backend is running.</span>`;
        }
    });
}

async function loadTenants() {
    try {
        const res = await fetch(`${GLOBAL_API}/tenants`);
        const tenants = await res.json();
        const container = document.getElementById('tenant-list');
        container.innerHTML = '';
        
        tenants.forEach(t => {
            const port = window.location.port ? `:${window.location.port}` : '';
            const tenantUrl = `http://${t.subdomain}.localhost${port}`;
            container.innerHTML += `
                <div class="card glass">
                    <h3>${t.name}</h3>
                    <p style="color: var(--text-secondary); font-size: 0.9em;">${t.subdomain}.educore.os</p>
                    <a href="${tenantUrl}" class="btn outline" style="margin-top: 15px; display: inline-block; width: 100%; text-align: center; text-decoration: none;">Go to Portal</a>
                </div>
            `;
        });
    } catch(e) {
        document.getElementById('tenant-list').innerHTML = '<p>Could not load institutions. Ensure backend is running.</p>';
    }
}

/* ================================
   TENANT PORTAL VIEW
   ================================*/
function initTenantPortal() {
    document.getElementById('tenant-view').classList.remove('hidden');
    document.getElementById('school-logo').innerText = `${subdomain.toUpperCase()} CAMPUS`;

    const token = localStorage.getItem(`auth_${subdomain}`);
    
    if (token) {
        showDashboard(token);
    } else {
        document.getElementById('login-form').addEventListener('submit', handleLogin);
    }

    document.getElementById('btn-logout').addEventListener('click', () => {
        localStorage.removeItem(`auth_${subdomain}`);
        window.location.reload();
    });
}

async function handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById('login-username').value;
    const pass = document.getElementById('login-password').value;
    const errBox = document.getElementById('login-error');

    try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem(`auth_${subdomain}`, data.token);
            window.location.reload();
        } else {
            errBox.innerText = data.error;
        }
    } catch (err) {
        errBox.innerText = 'Network error. Ensure backend is running.';
    }
}

async function showDashboard(token) {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
    document.getElementById('btn-logout').classList.remove('hidden');

    try {
        // Fetch Dashboard details specifically scoped to this tenant
        const res = await fetch(`${API_BASE}/api/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (!res.ok) {
            localStorage.removeItem(`auth_${subdomain}`);
            window.location.reload();
            return;
        }

        document.getElementById('school-logo').innerText = data.message.split(' (')[0].replace('Welcome to ', '');
        document.getElementById('welcome-msg').innerText = "Dashboard Overview";

        // Render enabled modules dynamically (simulating apps/plugins)
        const modulesBox = document.getElementById('modules-container');
        data.activeModules.forEach(mod => {
            if (mod === 'auth') return; // Core, ignore
            
            // Map module names to friendly names
            const map = {
                'sis': 'Student Info System (SIS)',
                'attendance': 'Attendance Module',
                'lms': 'Learning Management',
                'communication': 'Announcements'
            };

            modulesBox.innerHTML += `
                <div class="card glass">
                    <h3 style="margin-bottom: 15px; color: var(--accent-primary);">${map[mod] || mod}</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 20px;">Manage your ${mod} data easily securely isolated for your institution.</p>
                    <button class="btn primary w-full" onclick="alert('Accessing ${mod}. Check API calls for prototype limits.')">Open Module</button>
                </div>
            `;
        });

    } catch(err) {
        console.error(err);
    }
}
