/* ============================================================
   ROSE SOFTWARE — Main Script
   ============================================================ */

// ─── Notification System ──────────────────────────────────
let _prevStatuses = null; // snapshot from last poll
let _notifQueue = [];
let _isProcessingQueue = false;

const NOTIF_CONFIG = {
    online: { icon: 'fa-circle-check', color: '#22e87a', glow: 'rgba(34,232,122,0.35)', label: 'Now Online' },
    offline: { icon: 'fa-circle-xmark', color: '#ff3232', glow: 'rgba(255,50,50,0.35)', label: 'Went Offline' },
    bakim: { icon: 'fa-screwdriver-wrench', color: '#ffb400', glow: 'rgba(255,180,0,0.35)', label: 'Under Maintenance' },
    updating: { icon: 'fa-arrows-rotate', color: '#0096ff', glow: 'rgba(0,150,255,0.35)', label: 'Updating Now' },
    development: { icon: 'fa-code', color: '#9d50bb', glow: 'rgba(157,80,187,0.35)', label: 'In Development' },
    loaded: { icon: 'fa-rocket', color: '#ff3366', glow: 'rgba(255,51,102,0.35)', label: 'Loaded' },
};

const PRODUCT_METADATA = {
    'emulator': {
        desc: 'Disables and emulates Rivals Anticheat with no ban rate.',
        supported: '99 UNC'
    },
    'bypass': {
        desc: 'Bypasses Rivals Anticheat to play with cheats.',
        supported: '99 UNC'
    },
    'private': {
        desc: 'A slotted menu with so much and op features.',
        supported: '99 UNC'
    },
    'unlock all': {
        desc: 'Unlocks skins & wraps and charms with no detections or bans.',
        supported: '99 UNC'
    }
};

// ─── Last Online Tracking ─────────────────────────────────
let _lastOnlineTimes = JSON.parse(localStorage.getItem('rose_last_online') || '{}');

function updateLastOnline(product, status) {
    if (status === 'online') {
        _lastOnlineTimes[product.toLowerCase()] = Date.now();
        localStorage.setItem('rose_last_online', JSON.stringify(_lastOnlineTimes));
    }
}

function getRelativeTime(product) {
    const ts = _lastOnlineTimes[product.toLowerCase()];
    if (!ts) return 'Today';
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
}

async function processNotifQueue() {
    if (_isProcessingQueue || _notifQueue.length === 0) return;
    _isProcessingQueue = true;

    while (_notifQueue.length > 0) {
        const { product, oldStatus, newStatus } = _notifQueue.shift();
        actualShowNotification(product, oldStatus, newStatus);
        // Wait 300ms before showing the next one for a beautiful sequence
        await new Promise(r => setTimeout(r, 300));
    }

    _isProcessingQueue = false;
}

function showNotification(product, oldStatus, newStatus) {
    _notifQueue.push({ product, oldStatus, newStatus });
    processNotifQueue();
}

function actualShowNotification(product, oldStatus, newStatus) {
    const cfg = NOTIF_CONFIG[newStatus] || NOTIF_CONFIG['offline'];
    const container = document.getElementById('notif-container');
    if (!container) return;

    // Limit active notifications to 5
    const activeNotifs = container.querySelectorAll('.rose-notif:not(.notif-exit)');
    if (activeNotifs.length >= 5) {
        dismissNotif(activeNotifs[0]); // Dismiss the oldest one
    }

    const notif = document.createElement('div');
    notif.className = 'rose-notif';
    notif.style.setProperty('--notif-color', cfg.color);
    notif.style.setProperty('--notif-glow', cfg.glow);

    const displayName = product.charAt(0).toUpperCase() + product.slice(1);

    notif.innerHTML = `
        <div class="notif-icon-wrap">
            <i class="fa-solid ${cfg.icon}"></i>
        </div>
        <div class="notif-body">
            <span class="notif-product">${displayName}</span>
            <span class="notif-label">${cfg.label}</span>
        </div>
        <button class="notif-close" aria-label="Dismiss"><i class="fa-solid fa-xmark"></i></button>
        <div class="notif-progress"></div>
    `;

    container.appendChild(notif);

    // Animate in (slight delay so browser registers initial state)
    requestAnimationFrame(() => {
        requestAnimationFrame(() => notif.classList.add('notif-visible'));
    });

    // Close button
    notif.querySelector('.notif-close').addEventListener('click', () => dismissNotif(notif));

    // Auto-dismiss after 5s
    const timer = setTimeout(() => dismissNotif(notif), 5000);
    notif._timer = timer;
}

