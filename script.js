
document.addEventListener("DOMContentLoaded", () => {
    console.log("SHIELDHVH yönlendirme paneli aktif.");


    const buttons = document.querySelectorAll(".btn");


    const video = document.getElementById('bg-video');
    if (video) {
        video.addEventListener('error', function () {
            console.error("Video dosyası bulunamadı. Lütfen 'background' klasöründe 'video.mp4' olduğundan emin olun.");
        }, true);
    }
});


window.addEventListener("load", () => {
    const loader = document.getElementById("loader-wrapper");


    setTimeout(() => {
        loader.classList.add("loaded");


        document.querySelector('.main-card').style.animation = 'fadeIn 1.2s ease-out';
    }, 1500);
});

function setupSnow() {
    const canvas = document.getElementById('snow');
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 1;
            this.speedX = Math.random() * 1 - 0.5;
            this.speedY = Math.random() * 1.5 + 0.5;
            this.opacity = Math.random() * 0.5 + 0.3;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.y > canvas.height) {
                this.y = -10;
                this.x = Math.random() * canvas.width;
            }
            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
        }

        draw() {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function init() {
        resize();
        particles = [];
        const count = 100;
        for (let i = 0; i < count; i++) {
            particles.push(new Particle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    init();
    animate();
}

setupSnow();
