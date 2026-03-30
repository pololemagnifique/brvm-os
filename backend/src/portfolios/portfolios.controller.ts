import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Res } from '@nestjs/common';
import { PortfoliosService } from './portfolios.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreateWatchlistDto, UpdateWatchlistDto } from './dto/add-watchlist-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class PortfoliosController {
  constructor(private portfoliosService: PortfoliosService) {}

  // PORTFOLIOS
  @Get('portfolios')
  getPortfolios(@Request() req) {
    return this.portfoliosService.getPortfolios(req.user.id);
  }

  @Post('portfolios')
  createPortfolio(@Request() req, @Body() dto: CreatePortfolioDto) {
    return this.portfoliosService.createPortfolio(req.user.id, dto);
  }

  @Get('portfolios/:portfolioId/transactions')
  getTransactions(@Param('portfolioId') id: string, @Request() req) {
    return this.portfoliosService.getTransactions(id, req.user.id);
  }

  @Post('portfolios/:portfolioId/transactions')
  addTransaction(@Param('portfolioId') id: string, @Request() req, @Body() dto: CreateTransactionDto) {
    return this.portfoliosService.addTransaction(id, req.user.id, dto);
  }

  @Delete('portfolios/:portfolioId/transactions/:transactionId')
  deleteTransaction(@Param('portfolioId') portfolioId: string, @Param('transactionId') transactionId: string, @Request() req) {
    return this.portfoliosService.deleteTransaction(portfolioId, transactionId, req.user.id);
  }

  @Get('portfolios/:portfolioId/positions')
  getPositions(@Param('portfolioId') id: string, @Request() req) {
    return this.portfoliosService.getPositions(id, req.user.id);
  }

  @Get('portfolios/:portfolioId/summary')
  getSummary(@Param('portfolioId') id: string, @Request() req) {
    return this.portfoliosService.getSummary(id, req.user.id);
  }

  @Get('portfolios/:portfolioId/transactions.csv')
  async getTransactionsCsv(@Param('portfolioId') id: string, @Request() req, @Res() res: any) {
    const csv = await this.portfoliosService.exportCsv(id, req.user.id);
    const filename = `brvm-transactions-${id.slice(0, 8)}.csv`;
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(csv);
  }

  // WATCHLISTS
  @Get('watchlists')
  getWatchlists(@Request() req) {
    return this.portfoliosService.getWatchlists(req.user.id);
  }

  @Post('watchlists')
  createWatchlist(@Request() req, @Body() dto: CreateWatchlistDto) {
    return this.portfoliosService.createWatchlist(req.user.id, dto);
  }

  @Get('watchlists/:id')
  getWatchlist(@Param('id') id: string, @Request() req) {
    return this.portfoliosService.getWatchlist(id, req.user.id);
  }

  @Put('watchlists/:id')
  updateWatchlist(@Param('id') id: string, @Request() req, @Body() dto: UpdateWatchlistDto) {
    return this.portfoliosService.updateWatchlist(id, req.user.id, dto);
  }

  @Delete('watchlists/:id')
  deleteWatchlist(@Param('id') id: string, @Request() req) {
    return this.portfoliosService.deleteWatchlist(id, req.user.id);
  }

  @Post('watchlists/:id/items')
  addToWatchlist(@Param('id') id: string, @Request() req, @Body() dto: any) {
    return this.portfoliosService.addToWatchlist(id, req.user.id, dto);
  }

  @Delete('watchlists/:id/items/:ticker')
  removeFromWatchlist(@Param('id') id: string, @Param('ticker') ticker: string, @Request() req) {
    return this.portfoliosService.removeFromWatchlist(id, req.user.id, ticker);
  }
}
