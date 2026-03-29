"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ExchangeRatesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeRatesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const exchange_rate_entity_1 = require("./exchange-rate.entity");
let ExchangeRatesService = ExchangeRatesService_1 = class ExchangeRatesService {
    rateRepo;
    logger = new common_1.Logger(ExchangeRatesService_1.name);
    BCEAO_PEG = 655.957;
    constructor(rateRepo) {
        this.rateRepo = rateRepo;
    }
    async fetchRates() {
        try {
            const usdToXof = await this.fetchXeCom('USD', 'XOF');
            return {
                usdToXof,
                eurToXof: this.BCEAO_PEG,
                usdToEur: usdToXof / this.BCEAO_PEG,
                source: 'xe.com',
            };
        }
        catch (xeErr) {
            this.logger.warn(`XE.com failed: ${xeErr.message}, trying Frankfurter...`);
        }
        const usdToEur = await this.fetchFrankfurterUsdToEur();
        return {
            usdToXof: usdToEur * this.BCEAO_PEG,
            eurToXof: this.BCEAO_PEG,
            usdToEur,
            source: 'frankfurter+bceao_pegs',
        };
    }
    async fetchXeCom(from, to) {
        const url = `https://www.xe.com/currencyconverter/convert/?Amount=1&From=${from}&To=${to}`;
        const resp = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
        });
        if (!resp.ok)
            throw new Error(`XE HTTP ${resp.status}`);
        const html = await resp.text();
        const m = html.match(new RegExp(`1\\s+${from}\\s*=\\s*([\\d]+\\.[\\d]+)\\s*${to}`, 'i'));
        if (!m)
            throw new Error('Rate not found in XE.com HTML');
        return parseFloat(m[1]);
    }
    async fetchFrankfurterUsdToEur() {
        const url = 'https://api.frankfurter.app/latest?from=USD&to=EUR';
        const resp = await fetch(url, {
            headers: { 'User-Agent': 'BRVM-OS/1.0' },
        });
        if (!resp.ok)
            throw new Error(`Frankfurter HTTP ${resp.status}`);
        const data = (await resp.json());
        return data.rates.EUR;
    }
    async saveRate() {
        const today = new Date().toISOString().slice(0, 10);
        const { usdToXof, eurToXof, usdToEur, source } = await this.fetchRates();
        let rate = await this.rateRepo.findOne({ where: { rateDate: today } });
        if (rate) {
            rate.usdToXof = usdToXof;
            rate.eurToXof = eurToXof;
            rate.usdToEur = usdToEur;
            rate.source = source;
        }
        else {
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
    async getTodayRate() {
        const today = new Date().toISOString().slice(0, 10);
        return this.rateRepo.findOne({ where: { rateDate: today } });
    }
    async getLatestRates(limit = 30) {
        return this.rateRepo.find({
            order: { rateDate: 'DESC' },
            take: limit,
        });
    }
};
exports.ExchangeRatesService = ExchangeRatesService;
exports.ExchangeRatesService = ExchangeRatesService = ExchangeRatesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(exchange_rate_entity_1.ExchangeRate)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ExchangeRatesService);
//# sourceMappingURL=exchange-rates.service.js.map