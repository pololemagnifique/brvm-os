import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ExchangeRatesService } from './exchange-rates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('exchange-rates')
@Controller('exchange-rates')
export class ExchangeRatesController {
  constructor(private readonly service: ExchangeRatesService) {}

  @Get('current')
  @ApiOperation({ summary: 'Taux du jour (USD et EUR → XOF)' })
  async getCurrent() {
    const rate = await this.service.getTodayRate();
    if (!rate) {
      return { ok: false, message: 'Aucun taux enregistré ce jour' };
    }
    return {
      ok: true,
      rate: {
        date: rate.rateDate,
        usdToXof: rate.usdToXof,
        eurToXof: rate.eurToXof,
        usdToEur: rate.usdToEur,
        source: rate.source,
        fetchedAt: rate.fetchedAt,
      },
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'Historique des taux (30 derniers jours)' })
  async getHistory() {
    const rates = await this.service.getLatestRates(30);
    return {
      ok: true,
      count: rates.length,
      rates: rates.map((r) => ({
        date: r.rateDate,
        usdToXof: r.usdToXof,
        eurToXof: r.eurToXof,
        usdToEur: r.usdToEur,
        source: r.source,
      })),
    };
  }

  @Post('refresh')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Rafraîchir les taux maintenant (admin)' })
  async refresh() {
    const rate = await this.service.saveRate();
    return {
      ok: true,
      rate: {
        date: rate.rateDate,
        usdToXof: rate.usdToXof,
        eurToXof: rate.eurToXof,
        usdToEur: rate.usdToEur,
        source: rate.source,
        fetchedAt: rate.fetchedAt,
      },
    };
  }
}
