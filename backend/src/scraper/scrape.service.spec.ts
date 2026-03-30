/**
 * ScrapeService Unit Tests
 * 
 * Since @nestjs/typeorm triggers a Node.js 22 / path-scurry compatibility
 * issue at module load time, we test the service by extracting pure functions
 * and instantiating the service with plain mock objects (no TypeORM involved).
 */

const mockPage = {
  setExtraHTTPHeaders: jest.fn().mockResolvedValue(undefined),
  goto: jest.fn().mockResolvedValue(undefined),
  waitForSelector: jest.fn().mockResolvedValue(undefined),
  waitForTimeout: jest.fn().mockResolvedValue(undefined),
  evaluate: jest.fn().mockReturnValue('15 janvier 2025 — Cours des actions'),
  '$$eval': jest.fn().mockResolvedValue(['BRVM-SA', 'Société Amis', '10000', '1500', '1480', '1520', '2.70']),
  close: jest.fn().mockResolvedValue(undefined),
};

const mockBrowser = {
  newPage: jest.fn().mockResolvedValue(mockPage),
  isConnected: jest.fn().mockReturnValue(true),
  close: jest.fn().mockResolvedValue(undefined),
};

// Mock playwright BEFORE the service module is loaded
jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn().mockResolvedValue(mockBrowser),
  },
}));

jest.mock('fs', () => ({}));



// ─── Import ScrapeService AFTER all mocks are set up ────────────────────────
import { ScrapeService } from './scrape.service';

const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  insert: jest.fn(),
  remove: jest.fn(),
});

