import { ExchangeRatesService } from './exchange-rates.service';
import { ExchangeRate } from './exchange-rate.entity';

const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const TODAY = new Date().toISOString().slice(0, 10);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeMockFetch = () => jest.fn() as any;

describe('ExchangeRatesService', () => {
  let service: ExchangeRatesService;
  let rateRepo: ReturnType<typeof mockRepo>;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = makeMockFetch();
    global.fetch = mockFetch;

    rateRepo = mockRepo();

    // Use Object.setPrototypeOf to properly set the prototype chain
    // so that instanceof checks work if needed
    const repoInstance = {
      find: rateRepo.find,
      findOne: rateRepo.findOne,
      create: rateRepo.create,
      save: rateRepo.save,
    };
    service = new ExchangeRatesService(repoInstance as any);
  });

  afterEach(() => {
    delete (global as any).fetch;
  });

  describe('fetchRates', () => {
    it('doit retourner les taux depuis XE.com', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '1 USD = 611.50 XOF',
      });
      const result = await service.fetchRates();
      expect(result.usdToXof).toBe(611.5);
      expect(result.eurToXof).toBe(655.957);
      expect(result.source).toBe('xe.com');
    });

    it('doit utiliser Frankfurter en fallback si XE.com échoue', async () => {
      // XE.com fails
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
      // Frankfurter succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rates: { EUR: 0.92 } }),
      });

      const result = await service.fetchRates();
      expect(result.source).toBe('frankfurter+bceao_pegs');
      expect(result.usdToXof).toBeCloseTo(0.92 * 655.957, 1);
      expect(result.eurToXof).toBe(655.957);
    });
  });

  describe('saveRate', () => {
    it('doit créer un nouveau taux si aucun existant pour aujourd hui', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '1 USD = 611.50 XOF',
      });
      rateRepo.findOne.mockResolvedValue(null);
      rateRepo.create.mockReturnValue({ rateDate: TODAY, usdToXof: 611.5, eurToXof: 655.957, usdToEur: 0.9329, source: 'xe.com' });
      rateRepo.save.mockResolvedValue({ id: 'rate-1', rateDate: TODAY });
      const result = await service.saveRate();
      expect(rateRepo.create).toHaveBeenCalled();
      expect(rateRepo.save).toHaveBeenCalled();
    });

    it('doit mettre à jour le taux existant pour aujourd hui', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '1 USD = 620.00 XOF',
      });
      const existing = { id: 'rate-1', rateDate: TODAY, usdToXof: 611.5 };
      rateRepo.findOne.mockResolvedValue(existing);
      rateRepo.save.mockResolvedValue({ ...existing, usdToXof: 620 });
      const result = await service.saveRate();
      expect(rateRepo.findOne).toHaveBeenCalledWith({ where: { rateDate: TODAY } });
      expect(rateRepo.save).toHaveBeenCalled();
    });
  });

  describe('getTodayRate', () => {
    it('doit retourner le taux du jour', async () => {
      const todayRate = { id: 'r1', rateDate: TODAY, usdToXof: 611.5 };
      rateRepo.findOne.mockResolvedValue(todayRate);
      const result = await service.getTodayRate();
      expect(result).toEqual(todayRate);
    });

    it('doit retourner null si aucun taux aujourd hui', async () => {
      rateRepo.findOne.mockResolvedValue(null);
      const result = await service.getTodayRate();
      expect(result).toBeNull();
    });
  });

  describe('getLatestRates', () => {
    it('doit retourner les derniers taux', async () => {
      const rates = [
        { id: 'r1', rateDate: '2025-01-03', usdToXof: 611.5 },
        { id: 'r2', rateDate: '2025-01-02', usdToXof: 610.0 },
      ];
      rateRepo.find.mockResolvedValue(rates);
      const result = await service.getLatestRates(30);
      expect(result).toEqual(rates);
      expect(rateRepo.find).toHaveBeenCalledWith({ order: { rateDate: 'DESC' }, take: 30 });
    });

    it('doit utiliser la limite par défaut de 30', async () => {
      rateRepo.find.mockResolvedValue([]);
      await service.getLatestRates();
      expect(rateRepo.find).toHaveBeenCalledWith({ order: { rateDate: 'DESC' }, take: 30 });
    });
  });
});
