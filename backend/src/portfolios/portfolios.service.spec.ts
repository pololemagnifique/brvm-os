import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { PortfoliosService } from './portfolios.service';
import { Portfolio } from './portfolio.entity';
import { Transaction, TransactionType } from './transaction.entity';
import { Watchlist } from './watchlist.entity';
import { WatchlistItem } from './watchlist-item.entity';
import { Stock } from '../stocks/stock.entity';

const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  delete: jest.fn(),
});

describe('PortfoliosService', () => {
  let service: PortfoliosService;
  let portfolioRepo: ReturnType<typeof mockRepo>;
  let txRepo: ReturnType<typeof mockRepo>;
  let watchlistRepo: ReturnType<typeof mockRepo>;
  let watchlistItemRepo: ReturnType<typeof mockRepo>;
  let stockRepo: ReturnType<typeof mockRepo>;

  const USER_ID = 'user-123';
  const PORTFOLIO_ID = 'port-456';
  const STOCK_ID = 'stock-789';

  const mockStock = { id: STOCK_ID, ticker: 'BRVM-SA', companyName: 'Société Amis', isActive: true };
  const mockPortfolio = { id: PORTFOLIO_ID, userId: USER_ID, name: 'Mon Portefeuille', createdAt: new Date() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfoliosService,
        { provide: getRepositoryToken(Portfolio), useFactory: mockRepo },
        { provide: getRepositoryToken(Transaction), useFactory: mockRepo },
        { provide: getRepositoryToken(Watchlist), useFactory: mockRepo },
        { provide: getRepositoryToken(WatchlistItem), useFactory: mockRepo },
        { provide: getRepositoryToken(Stock), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<PortfoliosService>(PortfoliosService);
    portfolioRepo = module.get(getRepositoryToken(Portfolio));
    txRepo = module.get(getRepositoryToken(Transaction));
    watchlistRepo = module.get(getRepositoryToken(Watchlist));
    watchlistItemRepo = module.get(getRepositoryToken(WatchlistItem));
    stockRepo = module.get(getRepositoryToken(Stock));
  });

  afterEach(() => jest.clearAllMocks());

  // ─── Portfolios ─────────────────────────────────────────────────────────

  describe('getPortfolios', () => {
    it('doit retourner les portefeuilles d un utilisateur', async () => {
      portfolioRepo.find.mockResolvedValue([mockPortfolio]);
      const result = await service.getPortfolios(USER_ID);
      expect(result).toEqual([mockPortfolio]);
      expect(portfolioRepo.find).toHaveBeenCalledWith({ where: { userId: USER_ID }, order: { createdAt: 'DESC' } });
    });

    it('doit retourner un tableau vide si aucun portefeuille', async () => {
      portfolioRepo.find.mockResolvedValue([]);
      const result = await service.getPortfolios(USER_ID);
      expect(result).toEqual([]);
    });
  });

  describe('createPortfolio', () => {
    it('doit créer un portefeuille', async () => {
      const dto = { name: 'Nouveau PF', description: 'desc' };
      portfolioRepo.create.mockReturnValue({ ...dto, userId: USER_ID });
      portfolioRepo.save.mockResolvedValue({ id: 'new', ...dto, userId: USER_ID });
      const result = await service.createPortfolio(USER_ID, dto);
      expect(portfolioRepo.create).toHaveBeenCalledWith({ ...dto, userId: USER_ID });
      expect(result.name).toBe('Nouveau PF');
    });
  });

  // ─── Transactions ────────────────────────────────────────────────────────

  describe('getTransactions', () => {
    it('doit retourner les transactions d un portefeuille', async () => {
      const tx = { id: 'tx-1', portfolioId: PORTFOLIO_ID, type: TransactionType.BUY, stock: mockStock };
      portfolioRepo.findOne.mockResolvedValue(mockPortfolio);
      txRepo.find.mockResolvedValue([tx]);
      const result = await service.getTransactions(PORTFOLIO_ID, USER_ID);
      expect(result).toEqual([tx]);
    });

    it('doit lever NotFoundException si portefeuille introuvable', async () => {
      portfolioRepo.findOne.mockResolvedValue(null);
      await expect(service.getTransactions(PORTFOLIO_ID, USER_ID)).rejects.toThrow(NotFoundException);
    });

    it('doit lever ForbiddenException si utilisateur non propriétaire', async () => {
      portfolioRepo.findOne.mockResolvedValue({ ...mockPortfolio, userId: 'autre' });
      await expect(service.getTransactions(PORTFOLIO_ID, USER_ID)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('addTransaction', () => {
    it('doit ajouter une transaction', async () => {
      const dto = { stockId: STOCK_ID, type: TransactionType.BUY, quantity: 10, price: 1000, transactionDate: '2025-01-01' };
      portfolioRepo.findOne.mockResolvedValue(mockPortfolio);
      txRepo.create.mockReturnValue({ ...dto, portfolioId: PORTFOLIO_ID });
      txRepo.save.mockResolvedValue({ id: 'new-tx', ...dto, portfolioId: PORTFOLIO_ID });
      const result = await service.addTransaction(PORTFOLIO_ID, USER_ID, dto);
      expect(txRepo.create).toHaveBeenCalledWith({ ...dto, portfolioId: PORTFOLIO_ID });
      expect(result.id).toBe('new-tx');
    });

    it('doit lever NotFoundException si portefeuille introuvable', async () => {
      portfolioRepo.findOne.mockResolvedValue(null);
      await expect(service.addTransaction(PORTFOLIO_ID, USER_ID, {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteTransaction', () => {
    it('doit supprimer une transaction', async () => {
      const tx = { id: 'tx-del', portfolioId: PORTFOLIO_ID };
      portfolioRepo.findOne.mockResolvedValue(mockPortfolio);
      txRepo.findOne.mockResolvedValue(tx);
      txRepo.remove.mockResolvedValue(tx);
      const result = await service.deleteTransaction(PORTFOLIO_ID, 'tx-del', USER_ID);
      expect(result).toEqual({ deleted: true, id: 'tx-del' });
    });

    it('doit lever NotFoundException si transaction introuvable', async () => {
      portfolioRepo.findOne.mockResolvedValue(mockPortfolio);
      txRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteTransaction(PORTFOLIO_ID, 'tx-missing', USER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Positions ────────────────────────────────────────────────────────────

  describe('getPositions', () => {
    it('doit calculer les positions avec PRU', async () => {
      portfolioRepo.findOne.mockResolvedValue(mockPortfolio);
      txRepo.find.mockResolvedValue([
        { id: 't1', stockId: STOCK_ID, type: TransactionType.BUY, quantity: 10, price: 1000, fees: 100, stock: mockStock, transactionDate: '2025-01-01' },
        { id: 't2', stockId: STOCK_ID, type: TransactionType.BUY, quantity: 5, price: 1200, fees: 50, stock: mockStock, transactionDate: '2025-01-15' },
      ]);
      const result = await service.getPositions(PORTFOLIO_ID, USER_ID);
      expect(result.length).toBe(1);
      expect(result[0].quantity).toBe(15);
      // totalCost = 10*1000+100 + 5*1200+50 = 10100+6050 = 16150
      expect(result[0].totalCost).toBe(16150);
      // avgCost = 16150/15 ≈ 1076.67
      expect(result[0].avgCost).toBeCloseTo(1076.67, 1);
    });

    it('doit retourner un tableau vide si aucune transaction', async () => {
      portfolioRepo.findOne.mockResolvedValue(mockPortfolio);
      txRepo.find.mockResolvedValue([]);
      const result = await service.getPositions(PORTFOLIO_ID, USER_ID);
      expect(result).toEqual([]);
    });

    it('doit lever NotFoundException si portefeuille introuvable', async () => {
      portfolioRepo.findOne.mockResolvedValue(null);
      await expect(service.getPositions(PORTFOLIO_ID, USER_ID)).rejects.toThrow(NotFoundException);
    });

    it('ne doit pas inclure les positions avec quantité nulle', async () => {
      portfolioRepo.findOne.mockResolvedValue(mockPortfolio);
      txRepo.find.mockResolvedValue([
        { id: 't1', stockId: STOCK_ID, type: TransactionType.BUY, quantity: 10, price: 1000, fees: 0, stock: mockStock, transactionDate: '2025-01-01' },
        { id: 't2', stockId: STOCK_ID, type: TransactionType.SELL, quantity: 10, price: 1200, fees: 0, stock: mockStock, transactionDate: '2025-01-15' },
      ]);
      const result = await service.getPositions(PORTFOLIO_ID, USER_ID);
      expect(result).toEqual([]);
    });
  });

  // ─── Summary ─────────────────────────────────────────────────────────────

  describe('getSummary', () => {
    it('doit retourner un résumé avec positions enrichies', async () => {
      portfolioRepo.findOne.mockResolvedValue(mockPortfolio);
      txRepo.find.mockResolvedValue([
        { id: 't1', stockId: STOCK_ID, type: TransactionType.BUY, quantity: 10, price: 1000, fees: 0, stock: mockStock, transactionDate: '2025-01-01' },
      ]);
      const result = await service.getSummary(PORTFOLIO_ID, USER_ID);
      expect(result.portfolio).toEqual(mockPortfolio);
      expect(result.totalInvested).toBe(10000);
      expect(result.transactionsCount).toBe(1);
      expect(Array.isArray(result.positions)).toBe(true);
    });

    it('doit lever NotFoundException si portefeuille introuvable', async () => {
      portfolioRepo.findOne.mockResolvedValue(null);
      await expect(service.getSummary(PORTFOLIO_ID, USER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Export CSV ───────────────────────────────────────────────────────────

  describe('exportCsv', () => {
    it('doit retourner un CSV valide', async () => {
      portfolioRepo.findOne.mockResolvedValue(mockPortfolio);
      txRepo.find.mockResolvedValue([
        { id: 't1', stockId: STOCK_ID, type: TransactionType.BUY, quantity: 10, price: 1000, fees: 50, stock: mockStock, transactionDate: '2025-01-01' },
      ]);
      const csv = await service.exportCsv(PORTFOLIO_ID, USER_ID);
      expect(csv).toContain('Date');
      expect(csv).toContain('BRVM-SA');
      expect(csv).toContain('BUY');
      expect(csv).toContain('10050'); // 10*1000+50
    });

    it('doit lever NotFoundException si portefeuille introuvable', async () => {
      portfolioRepo.findOne.mockResolvedValue(null);
      await expect(service.exportCsv(PORTFOLIO_ID, USER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Watchlists ───────────────────────────────────────────────────────────

  describe('getWatchlists', () => {
    it('doit retourner les watchlists', async () => {
      watchlistRepo.find.mockResolvedValue([{ id: 'wl-1', name: 'Suivi' }]);
      const result = await service.getWatchlists(USER_ID);
      expect(result).toHaveLength(1);
    });
  });

  describe('getWatchlist', () => {
    it('doit retourner une watchlist', async () => {
      const wl = { id: 'wl-1', userId: USER_ID, name: 'Suivi' };
      watchlistRepo.findOne.mockResolvedValue(wl);
      const result = await service.getWatchlist('wl-1', USER_ID);
      expect(result).toEqual(wl);
    });

    it('doit lever NotFoundException si watchlist introuvable', async () => {
      watchlistRepo.findOne.mockResolvedValue(null);
      await expect(service.getWatchlist('wl-missing', USER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createWatchlist', () => {
    it('doit créer une watchlist', async () => {
      const saved = { id: 'wl-new', userId: USER_ID, name: 'Nouveau' };
      watchlistRepo.create.mockReturnValue(saved);
      watchlistRepo.save.mockResolvedValue(saved);
      stockRepo.findOne.mockResolvedValue(mockStock);
      watchlistItemRepo.findOne.mockResolvedValue(null);
      watchlistItemRepo.create.mockReturnValue({ watchlistId: 'wl-new', stockId: STOCK_ID });
      watchlistItemRepo.save.mockResolvedValue({});
      watchlistRepo.findOne.mockResolvedValue({ ...saved, items: [] });
      const result = await service.createWatchlist(USER_ID, { name: 'Nouveau', tickers: ['BRVM-SA'] });
      expect(watchlistRepo.create).toHaveBeenCalled();
    });
  });

  describe('addToWatchlist', () => {
    it('doit ajouter un ticker à la watchlist', async () => {
      const wl = { id: 'wl-1', userId: USER_ID, name: 'Suivi' };
      watchlistRepo.findOne.mockResolvedValue(wl);
      stockRepo.findOne.mockResolvedValue(mockStock);
      watchlistItemRepo.findOne.mockResolvedValue(null);
      watchlistItemRepo.create.mockReturnValue({ watchlistId: 'wl-1', stockId: STOCK_ID });
      watchlistItemRepo.save.mockResolvedValue({ id: 'item-new' });
      const result = await service.addToWatchlist('wl-1', USER_ID, { ticker: 'BRVM-SA' });
      expect(result.id).toBe('item-new');
    });

    it('doit retourner l item existant si déjà présent', async () => {
      const wl = { id: 'wl-1', userId: USER_ID, name: 'Suivi' };
      watchlistRepo.findOne.mockResolvedValue(wl);
      stockRepo.findOne.mockResolvedValue(mockStock);
      const existing = { id: 'item-existing' };
      watchlistItemRepo.findOne.mockResolvedValue(existing);
      const result = await service.addToWatchlist('wl-1', USER_ID, { ticker: 'BRVM-SA' });
      expect(result).toEqual(existing);
    });

    it('doit lever NotFoundException si ticker introuvable', async () => {
      const wl = { id: 'wl-1', userId: USER_ID, name: 'Suivi' };
      watchlistRepo.findOne.mockResolvedValue(wl);
      stockRepo.findOne.mockResolvedValue(null);
      await expect(service.addToWatchlist('wl-1', USER_ID, { ticker: 'INVALID' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteWatchlist', () => {
    it('doit supprimer une watchlist', async () => {
      const wl = { id: 'wl-1', userId: USER_ID, name: 'Suivi' };
      watchlistRepo.findOne.mockResolvedValue(wl);
      watchlistRepo.remove.mockResolvedValue(wl);
      const result = await service.deleteWatchlist('wl-1', USER_ID);
      expect(result).toEqual({ deleted: true });
    });
  });

  describe('removeFromWatchlist', () => {
    it('doit retirer un ticker de la watchlist', async () => {
      const wl = { id: 'wl-1', userId: USER_ID, name: 'Suivi' };
      watchlistRepo.findOne.mockResolvedValue(wl);
      stockRepo.findOne.mockResolvedValue(mockStock);
      watchlistItemRepo.delete.mockResolvedValue({ affected: 1 });
      const result = await service.removeFromWatchlist('wl-1', USER_ID, 'BRVM-SA');
      expect(result).toEqual({ deleted: true });
    });
  });
});
