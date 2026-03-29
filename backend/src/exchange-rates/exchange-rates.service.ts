import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExchangeRate } from './exchange-rate.entity';

@Injectable()
export class ExchangeRatesService {
  private readonly logger = new Logger(ExchangeRatesService.name);

  /** Fixed BCEAO peg: 1 EUR = 655.957 XOF */
  private readonly BCEAO_PEG = 655.957;

  constructor(
    @InjectRepository(ExchangeRate)
    private readonly rateRepo: Repository<ExchangeRate>,
  ) {}

  /**
   * Fetch USD→XOF and EUR→XOF rates from live sources.
   * Primary: XE.com scraper
   * Fallback: Frankfurter (USD→EUR) + BCEAO peg
   */
  async fetchRates(): Promise<{
    usdToXof: number;
    eurToXof: number;
    usdToEur: number;
    source: string;
  }> {
    // Try XE.com first
    try {
      const usdToXof = await this.fetchXeCom('USD', 'XOF');
      return {
        usdToXof,
        eurToXof: this.BCEAO_PEG,
        usdToEur: usdToXof / this.BCEAO_PEG,
        source: 'xe.com',
      };
    } catch (xeErr) {
      this.logger.warn(`XE.com failed: ${xeErr.message}, trying Frankfurter...`);
    }

    // Fallback: Frankfurter (USD → EUR) + peg
    const usdToEur = await this.fetchFrankfurterUsdToEur();
    return {
      usdToXof: usdToEur * this.BCEAO_PEG,
      eurToXof: this.BCEAO_PEG,
      usdToEur,
      source: 'frankfurter+bceao_pegs',
    };
  }

  /** Fetch a rate from XE.com converter page */
  private async fetchXeCom(from: string, to: string): Promise<number> {
    const url = `https://www.xe.com/currencyconverter/convert/?Amount=1&From=${from}&To=${to}`;
    const resp = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });
    if (!resp.ok) throw new Error(`XE HTTP ${resp.status}`);
    const html = await resp.text();
    const m = html.match(
      new RegExp(
        `1\\s+${from}\\s*=\\s*([\\d]+\\.[\\d]+)\\s*${to}`,
        'i',
      ),
    );
    if (!m) throw new Error('Rate not found in XE.com HTML');
    return parseFloat(m[1]);
  }

  /** Fetch USD→EUR from Frankfurter (European Central Bank) */
  private async fetchFrankfurterUsdToEur(): Promise<number> {
    const url = 'https://api.frankfurter.app/latest?from=USD&to=EUR';
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'BRVM-OS/1.0' },
    });
    if (!resp.ok) throw new Error(`Frankfurter HTTP ${resp.status}`);
    const data = (await resp.json()) as { rates: { EUR: number } };
    return data.rates.EUR;
  }

  /** Save or update today's rate */
  async saveRate(): Promise<ExchangeRate> {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const { usdToXof, eurToXof, usdToEur, source } =
      await this.fetchRates();

    let rate = await this.rateRepo.findOne({ where: { rateDate: today } });
    if (rate) {
      rate.usdToXof = usdToXof;
      rate.eurToXof = eurToXof;
      rate.usdToEur = usdToEur;
      rate.source = source;
    } else {
      rate = this.rateRepo.create({
        rateDate: today,
        usdToXof,
        eurToXof,
        usdToEur,
        source,
      });
    }
    return this.rateRepo.save(rate);
  }

  /** Get today's rate */
  async getTodayRate(): Promise<ExchangeRate | null> {
    const today = new Date().toISOString().slice(0, 10);
    return this.rateRepo.findOne({ where: { rateDate: today } });
  }

  /** Get latest N rates */
  async getLatestRates(limit = 30): Promise<ExchangeRate[]> {
    return this.rateRepo.find({
      order: { rateDate: 'DESC' },
      take: limit,
    });
  }
}