function dismissNotif(notif) {
    clearTimeout(notif._timer);
    notif.classList.remove('notif-visible');
    notif.classList.add('notif-exit');
    notif.addEventListener('transitionend', () => notif.remove(), { once: true });
}

// ─── Modal System ─────────────────────────────────────────
function openProductModal(productName, status) {
    const modal = document.getElementById('product-modal');
    const nameEl = document.getElementById('modal-product-name');
    const statusEl = document.getElementById('modal-product-status');
    const descEl = document.getElementById('modal-product-desc');

    const meta = PRODUCT_METADATA[productName.toLowerCase()] || {
        desc: 'Premium cheat solution for top-tier competitive play. Always undetected and optimized for performance.',
        stats: { updated: 'Today', system: 'Win 10/11' }
    };

    nameEl.textContent = productName.charAt(0).toUpperCase() + productName.slice(1);
    statusEl.textContent = status.toUpperCase();
    statusEl.className = `item-badge ${status}`;
    descEl.textContent = meta.desc || 'Premium rivals cheat solution.';
    
    const statUpdated = document.querySelector('.modal-stats .stat-item:nth-child(1) .stat-value');
    const statSystem = document.querySelector('.modal-stats .stat-item:nth-child(2) .stat-value');
    
    if (statUpdated) statUpdated.textContent = getRelativeTime(productName);
    if (statSystem) statSystem.textContent = meta.supported || '99 UNC';

    modal.classList.add('active');
}

function closeProductModal() {
    document.getElementById('product-modal').classList.remove('active');
}

// ─── Status Fetching ──────────────────────────────────────
async function updateStatus() {
    // rubis.app raw service for status data
    const statusURL = `https://api.rubis.app/v2/scrap/22ma3RoqsGa7miHa/raw`;
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    const statusIndicator = document.querySelector('.status-indicator');
    const statusDetails = document.getElementById('status-details');

    try {
        const response = await fetch(statusURL);
        if (!response.ok) throw new Error("Status fetch failed");

        const data = await response.text();
        console.log("[Rose] Status Data Received:", data);

        const lines = data.split('\n');
        const statuses = {};

        // More robust parser for the new structured API response
        const productBlocks = data.match(/"([^"]+)"\s*\{([^}]+)\}/g);
        
        if (productBlocks) {
            productBlocks.forEach(block => {
                const nameMatch = block.match(/"([^"]+)"/);
                if (!nameMatch) return;
                const name = nameMatch[1];
                
                // Extract properties like status, desc, supported
                const props = {};
                const assignments = block.match(/([^,{]+)\s*=\s*([^,}]+)/g);
                if (assignments) {
                    assignments.forEach(assign => {
                        let [k, v] = assign.split('=').map(s => s.trim().replace(/^"|"$/g, '').replace(/,$/, ''));
                        props[k] = v;
                    });
                }

                const status = (props.status || 'offline').toLowerCase();
                const oldStatus = (_prevStatuses && _prevStatuses[name]) || null;
                statuses[name] = status;

                // Track "Last Online" only if it just BECAME online (or if we have no record yet)
                if (status === 'online' && (oldStatus !== 'online' || !_lastOnlineTimes[name.toLowerCase()])) {
                    updateLastOnline(name, status);
                }

                // Sync API data with our metadata
                if (!PRODUCT_METADATA[name.toLowerCase()]) PRODUCT_METADATA[name.toLowerCase()] = {};
                if (props.desc) PRODUCT_METADATA[name.toLowerCase()].desc = props.desc;
                if (props.supported) PRODUCT_METADATA[name.toLowerCase()].supported = props.supported;
            });
        } else {
            // Fallback for simple key=value format just in case
            lines.forEach(line => {
                if (line.includes('=')) {
                    let [key, value] = line.replace(/[{}",]/g, '').split('=');
                    if (key && value) {
                        statuses[key.trim()] = value.trim().toLowerCase();
                        updateLastOnline(key.trim(), value.trim().toLowerCase());
                    }
                }
            });
        }

        console.log("[Rose] Parsed Statuses Object:", statuses);

        // Populate Details
        statusDetails.innerHTML = '';
        Object.entries(statuses).forEach(([product, status]) => {
            const item = document.createElement('div');
            item.className = `status-item ${status}`;

            let displayStatus = status.toUpperCase();
            if (status === 'bakim') displayStatus = 'MAINTENANCE';

            item.innerHTML = `
                <span class="item-name">${product}</span>
                <span class="item-badge">${displayStatus}</span>
            `;

            item.addEventListener('click', () => openProductModal(product, status));

            statusDetails.appendChild(item);
        });

        // ── Diff & fire notifications ──────────────────────
        if (_prevStatuses !== null) {
            Object.entries(statuses).forEach(([product, newSt]) => {
                const oldSt = _prevStatuses[product];
                if (oldSt !== undefined && oldSt !== newSt) {
                    showNotification(product, oldSt, newSt);
                }
            });
        }
        _prevStatuses = { ...statuses };

        const statusValues = Object.values(statuses);
        const hasOffline = statusValues.includes('offline');
        const hasMaintenance = statusValues.includes('bakim');
        const hasUpdating = statusValues.includes('updating');
        const hasDevelopment = statusValues.includes('development');

        console.log(`[Rose] Final Decision: Offline=${hasOffline}, Maintenance=${hasMaintenance}, Updating=${hasUpdating}, Dev=${hasDevelopment}`);

        // woow
        // Auto-show details if something is not online (but don't auto-hide if they are all online)
        if (hasOffline || hasMaintenance || hasUpdating || hasDevelopment) {
            statusDetails.classList.add('visible');
        }

        // Update indicator to always be Online & Working
        statusIndicator.className = 'status-indicator';
        statusDot.className = 'status-dot';
        statusText.textContent = 'Working & Undetected';

    } catch (error) {
        console.error("[Rose] Status error:", error);
        statusIndicator.className = 'status-indicator offline';
        statusDot.className = 'status-dot offline';
        statusText.textContent = 'Failed to fetch status';
    }
}

