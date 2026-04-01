// Procedural animation helpers — no sprite sheets needed

import { COLORS } from './config.js';
import { lerp } from './utils.js';

// ── Slash Arc Drawing ──
export function drawSlashArc(ctx, cx, cy, facing, progress, dir, range = 20) {
    ctx.strokeStyle = COLORS.slash;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 1 - progress;

    ctx.beginPath();
    if (dir === 'up') {
        const startAngle = -Math.PI * 0.8 + progress * 0.5;
        ctx.arc(cx, cy - 4, range, startAngle, startAngle + Math.PI * 0.6);
    } else if (dir === 'down') {
        const startAngle = Math.PI * 0.2 + progress * 0.5;
        ctx.arc(cx, cy + 4, range, startAngle, startAngle + Math.PI * 0.6);
    } else {
        const baseAngle = facing === 1 ? -Math.PI * 0.4 : Math.PI * 0.6;
        const sweep = facing * Math.PI * 0.6;
        ctx.arc(cx + facing * 4, cy, range, baseAngle + progress * 0.3, baseAngle + sweep + progress * 0.3);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
}

// ── Enemy Drawing Helpers ──

// Simple eye glow
export function drawEye(ctx, x, y, size, color = '#ff2222') {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), size, size);
    // Glow
    ctx.fillStyle = color + '44';
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size * 2, 0, Math.PI * 2);
    ctx.fill();
}

// Geometric body shape
export function drawGeometricBody(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
    // Edge highlight
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(Math.round(x), Math.round(y), w, 1);
}

// Shield rectangle
export function drawShield(ctx, x, y, w, h, color = '#8888aa') {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
    ctx.strokeStyle = '#aaaacc';
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(x), Math.round(y), w, h);
}

// Diamond/rhombus shape (for flyers)
export function drawDiamond(ctx, cx, cy, size, color, wobble = 0) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy - size + wobble);
    ctx.lineTo(cx + size, cy);
    ctx.lineTo(cx, cy + size - wobble);
    ctx.lineTo(cx - size, cy);
    ctx.closePath();
    ctx.fill();
}

// Flickering wing particles
export function drawWings(ctx, cx, cy, time, color = '#ffffff33') {
    const wingSpread = 6 + Math.sin(time * 0.3) * 3;
    ctx.fillStyle = color;
    ctx.fillRect(cx - wingSpread - 2, cy - 1, 3, 2);
    ctx.fillRect(cx + wingSpread, cy - 1, 3, 2);
}

// Projectile glow
export function drawProjectile(ctx, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), size, size);
    ctx.fillStyle = color + '44';
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size * 1.5, 0, Math.PI * 2);
    ctx.fill();
}

// Telegraph indicator (warning before attack)
export function drawTelegraph(ctx, x, y, w, h, progress) {
    const alpha = 0.3 + Math.sin(progress * 10) * 0.2;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ff2060';
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
    ctx.globalAlpha = 1;
}

// Health bar
export function drawHealthBar(ctx, x, y, w, h, ratio, color = '#ff2060') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * ratio, h);
    ctx.strokeStyle = '#ffffff33';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
}

// Wobble effect for hurt
export function getHurtWobble(timer) {
    if (timer <= 0) return 0;
    return Math.sin(timer * 1.5) * (timer / 10);
}
