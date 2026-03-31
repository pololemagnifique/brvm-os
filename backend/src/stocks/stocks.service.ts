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

  /**
   * Retourne le stock avec indicateurs fondamentaux calculés.
   * Note : BPA, dividende, PER et rendement_div ne sont pas publiés par la BRVM.
   * capitalisation utilise le nombre d'actions en circulation (données approximations/officielles).
   * volume_moy est calculé sur les 20 derniers jours de cotation (EodPrice DB).
   */
  async getStock(ticker: string) {
    const stock = await this.stocksRepo.findOne({ where: { ticker, isActive: true } });
    if (!stock) throw new NotFoundException(`Titre ${ticker} non trouvé`);

    // Récupérer le dernier cours depuis eod_data.json
    const eodPath = '/data/.openclaw/workspace/brvm-os/dashboard/data/eod_data.json';
    let cours: number | null = null;
    try {
      const eodRaw = require('fs').readFileSync(eodPath, 'utf-8');
      const eodData = JSON.parse(eodRaw);
      const entry = (eodData.stocks || []).find((s: any) => s.ticker === ticker);
      if (entry) cours = entry.last ?? entry.prev_close ?? null;
    } catch { /* cours reste null */ }

    // Volume moyen 20j depuis la DB
    const twentyDaysAgo = new Date();
    twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 30);
    const priceRows = await this.pricesRepo.find({
      where: {
        stockId: stock.id,
        tradingDate: Between(
          twentyDaysAgo.toISOString().slice(0, 10),
          new Date().toISOString().slice(0, 10),
        ),
      },
      order: { tradingDate: 'DESC' },
      select: ['volume'],
    });
    const volumes = priceRows.map((r) => Number(r.volume)).filter((v) => v > 0);
    const volume_moy = volumes.length > 0
      ? Math.round((volumes.reduce((a, b) => a + b, 0) / volumes.length) * 100) / 100
      : null;

    // Données fondamentales statiques (approximations pour les grandes valeurs BRVM)
    // Source : publications AMF-UMOA / rapports annuels (quand disponibles)
    // Si non disponible, tous les champs sont null
    const fondamentalData = this.getFundamentalData(ticker);

    // Calcul du PER et rendement dividende si BPA connu
    let per: number | null = null;
    let rendement_div: number | null = null;
    if (cours && fondamentalData.bpa && fondamentalData.bpa > 0) {
      per = Math.round((cours / fondamentalData.bpa) * 100) / 100;
    }
    if (cours && fondamentalData.dividende && fondamentalData.dividende > 0) {
      rendement_div = Math.round((fondamentalData.dividende / cours) * 10000) / 100;
    }

    // Capitalisation = cours × nombre d'actions
    let capitalisation: string | null = null;
    if (cours && fondamentalData.nombre_actions) {
      const cap = cours * fondamentalData.nombre_actions;
      if (cap >= 1_000_000_000) {
        capitalisation = `${Math.round(cap / 1_000_000_000 * 100) / 100} Mds FCFA`;
      } else {
        capitalisation = `${Math.round(cap / 1_000_000)} M FCFA`;
      }
    }

    return {
      ...stock,
      cours,
      bpa: fondamentalData.bpa,
      dividende: fondamentalData.dividende,
      per,
      rendement_div,
      volume_moy,
      capitalisation,
      source_donnees_fondamentales: fondamentalData.source || 'BRVM (non publié — données non disponibles publiquement)',
    };
  }

  /**
   * Données fondamentales approximatives pour les principales valeurs BRVM.
   * Sources : rapports annuels, publications AMF-UMOA, notifications de dividende.
   * Mis à jour manuellement lors de la publication des résultats.
   * Si absent : tous les champs = null (données non publiquement disponibles).
   */
  private getFundamentalData(ticker: string): {
    bpa: number | null;
    dividende: number | null;
    nombre_actions: number | null;
    source: string | null;
  } {
    // Map des données fondamentales disponibles (approximations/officiel)
    // format: { bpa: BPA 2024, dividende: dernier dividende versé, nombre_actions: en circulation }
    const data: Record<string, { bpa: number | null; dividende: number | null; nombre_actions: number; source: string }> = {
      'BOAC':  { bpa: null, dividende: null, nombre_actions: 194994840, source: 'Estimatif — données non publiées par BRVM' },
      'BOAB':  { bpa: null, dividende: null, nombre_actions: 201840846, source: 'Estimatif — données non publiées par BRVM' },
      'BOAS':  { bpa: null, dividende: null, nombre_actions: 60000000,  source: 'Estimatif — données non publiées par BRVM' },
      'BOAM':  { bpa: null, dividende: null, nombre_actions: 80000000,  source: 'Estimatif — données non publiées par BRVM' },
      'BOAN':  { bpa: null, dividende: null, nombre_actions: 100000000, source: 'Estimatif — données non publiées par BRVM' },
      'SGBC':  { bpa: null, dividende: null, nombre_actions: 29640000,  source: 'Estimatif — données non publiées par BRVM' },
      'CCEI':  { bpa: null, dividende: null, nombre_actions: 45000000,  source: 'Estimatif — données non publiées par BRVM' },
      'NSIA':  { bpa: null, dividende: null, nombre_actions: 85000000,  source: 'Estimatif — données non publiées par BRVM' },
      'STAC':  { bpa: null, dividende: null, nombre_actions: 54000000,  source: 'Estimatif — données non publiées par BRVM' },
      'SNTS':  { bpa: null, dividende: null, nombre_actions: 80000000,  source: 'Estimatif — données non publiées par BRVM' },
      'ABJC':  { bpa: null, dividende: null, nombre_actions: 35000000,  source: 'Estimatif — données non publiées par BRVM' },
      'SIC':   { bpa: null, dividende: null, nombre_actions: 30000000,  source: 'Estimatif — données non publiées par BRVM' },
      'SONATEL': { bpa: null, dividende: null, nombre_actions: 243600000, source: 'Estimatif — données non publiées par BRVM' },
      'SODE':  { bpa: null, dividende: null, nombre_actions: 35000000,  source: 'Estimatif — données non publiées par BRVM' },
      'CABC':  { bpa: null, dividende: null, nombre_actions: 25000000,  source: 'Estimatif — données non publiées par BRVM' },
    };

    const known = data[ticker];
    if (!known) return { bpa: null, dividende: null, nombre_actions: null, source: null };
    return known;
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

    // MM20 / MM50 / MM100 / MM10
    const mm = (arr: number[], n: number) => arr.length >= n
      ? Math.round((arr.slice(-n).reduce((a, b) => a + b, 0) / n) * 100) / 100 : null;
    const mm10 = mm(closes, 10);
    const mm20 = mm(closes, 20);
    const mm50 = mm(closes, 50);
    const mm100 = mm(closes, 100);

    // EMA helper
    const ema = (arr: number[], period: number): number | null => {
      if (arr.length < period) return null;
      const k = 2 / (period + 1);
      // Seed with SMA of first `period` values
      let emaVal = arr.slice(0, period).reduce((a, b) => a + b, 0) / period;
      for (let i = period; i < arr.length; i++) {
        emaVal = arr[i] * k + emaVal * (1 - k);
      }
      return Math.round(emaVal * 100) / 100;
    };

    const ema12 = ema(closes, 12);
    const ema26 = ema(closes, 26);

    // MACD: EMA12 - EMA26, Signal = EMA9 of MACD line, Histogram = MACD - Signal
    let macdLine: number | null = null;
    let macdSignal: number | null = null;
    let macdHistogram: number | null = null;
    if (ema12 !== null && ema26 !== null) {
      macdLine = Math.round((ema12 - ema26) * 100) / 100;
      // Build MACD series
      const macdSeries: number[] = [];
      for (let i = 26; i < closes.length; i++) {
        const e12 = ema(closes.slice(0, i + 1), 12);
        const e26 = ema(closes.slice(0, i + 1), 26);
        if (e12 !== null && e26 !== null) {
          macdSeries.push(Math.round((e12 - e26) * 100) / 100);
        }
      }
      if (macdSeries.length >= 9) {
        const signalEma = ema(macdSeries, 9);
        macdSignal = signalEma;
        if (macdLine !== null && macdSignal !== null) {
          macdHistogram = Math.round((macdLine - macdSignal) * 100) / 100;
        }
      }
    }

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
      mm100,
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
      vsMm100: vsMm(mm100),
      macd_line: macdLine,
      macd_signal: macdSignal,
      macd_histogram: macdHistogram,
      nbJours: closes.length,
    };
  }

  async getCorporate(ticker: string) {
    const calPath = '/data/brvm-os/backend/data/corporate_calendar.json';
    try {
      const raw = require('fs').readFileSync(calPath, 'utf-8');
      const cal = JSON.parse(raw);
      const dividends = (cal.dividendes_brvm_scrape || [])
        .filter((e: any) => e.ticker === ticker)
        .sort((a: any, b: any) => (b.exercice || 0) - (a.exercice || 0))
        .slice(0, 5)
        .map((e: any) => ({
          exercice: e.exercice,
          montant_net: e.montant_net_fcfa,
          date_paiement: e.date_paiement,
          date_ex_dividende: e.date_ex_dividende,
          source: e.source,
        }));

      const ags = (cal.ag_convoquees || [])
        .filter((e: any) => e.ticker === ticker)
        .sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''))
        .slice(0, 3)
        .map((e: any) => ({ date: e.date, type: e.type, source: e.source }));

      return { ticker, dividendes: dividends, ags };
    } catch {
      return { ticker, dividendes: [], ags: [], error: 'Calendrier corporate indisponible' };
    }
  }
}
