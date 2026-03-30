import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert, AlertType } from '../alerts/alert.entity';
import * as fs from 'fs';
import * as path from 'path';

export interface AlertResult {
  alertId: string;
  ticker: string;
  type: AlertType;
  condition: string;
  threshold: number;
  currentValue: number;
  triggered: boolean;
  message: string;
}

@Injectable()
export class AlertsEngineService {
  constructor(
    @InjectRepository(Alert) private alertsRepo: Repository<Alert>,
  ) {}

  /** Load EOD prices from the dashboard JSON file */
  private loadPrices(): Map<string, any> {
    const priceFile = '/data/.openclaw/workspace/brvm-os/dashboard/data/eod_data.json';
    try {
      const raw = fs.readFileSync(priceFile, 'utf-8');
      const data = JSON.parse(raw);
      const map = new Map<string, any>();
      for (const s of data.stocks || []) {
        map.set(s.ticker, s);
      }
      return map;
    } catch {
      return new Map();
    }
  }

  /** Evaluate a single alert condition */
  private evaluateAlert(alert: Alert, prices: Map<string, any>): AlertResult {
    const stock = alert.stock;
    const ticker = stock?.ticker || 'UNKNOWN';
    const priceData = prices.get(ticker);

    const last = priceData?.last ?? priceData?.prev_close ?? null;
    const changePct = priceData?.change_pct ?? 0;
    const volume = priceData?.volume ?? 0;

    let currentValue: number | null = null;
    let triggered = false;
    let message = '';

    switch (alert.type) {
      case AlertType.PRICE_ABOVE:
        currentValue = last;
        if (currentValue !== null && currentValue >= Number(alert.threshold)) {
          triggered = true;
          message = `📈 ${ticker} a dépassé ${alert.threshold.toLocaleString('fr-FR')} FCFA — Cours: ${currentValue.toLocaleString('fr-FR')} FCFA`;
        }
        break;

      case AlertType.PRICE_BELOW:
        currentValue = last;
        if (currentValue !== null && currentValue <= Number(alert.threshold)) {
          triggered = true;
          message = `📉 ${ticker} est descendu sous ${alert.threshold.toLocaleString('fr-FR')} FCFA — Cours: ${currentValue.toLocaleString('fr-FR')} FCFA`;
        }
        break;

      case AlertType.CHANGE_PCT:
        currentValue = changePct;
        if (Math.abs(changePct) >= Number(alert.threshold)) {
          triggered = true;
          const emoji = changePct > 0 ? '📈' : '📉';
          message = `${emoji} ${ticker} : variation de ${changePct > 0 ? '+' : ''}${changePct.toFixed(2)}% (seuil: ${alert.threshold}%)`;
        }
        break;

      case AlertType.VOLUME_SPIKE:
        currentValue = volume;
        // VOLUME_SPIKE uses threshold as absolute volume (number of shares)
        if (volume >= Number(alert.threshold)) {
          triggered = true;
          message = `🔔 ${ticker} : volume inhabituel de ${volume.toLocaleString('fr-FR')} titres (seuil: ${Number(alert.threshold).toLocaleString('fr-FR')})`;
        }
        break;
    }

    return { alertId: alert.id, ticker, type: alert.type, condition: alert.condition, threshold: Number(alert.threshold), currentValue: currentValue ?? 0, triggered, message };
  }

  /** Check all active alerts for a user (or all users if userId is null) */
  async checkAlerts(userId?: string): Promise<AlertResult[]> {
    const where: any = { isActive: true };
    if (userId) where.userId = userId;

    const alerts = await this.alertsRepo.find({
      where,
      relations: ['stock'],
    });

    const prices = this.loadPrices();
    const results: AlertResult[] = [];

    for (const alert of alerts) {
      const result = this.evaluateAlert(alert, prices);
      results.push(result);

      // If triggered and not already triggered recently (within last hour), update lastTriggered
      if (result.triggered) {
        const last = alert.lastTriggered ? new Date(alert.lastTriggered).getTime() : 0;
        const now = Date.now();
        // Only update lastTriggered if more than 1 hour ago (avoid spam)
        if (now - last > 3600000) {
          await this.alertsRepo.update(alert.id, { lastTriggered: new Date() });
        }
      }
    }

    return results;
  }
}
