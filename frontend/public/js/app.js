// Global variables
let authToken = localStorage.getItem('authToken');
let currentUser = null;
let websocket = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    if (authToken) {
        checkAuth();
    } else {
        showSection('login');
    }
});

// Section navigation
function showSection(sectionName) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    
    const targetSection = document.getElementById(`${sectionName}Section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

// Authentication
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            
            showMessage('loginMessage', 'Login successful!', 'success');
            setTimeout(() => {
                updateNavigation();
                showSection('home');
            }, 500);
        } else {
            showMessage('loginMessage', data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('loginMessage', 'Network error. Please try again.', 'error');
    }
}

async function checkAuth() {
    try {
        const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            currentUser = await response.json();
            updateNavigation();
            showSection('home');
        } else {
            logout();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        logout();
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    updateNavigation();
    showSection('login');
    if (websocket) {
        websocket.close();
    }
}

function updateNavigation() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminBtn = document.getElementById('adminBtn');
    
    if (authToken && currentUser) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        
        if (currentUser.isAdmin) {
            adminBtn.style.display = 'block';
        }
    } else {
        loginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        adminBtn.style.display = 'none';
    }
}

// Proxy functionality
async function handleProxyRequest(event) {
    event.preventDefault();
    
    const targetUrl = document.getElementById('targetUrl').value;
    const method = document.getElementById('method').value;
    
    try {
        const response = await fetch('/api/proxy/forward', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ targetUrl, method })
        });
        
        const responseBox = document.getElementById('proxyResponse');
        
        if (response.ok) {
            const contentType = response.headers.get('content-type');
            let responseData;
            
            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
                responseBox.innerHTML = `<pre>${JSON.stringify(responseData, null, 2)}</pre>`;
            } else {
                responseData = await response.text();
                responseBox.innerHTML = `<pre>${escapeHtml(responseData.substring(0, 5000))}</pre>`;
            }
            
            responseBox.classList.add('active');
            showMessage('proxyMessage', 'Request completed successfully!', 'success');
            loadProxyStats();
        } else {
            const error = await response.json();
            showMessage('proxyMessage', error.error || 'Proxy request failed', 'error');
        }
    } catch (error) {
        console.error('Proxy error:', error);
        showMessage('proxyMessage', 'Network error. Please try again.', 'error');
    }
}

async function loadProxyStats() {
    try {
        const response = await fetch('/api/proxy/stats', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const stats = await response.json();
            document.getElementById('totalRequests').textContent = stats.totalRequests || 0;
            document.getElementById('activeConnections').textContent = stats.activeConnections || 0;
            document.getElementById('proxyErrors').textContent = stats.errors || 0;
        }
    } catch (error) {
        console.error('Error loading proxy stats:', error);
    }
}

// WebSocket Tunnel functionality
function connectTunnel() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
        websocket = new WebSocket(wsUrl);
        
        websocket.onopen = () => {
            addLog('Connected to tunnel', 'success');
            updateTunnelStatus(true);
        };
        
        websocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                addLog(`Received: ${data.type} - ${JSON.stringify(data)}`, 'success');
            } catch (error) {
                addLog(`Received: ${event.data}`, 'success');
            }
        };
        
        websocket.onerror = (error) => {
            addLog('WebSocket error occurred', 'error');
            console.error('WebSocket error:', error);
        };
        
        websocket.onclose = () => {
            addLog('Disconnected from tunnel', 'error');
            updateTunnelStatus(false);
        };
    } catch (error) {
        addLog(`Connection failed: ${error.message}`, 'error');
        console.error('WebSocket connection error:', error);
    }
}

function disconnectTunnel() {
    if (websocket) {
        websocket.close();
        websocket = null;
    }
}

function sendPing() {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        const message = { type: 'ping', timestamp: Date.now() };
        websocket.send(JSON.stringify(message));
        addLog('Sent ping', 'success');
    } else {
        addLog('Not connected', 'error');
    }
}

function updateTunnelStatus(connected) {
    const statusElement = document.getElementById('tunnelStatus');
    const connectBtn = document.getElementById('connectBtn');
    const disconnectBtn = document.getElementById('disconnectBtn');
    const pingBtn = document.getElementById('pingBtn');
    
    if (connected) {
        statusElement.textContent = 'Connected';
        statusElement.className = 'status-connected';
        connectBtn.disabled = true;
        disconnectBtn.disabled = false;
        pingBtn.disabled = false;
    } else {
        statusElement.textContent = 'Disconnected';
        statusElement.className = 'status-disconnected';
        connectBtn.disabled = false;
        disconnectBtn.disabled = true;
        pingBtn.disabled = true;
    }
}

function addLog(message, type = '') {
    const logElement = document.getElementById('tunnelLog');
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = `[${timestamp}] ${message}`;
    logElement.appendChild(logEntry);
    logElement.scrollTop = logElement.scrollHeight;
}

// Admin functionality
async function loadSystemStats() {
    try {
        const response = await fetch('/api/admin/stats', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const stats = await response.json();
            displaySystemStats(stats);
        } else {
            const error = await response.json();
            alert(error.error || 'Failed to load system stats');
        }
    } catch (error) {
        console.error('Error loading system stats:', error);
        alert('Network error. Please try again.');
    }
}

function displaySystemStats(stats) {
    const statsContainer = document.getElementById('systemStats');
    statsContainer.innerHTML = `
        <div class="stat-item">
            <div class="stat-label">Version</div>
            <div class="stat-value">${stats.version}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Environment</div>
            <div class="stat-value">${stats.environment}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Uptime</div>
            <div class="stat-value">${stats.uptime.formatted}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Platform</div>
            <div class="stat-value">${stats.platform}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Node Version</div>
            <div class="stat-value">${stats.nodeVersion}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Memory (RSS)</div>
            <div class="stat-value">${stats.memory.rss}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Heap Used</div>
            <div class="stat-value">${stats.memory.heapUsed}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Heap Total</div>
            <div class="stat-value">${stats.memory.heapTotal}</div>
        </div>
    `;
}

async function loadServerConfig() {
    try {
        const response = await fetch('/api/admin/config', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const config = await response.json();
            displayServerConfig(config);
        } else {
            const error = await response.json();
            alert(error.error || 'Failed to load server config');
        }
    } catch (error) {
        console.error('Error loading server config:', error);
        alert('Network error. Please try again.');
    }
}

function displayServerConfig(config) {
    const configContainer = document.getElementById('serverConfig');
    configContainer.innerHTML = `
        <div class="stat-item">
            <div class="stat-label">Port</div>
            <div class="stat-value">${config.port}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Environment</div>
            <div class="stat-value">${config.environment}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">SSL Enabled</div>
            <div class="stat-value">${config.sslEnabled ? 'Yes' : 'No'}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Max Connections</div>
            <div class="stat-value">${config.maxConnections}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Proxy Timeout</div>
            <div class="stat-value">${config.proxyTimeout}ms</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Rate Limit Window</div>
            <div class="stat-value">${config.rateLimitWindow}ms</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Rate Limit Max</div>
            <div class="stat-value">${config.rateLimitMax}</div>
        </div>
    `;
}

function showAdminTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    const buttons = document.querySelectorAll('.tab-btn');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    buttons.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`${tabName}Tab`).classList.add('active');
    event.target.classList.add('active');
}

// Utility functions
function showMessage(elementId, message, type) {
    const messageElement = document.getElementById(elementId);
    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
    
    setTimeout(() => {
        messageElement.className = 'message';
    }, 5000);
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
