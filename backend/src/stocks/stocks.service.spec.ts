import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { StocksService } from './stocks.service';
import { Stock } from './stock.entity';
import { EodPrice } from './eod-price.entity';
import { Indice } from './indice.entity';

const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('StocksService', () => {
  let service: StocksService;
  let stocksRepo: ReturnType<typeof mockRepo>;
  let pricesRepo: ReturnType<typeof mockRepo>;
  let indicesRepo: ReturnType<typeof mockRepo>;

  const mockStock = { id: 's1', ticker: 'BRVM-SA', companyName: 'Société Amis', isActive: true };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StocksService,
        { provide: getRepositoryToken(Stock), useFactory: mockRepo },
        { provide: getRepositoryToken(EodPrice), useFactory: mockRepo },
        { provide: getRepositoryToken(Indice), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<StocksService>(StocksService);
    stocksRepo = module.get(getRepositoryToken(Stock));
    pricesRepo = module.get(getRepositoryToken(EodPrice));
    indicesRepo = module.get(getRepositoryToken(Indice));
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('doit retourner toutes les actions actives', async () => {
      const qbMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockStock]),
      };
      stocksRepo.createQueryBuilder.mockReturnValue(qbMock);
      const result = await service.findAll();
      expect(result).toEqual([mockStock]);
      expect(qbMock.where).toHaveBeenCalledWith('stock.is_active = :active', { active: true });
    });

    it('doit filtrer par recherche', async () => {
      const qbMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockStock]),
      };
      stocksRepo.createQueryBuilder.mockReturnValue(qbMock);
      await service.findAll('BRVM');
      expect(qbMock.andWhere).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('doit retourner une action par ticker', async () => {
      stocksRepo.findOne.mockResolvedValue(mockStock);
      const result = await service.findOne('BRVM-SA');
      expect(result).toEqual(mockStock);
      expect(stocksRepo.findOne).toHaveBeenCalledWith({ where: { ticker: 'BRVM-SA', isActive: true } });
    });

    it('doit lever NotFoundException si action introuvable', async () => {
      stocksRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('INVALID')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getLatestPrices', () => {
    it('doit retourner les derniers prix dedoublonnes', async () => {
      const price1 = { id: 'p1', stock: { ticker: 'BRVM-SA' }, tradingDate: '2025-01-03', closePrice: 100 };
      const price2 = { id: 'p2', stock: { ticker: 'BRVM-SA' }, tradingDate: '2025-01-02', closePrice: 95 };
      const price3 = { id: 'p3', stock: { ticker: 'BRVM-SB' }, tradingDate: '2025-01-03', closePrice: 200 };
      const qbMock = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([price1, price2, price3]),
      };
      pricesRepo.createQueryBuilder.mockReturnValue(qbMock);
      const result = await service.getLatestPrices();
      expect(result.length).toBe(2); // deduplicated: only latest per ticker
    });

    it('doit filtrer par ticker si fourni', async () => {
      const qbMock = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      pricesRepo.createQueryBuilder.mockReturnValue(qbMock);
      await service.getLatestPrices('BRVM-SA');
      expect(qbMock.andWhere).toHaveBeenCalledWith('stock.ticker = :ticker', { ticker: 'BRVM-SA' });
    });
  });

  describe('getHistory', () => {
    it('doit retourner l historique des prix', async () => {
      stocksRepo.findOne.mockResolvedValue(mockStock);
      const prices = [{ id: 'p1', closePrice: 100 }, { id: 'p2', closePrice: 95 }];
      pricesRepo.find.mockResolvedValue(prices);
      const result = await service.getHistory('BRVM-SA', 30);
      expect(result).toEqual(prices);
      expect(pricesRepo.find).toHaveBeenCalled();
    });

    it('doit lever NotFoundException si action introuvable', async () => {
      stocksRepo.findOne.mockResolvedValue(null);
      await expect(service.getHistory('INVALID')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getIndices', () => {
    it('doit retourner les indices', async () => {
      const latest = { tradingDate: '2025-01-03' };
      const indices = [{ indexKey: 'BRVM-COMP', name: 'BRVM Composite', value: 100 }];
      const qbMock = {
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(latest),
      };
      indicesRepo.createQueryBuilder.mockReturnValue(qbMock);
      indicesRepo.find.mockResolvedValue(indices);
      const result = await service.getIndices();
      expect(result).toEqual(indices);
    });

    it('doit retourner un tableau vide si aucun indice', async () => {
      const qbMock = {
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      indicesRepo.createQueryBuilder.mockReturnValue(qbMock);
      const result = await service.getIndices();
      expect(result).toEqual([]);
    });
  });
});
