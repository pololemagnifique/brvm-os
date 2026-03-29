import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PortfoliosService } from './portfolios.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { AddWatchlistItemDto } from './dto/add-watchlist-item.dto';
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

  // TRANSACTIONS
  @Get('portfolios/:portfolioId/transactions')
  getTransactions(@Param('portfolioId') id: string, @Request() req) {
    return this.portfoliosService.getTransactions(id, req.user.id);
  }

  @Post('portfolios/:portfolioId/transactions')
  addTransaction(@Param('portfolioId') id: string, @Request() req, @Body() dto: CreateTransactionDto) {
    return this.portfoliosService.addTransaction(id, req.user.id, dto);
  }

  @Get('portfolios/:portfolioId/positions')
  getPositions(@Param('portfolioId') id: string, @Request() req) {
    return this.portfoliosService.getPositions(id, req.user.id);
  }

  // WATCHLISTS
  @Get('watchlists')
  getWatchlists(@Request() req) {
    return this.portfoliosService.getWatchlists(req.user.id);
  }

  @Post('watchlists')
  createWatchlist(@Request() req, @Body() body: { name: string }) {
    return this.portfoliosService.createWatchlist(req.user.id, body.name);
  }

  @Post('watchlists/:watchlistId/items')
  addToWatchlist(@Param('watchlistId') id: string, @Request() req, @Body() dto: AddWatchlistItemDto) {
    return this.portfoliosService.addToWatchlist(id, req.user.id, dto);
  }

  @Delete('watchlists/:watchlistId/items/:stockId')
  removeFromWatchlist(@Param('watchlistId') watchlistId: string, @Param('stockId') stockId: string, @Request() req) {
    return this.portfoliosService.removeFromWatchlist(watchlistId, req.user.id, stockId);
  }
}
