import { GAME_WIDTH, GAME_HEIGHT, COLORS, PLAYER_MAX_HP, FOCUS_MAX } from './config.js';

export class HUD {
    constructor() {
        this.visible = true;
    }

    draw(ctx, player) {
        if (!this.visible || !player) return;

        // Health pips
        const pipSize = 6;
        const pipGap = 3;
        const startX = 8;
        const startY = 8;

        for (let i = 0; i < player.maxHp; i++) {
            const x = startX + i * (pipSize + pipGap);
            if (i < player.hp) {
                // Filled
                ctx.fillStyle = COLORS.playerVisor;
                ctx.fillRect(x, startY, pipSize, pipSize);
                ctx.fillStyle = '#ffffff44';
                ctx.fillRect(x, startY, pipSize, 1);
            } else {
                // Empty
                ctx.fillStyle = '#333344';
                ctx.fillRect(x, startY, pipSize, pipSize);
            }
            ctx.strokeStyle = '#ffffff22';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, startY, pipSize, pipSize);
        }

        // Focus meter (time slow)
        if (player.hasTimeSlow) {
            const barWidth = 40;
            const barHeight = 3;
            const barX = 8;
            const barY = startY + pipSize + 4;

            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            ctx.fillStyle = player.timeSlow ? '#8844ff' : '#6633cc';
            ctx.fillRect(barX, barY, barWidth * (player.focus / FOCUS_MAX), barHeight);
            ctx.strokeStyle = '#ffffff22';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        }

        // Ability icons (bottom-left)
        const iconY = GAME_HEIGHT - 14;
        const iconSize = 8;
        let iconX = 8;

        if (player.hasDash) {
            ctx.fillStyle = player.dashCooldown > 0 ? '#333344' : COLORS.dashTrail;
            ctx.fillRect(iconX, iconY, iconSize, iconSize);
            ctx.strokeStyle = '#ffffff33';
            ctx.strokeRect(iconX, iconY, iconSize, iconSize);
            iconX += iconSize + 3;
        }

        if (player.hasWallJump) {
            ctx.fillStyle = COLORS.wallSpark;
            ctx.fillRect(iconX, iconY, iconSize, iconSize);
            ctx.strokeStyle = '#ffffff33';
            ctx.strokeRect(iconX, iconY, iconSize, iconSize);
            iconX += iconSize + 3;
        }

        if (player.hasDoubleJump) {
            ctx.fillStyle = '#44aaff';
            ctx.fillRect(iconX, iconY, iconSize, iconSize);
            ctx.strokeStyle = '#ffffff33';
            ctx.strokeRect(iconX, iconY, iconSize, iconSize);
        }
    }
}
