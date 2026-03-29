import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Stock } from './stock.entity';
import { EodPrice } from './eod-price.entity';
import { Indice } from './indice.entity';

@Injectable()
export class StocksService {
  constructor(
    @InjectRepository(Stock) private stocksRepo: Repository<Stock>,
    @InjectRepository(EodPrice) private pricesRepo: Repository<EodPrice>,
    @InjectRepository(Indice) private indicesRepo: Repository<Indice>,
  ) {}

  findAll(search?: string) {
    const qb = this.stocksRepo.createQueryBuilder('stock')
      .where('stock.is_active = :active', { active: true })
      .orderBy('stock.ticker', 'ASC');

    if (search) {
      qb.andWhere(
        '(LOWER(stock.ticker) LIKE LOWER(:q) OR LOWER(stock.company_name) LIKE LOWER(:q))',
        { q: `%${search}%` },
      );
    }
    return qb.getMany();
  }

  async findOne(ticker: string) {
    const stock = await this.stocksRepo.findOne({ where: { ticker, isActive: true } });
    if (!stock) throw new NotFoundException(`Titre ${ticker} non trouvé`);
    return stock;
  }

  async getLatestPrices(ticker?: string) {
    const qb = this.pricesRepo
      .createQueryBuilder('price')
      .innerJoinAndSelect('price.stock', 'stock')
      .orderBy('price.trading_date', 'DESC')
      .limit(100);

    if (ticker) {
      qb.andWhere('stock.ticker = :ticker', { ticker });
    }

    const prices = await qb.getMany();
    // Deduplicate: keep only latest per ticker
    const latest = new Map<string, EodPrice>();
    for (const p of prices) {
      if (!latest.has(p.stock.ticker)) latest.set(p.stock.ticker, p);
    }
    return Array.from(latest.values());
  }

  async getHistory(ticker: string, days = 30) {
    const stock = await this.stocksRepo.findOne({ where: { ticker } });
    if (!stock) throw new NotFoundException(`Titre ${ticker} non trouvé`);

    const from = new Date();
    from.setDate(from.getDate() - days);

    return this.pricesRepo.find({
      where: { stockId: stock.id, tradingDate: Between(from.toISOString().slice(0, 10), new Date().toISOString().slice(0, 10)) },
      order: { tradingDate: 'ASC' },
    });
  }

  async getIndices() {
    const latest = await this.indicesRepo
      .createQueryBuilder('idx')
      .orderBy('idx.trading_date', 'DESC')
      .getOne();

    if (!latest) return [];
    return this.indicesRepo.find({ where: { tradingDate: latest.tradingDate } });
  }
}
