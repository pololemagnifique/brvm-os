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

  async getTechnicals(ticker: string) {
    const stock = await this.stocksRepo.findOne({ where: { ticker } });
    if (!stock) throw new NotFoundException(`Titre ${ticker} non trouvé`);

    // Lire l'historique depuis le fichier JSON (source complète)
    const histPath = '/data/.openclaw/workspace/brvm-os/dashboard/data/history/all_prices.json';
    let histData: Record<string, Record<string, number>> = {};
    try {
      histData = JSON.parse(require('fs').readFileSync(histPath, 'utf-8'));
    } catch {
      return { ticker, error: 'Fichier historique introuvable' };
    }

    // Construire la série chronologique pour ce ticker
    const dates = Object.keys(histData).sort(); // plus ancien → plus récent
    const closes: number[] = [];
    for (const d of dates) {
      if (histData[d][ticker]) closes.push(histData[d][ticker]);
    }

    if (closes.length < 2) {
      return { ticker, error: 'Historique insuffisant pour calculer les indicateurs' };
    }

    const latest = closes[closes.length - 1];
    const prevClose = closes[closes.length - 2];

    // RSI 14 ( Wilder's smoothed)
    const rsiPeriod = 14;
    let avgGain = 0, avgLoss = 0;
    if (closes.length > rsiPeriod) {
      for (let i = 1; i <= rsiPeriod; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff > 0) avgGain += diff;
        else avgLoss += Math.abs(diff);
      }
      avgGain /= rsiPeriod;
      avgLoss /= rsiPeriod;
      for (let i = rsiPeriod + 1; i < closes.length; i++) {
        const diff = closes[i] - closes[i - 1];
        avgGain = (avgGain * (rsiPeriod - 1) + (diff > 0 ? diff : 0)) / rsiPeriod;
        avgLoss = (avgLoss * (rsiPeriod - 1) + (diff < 0 ? Math.abs(diff) : 0)) / rsiPeriod;
      }
    }
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi14 = avgLoss === 0 ? 100 : Math.round((100 - 100 / (1 + rs)) * 10) / 10;

    // MM20 / MM50 / MM10
    const mm = (arr: number[], n: number) => arr.length >= n
      ? Math.round((arr.slice(-n).reduce((a, b) => a + b, 0) / n) * 100) / 100 : null;
    const mm10 = mm(closes, 10);
    const mm20 = mm(closes, 20);
    const mm50 = mm(closes, 50);

    // Support / Résistance sur 30j et max
    const last30 = closes.slice(-30);
    const support30 = Math.min(...last30);
    const resistance30 = Math.max(...last30);
    const support252 = Math.min(...closes);
    const resistance252 = Math.max(...closes);

    // Variations
    const var7j = closes.length >= 8
      ? Math.round(((latest - closes[closes.length - 8]) / closes[closes.length - 8]) * 10000) / 100
      : null;
    const var30j = closes.length >= 31
      ? Math.round(((latest - closes[closes.length - 31]) / closes[closes.length - 31]) * 10000) / 100
      : null;

    // Signal
    let signal: 'ACHAT' | 'VENTE' | 'NEUTRE' | 'SURVente' | 'SURACHAT' = 'NEUTRE';
    if (rsi14 < 30) signal = 'SURVente';
    else if (rsi14 > 70) signal = 'SURACHAT';
    else if (rsi14 < 40 && mm20 && latest > mm20) signal = 'ACHAT';
    else if (rsi14 > 60 && mm20 && latest < mm20) signal = 'VENTE';

    const vsMm = (m: number | null) => m
      ? Math.round(((latest - m) / m) * 10000) / 100 : null;

    return {
      ticker,
      date: dates[dates.length - 1],
      cours: latest,
      variationJour: Math.round(((latest - prevClose) / prevClose) * 10000) / 100,
      rsi14,
      mm10,
      mm20,
      mm50,
      support30,
      resistance30,
      support252,
      resistance252,
      var7j,
      var30j,
      signal,
      vsMm10: vsMm(mm10),
      vsMm20: vsMm(mm20),
      vsMm50: vsMm(mm50),
      nbJours: closes.length,
    };
  }
}
