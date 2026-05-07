/* ============================================================
   ROSE SOFTWARE — Main Script
   ============================================================ */

// ─── Status Fetching ──────────────────────────────────────
// Hello, world!
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

        lines.forEach(line => {
            if (line.includes('=')) {
                // Remove curly braces, quotes, commas, and other noise
                let [key, value] = line.replace(/[{}",]/g, '').split('=');
                if (key && value) {
                    statuses[key.trim()] = value.trim().toLowerCase();
                }
            }
        });

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
            statusDetails.appendChild(item);
        });

        const statusValues = Object.values(statuses);
        const hasOffline = statusValues.includes('offline');
        const hasMaintenance = statusValues.includes('bakim');
        const hasUpdating = statusValues.includes('updating');
        const hasDevelopment = statusValues.includes('development');

        console.log(`[Rose] Final Decision: Offline=${hasOffline}, Maintenance=${hasMaintenance}, Updating=${hasUpdating}, Dev=${hasDevelopment}`);

        // woow
        // Auto-show details if something is not online
        if (hasOffline || hasMaintenance || hasUpdating || hasDevelopment) {
            statusDetails.classList.add('visible');
        } else {
            statusDetails.classList.remove('visible');
        }

        statusIndicator.className = 'status-indicator';
        statusDot.className = 'status-dot';
        statusText.textContent = 'Online & Working';

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

    // Refresh status every 30 seconds
    setInterval(updateStatus, 30000);

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
