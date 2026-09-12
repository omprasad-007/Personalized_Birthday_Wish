/**
 * HeartsFX - Lightweight Floating Hearts Animation Engine
 * Creates gentle, non-blocking upward floating hearts with variable drift and opacity.
 */

class HeartsFX {
    constructor(containerId = 'hearts-container') {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = containerId;
            this.container.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                pointer-events: none;
                overflow: hidden;
                z-index: 3;
            `;
            document.body.appendChild(this.container);
        }

        this.heartIcons = ['❤️', '💖', '💕', '💗', '✨', '💛', '🌸'];
        this.intervalId = null;
        this.maxHearts = 16;
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    start(interval = 1200) {
        if (this.prefersReducedMotion) return;
        if (this.intervalId) clearInterval(this.intervalId);

        // Spawn initial batch
        for (let i = 0; i < 5; i++) {
            setTimeout(() => this.spawnHeart(), i * 300);
        }

        this.intervalId = setInterval(() => {
            if (this.container.childElementCount < this.maxHearts) {
                this.spawnHeart();
            }
        }, interval);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    spawnHeart() {
        if (this.prefersReducedMotion) return;

        const heart = document.createElement('div');
        const icon = this.heartIcons[Math.floor(Math.random() * this.heartIcons.length)];
        const startX = Math.random() * 92 + 4; // 4vw to 96vw
        const size = Math.random() * 14 + 16; // 16px to 30px
        const duration = Math.random() * 6 + 9; // 9s to 15s
        const drift = (Math.random() - 0.5) * 80; // horizontal drift in px
        const rotation = (Math.random() - 0.5) * 45; // rotation in deg
        const opacity = Math.random() * 0.45 + 0.35; // 0.35 to 0.8

        heart.textContent = icon;
        heart.style.cssText = `
            position: absolute;
            bottom: -40px;
            left: ${startX}vw;
            font-size: ${size}px;
            opacity: ${opacity};
            transform: translate3d(0, 0, 0) rotate(${rotation}deg);
            pointer-events: none;
            user-select: none;
            filter: drop-shadow(0 0 6px rgba(255, 77, 141, 0.4));
            transition: opacity 1s ease;
            animation: floatUpHeart ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
            --drift-x: ${drift}px;
        `;

        this.container.appendChild(heart);

        setTimeout(() => {
            if (heart.parentNode) {
                heart.remove();
            }
        }, duration * 1000);
    }
}

window.heartsFX = new HeartsFX();
