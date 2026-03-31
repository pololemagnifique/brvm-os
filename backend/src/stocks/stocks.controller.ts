import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { StocksService } from './stocks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('stocks')
export class StocksController {
  constructor(private stocksService: StocksService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.stocksService.findAll(search);
  }

  @Get('prices')
  getLatestPrices(@Query('ticker') ticker?: string) {
    return this.stocksService.getLatestPrices(ticker);
  }

  @Get('indices')
  getIndices() {
    return this.stocksService.getIndices();
  }

  @Get(':ticker')
  findOne(@Param('ticker') ticker: string) {
    return this.stocksService.getStock(ticker);
  }

  @Get(':ticker/history')
  getHistory(@Param('ticker') ticker: string, @Query('days') days?: string) {
    return this.stocksService.getHistory(ticker, days ? parseInt(days) : 30);
  }

  @Get(':ticker/technicals')
  getTechnicals(@Param('ticker') ticker: string) {
    return this.stocksService.getTechnicals(ticker);
  }

  @Get(':ticker/corporate')
  getCorporate(@Param('ticker') ticker: string) {
    return this.stocksService.getCorporate(ticker);
  }
}