// ─── Initialization ───────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    // Initial fetch
    updateStatus();

    // Refresh status every 5 seconds
    setInterval(updateStatus, 5000);

    // Toggle Details Click
    const indicator = document.querySelector('.status-indicator');
    if (indicator) {
        indicator.addEventListener('click', () => {
            document.getElementById('status-details').classList.toggle('visible');
        });
    }

    // Video error fallback
    const video = document.getElementById('bg-video');
    if (video) {
        video.addEventListener('error', () => {
            console.warn("[Rose] Background video not found — using fallback.");
            document.body.style.background =
                "radial-gradient(ellipse at top, #1a0a25 0%, #060608 60%)";
        }, true);
    }

    // Modal Events
    const modal = document.getElementById('product-modal');
    if (modal) {
        modal.querySelector('.modal-close').addEventListener('click', closeProductModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeProductModal();
        });
    }
});

// ─── Loader — waits for bar animation (2.2s) + small buffer ──
function hideLoader() {
    const loader = document.getElementById("loader-wrapper");
    const card = document.querySelector('.main-card');

    if (!loader || loader.classList.contains("loaded")) return;

    // Bar animation is 2.2s; wait 2.6s total for a clean finish
    const MIN_DISPLAY_MS = 2600;

    setTimeout(() => {
        loader.classList.add("loaded");
        // Reveal the card after loader fades
        if (card) {
            card.style.animation = 'cardReveal 0.8s cubic-bezier(0.23,1,0.32,1) both';
        }
        // Notify user that system is ready
        showNotification("Rose Software", null, "loaded");
    }, MIN_DISPLAY_MS);
}

// Trigger hide on window load
window.addEventListener("load", hideLoader);

// Safety Timeout: If assets take too long (e.g. video), hide loader anyway after 5s
setTimeout(hideLoader, 5000);

// ─── Particle / Snow Canvas ───────────────────────────────
(function setupParticles() {
    const canvas = document.getElementById('snow');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    class Particle {
        constructor() { this.reset(true); }

        reset(randomY = false) {
            this.x = Math.random() * canvas.width;
            this.y = randomY ? Math.random() * canvas.height : -10;
            this.size = Math.random() * 1.6 + 0.4;
            this.speedX = (Math.random() - 0.5) * 0.6;
            this.speedY = Math.random() * 1.2 + 0.4;
            this.opacity = Math.random() * 0.45 + 0.15;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.y > canvas.height + 10) this.reset();
            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
        }

        draw() {
            ctx.fillStyle = `rgba(255,255,255,${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    let particles = [];

    function init() {
        resize();
        particles = Array.from({ length: 110 }, () => new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', () => {
        resize();
        // Rebalance particle positions after resize
        particles.forEach(p => {
            if (p.x > canvas.width) p.x = Math.random() * canvas.width;
            if (p.y > canvas.height) p.reset();
        });
    });

    init();
    animate();
})();
