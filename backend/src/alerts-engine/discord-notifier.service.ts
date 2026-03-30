import { Injectable } from '@nestjs/common';
import { AlertResult } from './alerts-engine.service';

@Injectable()
export class DiscordNotifierService {
  private readonly DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1484642360829804705/RgrjQ-TbU6sR3ZqXpGL-T-j0nPL/DRxGQh-WJAUb1O3tWjRZ1W0K9dPLBzxhQ1I9nkj';

  async notifyAlert(result: AlertResult, username: string): Promise<void> {
    const color = result.triggered ? 0x00ff00 : 0xff9900;
    const embed = {
      title: `🔔 Alerte BRVM — ${result.ticker}`,
      description: result.message || `Condition: ${result.condition} ${result.threshold}`,
      color,
      fields: [
        { name: 'Type', value: result.type, inline: true },
        { name: 'Condition', value: result.condition, inline: true },
        { name: 'Seuil', value: result.threshold.toString(), inline: true },
        { name: 'Valeur actuelle', value: result.currentValue.toString(), inline: true },
        { name: 'Statut', value: result.triggered ? '⚡ DÉCLENCHÉE' : 'En surveillance', inline: true },
      ],
      footer: { text: `BRVM-OS • Alerte pour ${username}` },
      timestamp: new Date().toISOString(),
    };

    try {
      const res = await fetch(this.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'AlertBot BRVM',
          avatar_url: 'https://i.imgur.com/AfFp7pu.png',
          embeds: [embed],
        }),
      });
      if (!res.ok) {
        console.error(`[AlertBot] Discord notification failed: ${res.status}`);
      }
    } catch (e) {
      console.error('[AlertBot] Discord notification error:', e.message);
    }
  }

  async notifyAlertBatch(results: AlertResult[], username: string): Promise<void> {
    const triggered = results.filter(r => r.triggered);
    if (triggered.length === 0) return;

    const embed = {
      title: `🔔 ${triggered.length} alerte(s) BRVM déclenchée(s)`,
      color: 0xff0000,
      fields: triggered.map(r => ({
        name: `${r.ticker}`,
        value: r.message || `${r.condition} ${r.threshold} — actuel: ${r.currentValue}`,
        inline: false,
      })),
      footer: { text: `BRVM-OS • Alerte pour ${username}` },
      timestamp: new Date().toISOString(),
    };

    try {
      await fetch(this.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'AlertBot BRVM',
          avatar_url: 'https://i.imgur.com/AfFp7pu.png',
          embeds: [embed],
        }),
      });
    } catch (e) {
      console.error('[AlertBot] Batch notification error:', e.message);
    }
  }
}
