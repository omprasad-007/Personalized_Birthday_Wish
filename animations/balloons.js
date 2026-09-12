/**
 * HeartBalloonManager - Interactive 3D Floating Heart Balloons System
 * Spawns romantic, glossy, floating Heart Balloons with strings,
 * gentle sway physics, and interactive pop-on-click with sound & confetti sparks!
 */

class HeartBalloonManager {
    constructor(containerId = 'balloon-container') {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = containerId;
            this.container.style.position = 'fixed';
            this.container.style.top = '0';
            this.container.style.left = '0';
            this.container.style.width = '100vw';
            this.container.style.height = '100vh';
            this.container.style.pointerEvents = 'none';
            this.container.style.overflow = 'hidden';
            this.container.style.zIndex = '4';
            document.body.appendChild(this.container);
        }

        this.balloonPalettes = [
            { primary: '#ff3366', secondary: '#ff758c', shadow: 'rgba(255, 51, 102, 0.45)' },
            { primary: '#ff007f', secondary: '#ff70a6', shadow: 'rgba(255, 0, 127, 0.45)' },
            { primary: '#9b5de5', secondary: '#c77dff', shadow: 'rgba(155, 93, 229, 0.45)' },
            { primary: '#f15bb5', secondary: '#ff99c8', shadow: 'rgba(241, 91, 181, 0.45)' },
            { primary: '#ffd166', secondary: '#ffe49e', shadow: 'rgba(255, 209, 102, 0.45)' },
            { primary: '#e63946', secondary: '#ff758f', shadow: 'rgba(230, 57, 70, 0.45)' }
        ];

        this.spawnInterval = null;
        this.maxBalloons = 12;
    }

    startContinuousSpawn(interval = 1600) {
        if (this.spawnInterval) clearInterval(this.spawnInterval);
        
        // Initial batch
        for (let i = 0; i < 4; i++) {
            setTimeout(() => this.createHeartBalloon(), i * 400);
        }

        this.spawnInterval = setInterval(() => {
            if (this.container.querySelectorAll('.heart-balloon-wrap').length < this.maxBalloons) {
                this.createHeartBalloon();
            }
        }, interval);
    }

    stopContinuousSpawn() {
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
            this.spawnInterval = null;
        }
    }

    createHeartBalloon(startX = null) {
        const wrap = document.createElement('div');
        wrap.className = 'heart-balloon-wrap';
        
        const palette = this.balloonPalettes[Math.floor(Math.random() * this.balloonPalettes.length)];
        const size = Math.floor(Math.random() * 22) + 52; // 52px - 74px
        const posX = startX !== null ? startX : Math.random() * (window.innerWidth - 90) + 40;
        const duration = Math.random() * 6 + 11; // 11s - 17s
        const swayDuration = Math.random() * 2 + 3.5; // 3.5s - 5.5s
        const rotation = (Math.random() - 0.5) * 25;

        wrap.style.cssText = `
            position: absolute;
            left: ${posX}px;
            bottom: -130px;
            width: ${size}px;
            height: ${size * 1.3}px;
            cursor: pointer;
            pointer-events: auto;
            transform-origin: bottom center;
            animation: floatUpHeartBalloon ${duration}s linear infinite, heartSway ${swayDuration}s ease-in-out infinite alternate;
            transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            z-index: 10;
        `;

        // SVG Heart Balloon with 3D gradient & specular highlight
        const uniqueId = 'hb-grad-' + Math.random().toString(36).substr(2, 9);
        wrap.innerHTML = `
            <svg viewBox="0 0 100 120" width="100%" height="100%" style="overflow: visible; filter: drop-shadow(0 10px 18px ${palette.shadow});">
                <defs>
                    <radialGradient id="${uniqueId}" cx="35%" cy="30%" r="65%">
                        <stop offset="0%" stop-color="${palette.secondary}" />
                        <stop offset="60%" stop-color="${palette.primary}" />
                        <stop offset="100%" stop-color="#3d001a" />
                    </radialGradient>
                    <linearGradient id="shine-${uniqueId}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.8" />
                        <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
                    </linearGradient>
                </defs>
                <!-- Heart Body -->
                <path d="M50,88 C20,68 0,48 0,28 C0,12 12,0 28,0 C38,0 46,6 50,14 C54,6 62,0 72,0 C88,0 100,12 100,28 C100,48 80,68 50,88 Z" fill="url(#${uniqueId})" />
                <!-- 3D Gloss Highlight -->
                <ellipse cx="28" cy="22" rx="14" ry="7" transform="rotate(-30 28 22)" fill="url(#shine-${uniqueId})" />
                <circle cx="70" cy="18" r="4" fill="rgba(255,255,255,0.6)" />
                <!-- Knot -->
                <polygon points="46,88 54,88 50,94" fill="${palette.primary}" />
                <!-- Dangling Ribbon String -->
                <path d="M50,94 Q44,105 52,118 T48,135" stroke="rgba(255,255,255,0.45)" stroke-width="1.6" fill="none" stroke-linecap="round" />
            </svg>
        `;

        // Hover scale
        wrap.addEventListener('mouseenter', () => {
            wrap.style.transform = 'scale(1.2) rotate(' + rotation + 'deg)';
        });
        wrap.addEventListener('mouseleave', () => {
            wrap.style.transform = 'scale(1) rotate(0deg)';
        });

        // Click to pop with SFX & confetti!
        const popHandler = (e) => {
            e.stopPropagation();
            this.popBalloon(wrap, palette);
        };

        wrap.addEventListener('click', popHandler);
        wrap.addEventListener('touchstart', popHandler, { passive: true });

        this.container.appendChild(wrap);

        // Remove after animation completes
        setTimeout(() => {
            if (wrap.parentNode) {
                wrap.remove();
            }
        }, duration * 1000);
    }

    popBalloon(balloonElement, palette) {
        const rect = balloonElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        if (window.soundEngine) {
            window.soundEngine.playBalloonPop();
        }

        if (window.confettiFX) {
            window.confettiFX.burst(centerX, centerY, 35);
        }

        balloonElement.style.transition = 'all 0.1s ease-out';
        balloonElement.style.transform = 'scale(1.45)';
        balloonElement.style.opacity = '0';

        setTimeout(() => {
            if (balloonElement.parentNode) {
                balloonElement.remove();
            }
        }, 120);
    }
}

window.balloonManager = new HeartBalloonManager();
