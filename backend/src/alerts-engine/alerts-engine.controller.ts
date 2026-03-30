import { Controller, Post, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AlertsEngineService } from './alerts-engine.service';
import { DiscordNotifierService } from './discord-notifier.service';

@Controller('alerts-engine')
@UseGuards(JwtAuthGuard)
export class AlertsEngineController {
  constructor(
    private alertsEngine: AlertsEngineService,
    private discordNotifier: DiscordNotifierService,
  ) {}

  /** Manually trigger alert check for the current user */
  @Post('check')
  async checkUserAlerts(@Request() req) {
    const results = await this.alertsEngine.checkAlerts(req.user.id);

    const triggered = results.filter(r => r.triggered);
    if (triggered.length > 0) {
      await this.discordNotifier.notifyAlertBatch(triggered, req.user.email || req.user.id);
    }

    return { checked: results.length, triggered: triggered.length, results };
  }

  /** Get all user alerts with current price context */
  @Get('status')
  async getStatus(@Request() req) {
    return this.alertsEngine.checkAlerts(req.user.id);
  }
}