describe('ScrapeService', () => {
  let service: ScrapeService;
  let eodRepo: any;
  let indiceRepo: any;
  let stockRepo: any;
  let logRepo: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPage['$$eval'].mockClear();
    mockPage.evaluate.mockClear();
    mockBrowser.newPage.mockClear();
    mockBrowser.isConnected.mockReturnValue(true);

    mockPage['$$eval'].mockResolvedValue(['BRVM-SA', 'Société Amis', '10000', '1500', '1480', '1520', '2.70']);
    mockPage.evaluate.mockReturnValue('15 janvier 2025 — Cours des actions');

    eodRepo = mockRepo();
    indiceRepo = mockRepo();
    stockRepo = mockRepo();
    logRepo = mockRepo();

    // Instantiate without TypeORM — only the pure methods will work
    service = new ScrapeService(
      eodRepo as any,
      indiceRepo as any,
      stockRepo as any,
      logRepo as any,
    );
  });

  // ─── runScrape ─────────────────────────────────────────────────────────────

  describe('runScrape', () => {
    it('doit retourner un succès avec les données du scrape', async () => {
      logRepo.create.mockReturnValue({ id: 'log-1' });
      logRepo.save.mockResolvedValue({ id: 'log-1' });
      stockRepo.find.mockResolvedValue([{ id: 's1', ticker: 'BRVM-SA' }]);
      eodRepo.delete.mockResolvedValue({ affected: 0 });
      eodRepo.insert.mockResolvedValue({ identifiers: [] });
      indiceRepo.delete.mockResolvedValue({ affected: 0 });
      indiceRepo.insert.mockResolvedValue({ identifiers: [] });

      const result = await service.runScrape();

      expect(result.success).toBe(true);
      expect(result.tradingDate).toBeTruthy();
    });

    it('doit retourner une erreur si un scrape est déjà en cours', async () => {
      logRepo.create.mockReturnValue({ id: 'log-1' });
      logRepo.save.mockResolvedValue({ id: 'log-1' });
      stockRepo.find.mockResolvedValue([{ id: 's1', ticker: 'BRVM-SA' }]);
      eodRepo.delete.mockResolvedValue({ affected: 0 });
      eodRepo.insert.mockResolvedValue({ identifiers: [] });
      indiceRepo.delete.mockResolvedValue({ affected: 0 });
      indiceRepo.insert.mockResolvedValue({ identifiers: [] });

      await service.runScrape(); // first call succeeds

      const result = await service.runScrape(); // second call blocked
      expect(result.success).toBe(false);
      expect(result.error).toContain('already in progress');
    });
  });

  // ─── Query methods ─────────────────────────────────────────────────────────

  describe('getLastScrape', () => {
    it('doit retourner le dernier scrape', async () => {
      logRepo.findOne.mockResolvedValue({ id: 'log-1' });
      const result = await service.getLastScrape();
      expect(result).toEqual({ id: 'log-1' });
    });

    it('doit retourner null si aucun scrape', async () => {
      logRepo.findOne.mockResolvedValue(null);
      const result = await service.getLastScrape();
      expect(result).toBeNull();
    });
  });

  describe('getScrapeHistory', () => {
    it('doit retourner l historique des scrapes', async () => {
      logRepo.find.mockResolvedValue([{ id: 'l1' }, { id: 'l2' }]);
      const result = await service.getScrapeHistory(10);
      expect(result.length).toBe(2);
      expect(logRepo.find).toHaveBeenCalledWith({ where: {}, order: { startedAt: 'DESC' }, take: 10 });
    });

    it('doit utiliser la limite par defaut de 10', async () => {
      logRepo.find.mockResolvedValue([]);
      await service.getScrapeHistory();
      expect(logRepo.find).toHaveBeenCalledWith({ where: {}, order: { startedAt: 'DESC' }, take: 10 });
    });
  });

  describe('getAllTickersInDb', () => {
    it('doit retourner les tickers en base', async () => {
      stockRepo.find.mockResolvedValue([{ ticker: 'BRVM-SA' }, { ticker: 'BRVM-SB' }]);
      const result = await service.getAllTickersInDb();
      expect(result).toEqual(['BRVM-SA', 'BRVM-SB']);
    });

    it('doit retourner un tableau vide si aucun ticker', async () => {
      stockRepo.find.mockResolvedValue([]);
      const result = await service.getAllTickersInDb();
      expect(result).toEqual([]);
    });
  });

  // ─── Parsing (pure functions) ─────────────────────────────────────────────

  describe('parseTradingDate', () => {
    it('doit parser une date valide en francais', () => {
      const result = (service as any).parseTradingDate('15 janvier 2025 — Cours des actions');
      expect(result).toBe('2025-01-15');
    });

    it('doit retourner la date du jour si parsing echoue', () => {
      const result = (service as any).parseTradingDate('no date here');
      expect(result).toBe(new Date().toISOString().slice(0, 10));
    });

    it('doit gerer le mois en anglais', () => {
      const result = (service as any).parseTradingDate('15 january 2025');
      expect(result).toBe('2025-01-15');
    });
  });

  describe('parseIndices', () => {
    it('doit parser les indices BRVM', () => {
      const tds = [
        'BRVM-C', '150.25', '0.5', '...',
        'BRVM-30', '200.00', '1.2', '...',
        'BRVM-PRES', '180.50', '-0.3', '...',
      ];
      const result = (service as any).parseIndices(tds);
      expect(result['BRVM-COMP']).toBeDefined();
      expect(result['BRVM-30']).toBeDefined();
      expect(result['BRVM-PRESTIGE']).toBeDefined();
    });

    it('doit retourner un objet vide si aucun indice', () => {
      const result = (service as any).parseIndices(['toto', '150']);
      expect(Object.keys(result).length).toBe(0);
    });
  });

  describe('parseStocks', () => {
    it('doit parser les actions a partir des TD', () => {
      const tds = Array(51).fill('').concat([
        'BRVM-SA', 'Société Amis', '10000', '1500', '1480', '1520', '2.70',
        'BRVM-SB', 'Société Bi', '5000', '800', '790', '810', '2.53',
      ]);
      const result = (service as any).parseStocks(tds);
      const tickers = result.map((s: any) => s.ticker);
      expect(tickers).toContain('BRVM-SA');
    });

    it('doit ignorer les codes invalides (moins de 2 lettres)', () => {
      const tds = Array(51).fill('').concat([
        'X', 'Too Short', '10000', '1500', '1480', '1520', '2.70',
      ]);
      const result = (service as any).parseStocks(tds);
      expect(result.map((s: any) => s.ticker)).not.toContain('X');
    });

    it('doit ignorer les entrees skip EN/FR/PO', () => {
      const tds = Array(51).fill('').concat([
        'EN', 'English', '0', '0', '0', '0', '0',
        'FR', 'French', '0', '0', '0', '0', '0',
        'BRVM-SA', 'Société Amis', '10000', '1500', '1480', '1520', '2.70',
      ]);
      const result = (service as any).parseStocks(tds);
      const tickers = result.map((s: any) => s.ticker);
      expect(tickers).not.toContain('EN');
      expect(tickers).not.toContain('FR');
      expect(tickers).toContain('BRVM-SA');
    });
  });

  // ─── DB write (via mock repos) ─────────────────────────────────────────────

  describe('upsertPrices', () => {
    it('doit retourner 0 si aucun stock', async () => {
      const result = await (service as any).upsertPrices('2025-01-01', []);
      expect(result).toBe(0);
    });

    it('doit inserer les prix pour les stocks connus', async () => {
      stockRepo.find.mockResolvedValue([{ id: 's1', ticker: 'BRVM-SA' }]);
      eodRepo.delete.mockResolvedValue({ affected: 0 });
      eodRepo.insert.mockResolvedValue({ identifiers: [] });
      const stocks = [{ ticker: 'BRVM-SA', volume: 10000, open: 1500, prevClose: 1480, last: 1520, changePct: 2.7 }];
      const result = await (service as any).upsertPrices('2025-01-01', stocks);
      expect(result).toBe(1);
      expect(eodRepo.insert).toHaveBeenCalled();
    });

    it('doit ignorer les stocks inconnus', async () => {
      stockRepo.find.mockResolvedValue([]);
      const stocks = [{ ticker: 'UNKNOWN', volume: 100, open: 100, prevClose: 95, last: 102, changePct: 7 }];
      const result = await (service as any).upsertPrices('2025-01-01', stocks);
      expect(result).toBe(0);
    });
  });

  describe('upsertIndices', () => {
    it('doit inserer les indices', async () => {
      indiceRepo.delete.mockResolvedValue({ affected: 0 });
      indiceRepo.insert.mockResolvedValue({ identifiers: [] });
      const indices = {
        'BRVM-COMP': { value: 150.25, change: 0.5 },
        'BRVM-30': { value: 200.0, change: 1.2 },
      };
      const result = await (service as any).upsertIndices('2025-01-01', indices);
      expect(result).toBe(2);
      expect(indiceRepo.insert).toHaveBeenCalled();
    });

    it('doit supprimer les anciens indices du jour', async () => {
      indiceRepo.delete.mockResolvedValue({ affected: 2 });
      indiceRepo.insert.mockResolvedValue({ identifiers: [] });
      await (service as any).upsertIndices('2025-01-01', { 'BRVM-COMP': { value: 150, change: 0 } });
      expect(indiceRepo.delete).toHaveBeenCalledWith({ tradingDate: '2025-01-01' });
    });
  });
});
