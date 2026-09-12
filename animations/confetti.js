/**
 * ConfettiFX - High Performance Canvas Confetti Engine
 * Includes ribbons, circular sequins, stars, custom gravity, wobble, and 3D flip.
 */

class ConfettiFX {
    constructor(canvasId = 'confetti-canvas') {
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
            this.canvas.style.zIndex = '999';
            document.body.appendChild(this.canvas);
        }
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.animationId = null;
        this.isActive = false;
        
        this.colors = [
            '#ff4d8d', '#ff758c', '#ff7eb3', '#ffc371',
            '#ffd166', '#06d6a0', '#118ab2', '#073b4c',
            '#a18cd1', '#fbc2eb', '#fad0c4', '#ffd700'
        ];

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
    }

    burst(x = this.width / 2, y = this.height / 2, count = 80) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 12 + 6;
            const shape = Math.random() > 0.6 ? 'star' : (Math.random() > 0.4 ? 'circle' : 'rect');
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity - Math.random() * 4,
                size: Math.random() * 8 + 6,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 15,
                wobble: Math.random() * 10,
                wobbleSpeed: Math.random() * 0.1 + 0.05,
                shape: shape,
                opacity: 1,
                decay: Math.random() * 0.008 + 0.004,
                gravity: 0.28
            });
        }

        if (!this.isActive) {
            this.start();
        }
    }

    cannon(fromLeft = true) {
        const x = fromLeft ? 0 : this.width;
        const y = this.height * 0.75;
        const baseAngle = fromLeft ? -Math.PI / 4 : -Math.PI * 0.75;

        for (let i = 0; i < 60; i++) {
            const angle = baseAngle + (Math.random() - 0.5) * 0.6;
            const velocity = Math.random() * 18 + 12;
            const shape = Math.random() > 0.5 ? 'rect' : 'ribbon';

            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                size: Math.random() * 10 + 6,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 20,
                wobble: Math.random() * 10,
                wobbleSpeed: Math.random() * 0.12 + 0.06,
                shape: shape,
                opacity: 1,
                decay: Math.random() * 0.006 + 0.003,
                gravity: 0.35
            });
        }

        if (!this.isActive) {
            this.start();
        }
    }

    start() {
        this.isActive = true;
        const loop = () => {
            this.ctx.clearRect(0, 0, this.width, this.height);

            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += p.gravity;
                p.vx *= 0.98;
                p.rotation += p.rotationSpeed;
                p.wobble += p.wobbleSpeed;
                p.opacity -= p.decay;

                if (p.opacity <= 0 || p.y > this.height + 50) {
                    this.particles.splice(i, 1);
                    continue;
                }

                this.ctx.save();
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate((p.rotation * Math.PI) / 180);
                this.ctx.globalAlpha = Math.max(0, p.opacity);
                this.ctx.fillStyle = p.color;

                const scaleX = Math.cos(p.wobble);

                if (p.shape === 'circle') {
                    this.ctx.beginPath();
                    this.ctx.ellipse(0, 0, p.size / 2 * Math.abs(scaleX), p.size / 2, 0, 0, Math.PI * 2);
                    this.ctx.fill();
                } else if (p.shape === 'star') {
                    this.drawStar(0, 0, 5, p.size, p.size / 2);
                } else if (p.shape === 'ribbon') {
                    this.ctx.fillRect(-p.size / 2 * scaleX, -p.size, p.size * scaleX, p.size * 2.2);
                } else {
                    this.ctx.fillRect(-p.size / 2 * scaleX, -p.size / 2, p.size * scaleX, p.size);
                }

                this.ctx.restore();
            }

            if (this.particles.length > 0) {
                this.animationId = requestAnimationFrame(loop);
            } else {
                this.isActive = false;
                this.ctx.clearRect(0, 0, this.width, this.height);
            }
        };

        this.animationId = requestAnimationFrame(loop);
    }

    drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            this.ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
        }
        this.ctx.lineTo(cx, cy - outerRadius);
        this.ctx.closePath();
        this.ctx.fill();
    }
}

window.confettiFX = new ConfettiFX();
