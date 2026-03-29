"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrapeModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const scrape_controller_1 = require("./scrape.controller");
const scrape_service_1 = require("./scrape.service");
const scrape_log_entity_1 = require("./scrape-log.entity");
const eod_price_entity_1 = require("../stocks/eod-price.entity");
const indice_entity_1 = require("../stocks/indice.entity");
const stock_entity_1 = require("../stocks/stock.entity");
let ScrapeModule = class ScrapeModule {
};
exports.ScrapeModule = ScrapeModule;
exports.ScrapeModule = ScrapeModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([scrape_log_entity_1.ScrapeLog, eod_price_entity_1.EodPrice, indice_entity_1.Indice, stock_entity_1.Stock])],
        controllers: [scrape_controller_1.ScrapeController],
        providers: [scrape_service_1.ScrapeService],
        exports: [scrape_service_1.ScrapeService],
    })
], ScrapeModule);
//# sourceMappingURL=scrape.module.js.map