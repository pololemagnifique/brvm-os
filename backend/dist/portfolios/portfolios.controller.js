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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortfoliosController = void 0;
const common_1 = require("@nestjs/common");
const portfolios_service_1 = require("./portfolios.service");
const create_portfolio_dto_1 = require("./dto/create-portfolio.dto");
const create_transaction_dto_1 = require("./dto/create-transaction.dto");
const add_watchlist_item_dto_1 = require("./dto/add-watchlist-item.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let PortfoliosController = class PortfoliosController {
    portfoliosService;
    constructor(portfoliosService) {
        this.portfoliosService = portfoliosService;
    }
    getPortfolios(req) {
        return this.portfoliosService.getPortfolios(req.user.id);
    }
    createPortfolio(req, dto) {
        return this.portfoliosService.createPortfolio(req.user.id, dto);
    }
    getTransactions(id, req) {
        return this.portfoliosService.getTransactions(id, req.user.id);
    }
    addTransaction(id, req, dto) {
        return this.portfoliosService.addTransaction(id, req.user.id, dto);
    }
    getPositions(id, req) {
        return this.portfoliosService.getPositions(id, req.user.id);
    }
    getWatchlists(req) {
        return this.portfoliosService.getWatchlists(req.user.id);
    }
    createWatchlist(req, dto) {
        return this.portfoliosService.createWatchlist(req.user.id, dto);
    }
    getWatchlist(id, req) {
        return this.portfoliosService.getWatchlist(id, req.user.id);
    }
    updateWatchlist(id, req, dto) {
        return this.portfoliosService.updateWatchlist(id, req.user.id, dto);
    }
    deleteWatchlist(id, req) {
        return this.portfoliosService.deleteWatchlist(id, req.user.id);
    }
    addToWatchlist(id, req, dto) {
        return this.portfoliosService.addToWatchlist(id, req.user.id, dto);
    }
    removeFromWatchlist(id, ticker, req) {
        return this.portfoliosService.removeFromWatchlist(id, req.user.id, ticker);
    }
};
exports.PortfoliosController = PortfoliosController;
__decorate([
    (0, common_1.Get)('portfolios'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PortfoliosController.prototype, "getPortfolios", null);
__decorate([
    (0, common_1.Post)('portfolios'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_portfolio_dto_1.CreatePortfolioDto]),
    __metadata("design:returntype", void 0)
], PortfoliosController.prototype, "createPortfolio", null);
__decorate([
    (0, common_1.Get)('portfolios/:portfolioId/transactions'),
    __param(0, (0, common_1.Param)('portfolioId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PortfoliosController.prototype, "getTransactions", null);
__decorate([
    (0, common_1.Post)('portfolios/:portfolioId/transactions'),
    __param(0, (0, common_1.Param)('portfolioId')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, create_transaction_dto_1.CreateTransactionDto]),
    __metadata("design:returntype", void 0)
], PortfoliosController.prototype, "addTransaction", null);
__decorate([
    (0, common_1.Get)('portfolios/:portfolioId/positions'),
    __param(0, (0, common_1.Param)('portfolioId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PortfoliosController.prototype, "getPositions", null);
__decorate([
    (0, common_1.Get)('watchlists'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PortfoliosController.prototype, "getWatchlists", null);
__decorate([
    (0, common_1.Post)('watchlists'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, add_watchlist_item_dto_1.CreateWatchlistDto]),
    __metadata("design:returntype", void 0)
], PortfoliosController.prototype, "createWatchlist", null);
__decorate([
    (0, common_1.Get)('watchlists/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PortfoliosController.prototype, "getWatchlist", null);
__decorate([
    (0, common_1.Put)('watchlists/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, add_watchlist_item_dto_1.UpdateWatchlistDto]),
    __metadata("design:returntype", void 0)
], PortfoliosController.prototype, "updateWatchlist", null);
__decorate([
    (0, common_1.Delete)('watchlists/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PortfoliosController.prototype, "deleteWatchlist", null);
__decorate([
    (0, common_1.Post)('watchlists/:id/items'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], PortfoliosController.prototype, "addToWatchlist", null);
__decorate([
    (0, common_1.Delete)('watchlists/:id/items/:ticker'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('ticker')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], PortfoliosController.prototype, "removeFromWatchlist", null);
exports.PortfoliosController = PortfoliosController = __decorate([
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [portfolios_service_1.PortfoliosService])
], PortfoliosController);
//# sourceMappingURL=portfolios.controller.js.map