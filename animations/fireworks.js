/**
 * FireworksFX - Atmospheric Particle Rocket & Sparkler Engine
 * Supports rocket launch trails, vibrant flash bursts, glittering willows, and ambient sparkles.
 */

class FireworksFX {
    constructor(canvasId = 'fireworks-canvas') {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = canvasId;
            this.canvas.style.position = 'fixed';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.style.pointerEvents = 'none';
            this.canvas.style.zIndex = '998';
            document.body.appendChild(this.canvas);
        }
        this.ctx = this.canvas.getContext('2d');
        this.rockets = [];
        this.particles = [];
        this.ambientSparks = [];
        this.isActive = false;
        this.autoLaunchInterval = null;

        this.colorPalettes = [
            ['#ff4b4b', '#ff8585', '#ffd166', '#ffffff'],
            ['#06d6a0', '#118ab2', '#70d6ff', '#e7c6ff'],
            ['#ff70a6', '#ff9770', '#ffd670', '#e9ff70'],
            ['#a06cd5', '#e2afff', '#ffc6ff', '#fffffc'],
            ['#ffd700', '#ffae00', '#ff7800', '#ffffff']
        ];

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.initAmbientSparks();
    }

    resize() {
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
    }

    initAmbientSparks() {
        for (let i = 0; i < 40; i++) {
            this.ambientSparks.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 1,
                alpha: Math.random() * 0.8 + 0.2,
                speed: Math.random() * 0.02 + 0.01,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    launch(targetX = null, targetY = null) {
        const startX = Math.random() * (this.width * 0.8) + (this.width * 0.1);
        const endX = targetX !== null ? targetX : Math.random() * (this.width * 0.8) + (this.width * 0.1);
        const endY = targetY !== null ? targetY : Math.random() * (this.height * 0.45) + (this.height * 0.1);

        const palette = this.colorPalettes[Math.floor(Math.random() * this.colorPalettes.length)];

        this.rockets.push({
            x: startX,
            y: this.height,
            targetX: endX,
            targetY: endY,
            speed: Math.random() * 3 + 12,
            angle: Math.atan2(endY - this.height, endX - startX),
            color: palette[0],
            palette: palette,
            trail: []
        });

        if (!this.isActive) {
            this.start();
        }
    }

    explode(x, y, palette) {
        const particleCount = Math.floor(Math.random() * 40) + 70;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 7 + 2;
            const color = palette[Math.floor(Math.random() * palette.length)];

            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 2.5 + 1.5,
                color: color,
                alpha: 1,
                decay: Math.random() * 0.015 + 0.012,
                gravity: 0.06,
                friction: 0.96,
                flicker: Math.random() > 0.4
            });
        }
    }

    startAutoLaunch(interval = 1800) {
        if (this.autoLaunchInterval) clearInterval(this.autoLaunchInterval);
        this.launch();
        this.autoLaunchInterval = setInterval(() => {
            this.launch();
            if (Math.random() > 0.4) {
                setTimeout(() => this.launch(), 350);
            }
        }, interval);
    }

    stopAutoLaunch() {
        if (this.autoLaunchInterval) {
            clearInterval(this.autoLaunchInterval);
            this.autoLaunchInterval = null;
        }
    }

    start() {
        this.isActive = true;
        const loop = () => {
            this.ctx.clearRect(0, 0, this.width, this.height);

            // Ambient background twinkling stars
            this.drawAmbientStars();

            // Update & Draw Rockets
            for (let i = this.rockets.length - 1; i >= 0; i--) {
                const r = this.rockets[i];
                const vx = Math.cos(r.angle) * r.speed;
                const vy = Math.sin(r.angle) * r.speed;

                r.x += vx;
                r.y += vy;

                r.trail.push({ x: r.x, y: r.y, alpha: 1 });
                if (r.trail.length > 8) r.trail.shift();

                // Draw trail
                for (let t = 0; t < r.trail.length; t++) {
                    const tr = r.trail[t];
                    this.ctx.beginPath();
                    this.ctx.arc(tr.x, tr.y, 2, 0, Math.PI * 2);
                    this.ctx.fillStyle = r.color;
                    this.ctx.globalAlpha = (t / r.trail.length) * 0.8;
                    this.ctx.fill();
                }

                // Check arrival at explosion point
                if (r.y <= r.targetY || (Math.abs(r.x - r.targetX) < 10 && Math.abs(r.y - r.targetY) < 10)) {
                    this.explode(r.x, r.y, r.palette);
                    if (window.soundEngine) window.soundEngine.playPop();
                    this.rockets.splice(i, 1);
                }
            }

            // Update & Draw Explosion Particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= p.friction;
                p.vy = p.vy * p.friction + p.gravity;
                p.alpha -= p.decay;

                if (p.alpha <= 0) {
                    this.particles.splice(i, 1);
                    continue;
                }

                this.ctx.save();
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                let currentAlpha = p.alpha;
                if (p.flicker && Math.random() > 0.5) currentAlpha *= 0.5;
                this.ctx.globalAlpha = Math.max(0, currentAlpha);
                this.ctx.fillStyle = p.color;
                this.ctx.shadowBlur = 8;
                this.ctx.shadowColor = p.color;
                this.ctx.fill();
                this.ctx.restore();
            }

            if (this.rockets.length > 0 || this.particles.length > 0 || this.autoLaunchInterval) {
                requestAnimationFrame(loop);
            } else {
                this.isActive = false;
                this.ctx.clearRect(0, 0, this.width, this.height);
            }
        };

        requestAnimationFrame(loop);
    }

    drawAmbientStars() {
        const time = Date.now() * 0.002;
        this.ctx.save();
        for (let spark of this.ambientSparks) {
            const dynamicAlpha = Math.abs(Math.sin(time + spark.phase)) * spark.alpha;
            this.ctx.beginPath();
            this.ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.globalAlpha = dynamicAlpha;
            this.ctx.shadowBlur = 6;
            this.ctx.shadowColor = '#ffe29f';
            this.ctx.fill();
        }
        this.ctx.restore();
    }
}

window.fireworksFX = new FireworksFX();
