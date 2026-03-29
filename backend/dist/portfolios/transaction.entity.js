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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = exports.TransactionType = void 0;
const typeorm_1 = require("typeorm");
const portfolio_entity_1 = require("./portfolio.entity");
const stock_entity_1 = require("../stocks/stock.entity");
var TransactionType;
(function (TransactionType) {
    TransactionType["BUY"] = "BUY";
    TransactionType["SELL"] = "SELL";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
let Transaction = class Transaction {
    id;
    portfolioId;
    portfolio;
    stockId;
    stock;
    type;
    quantity;
    price;
    fees;
    transactionDate;
    notes;
    createdAt;
};
exports.Transaction = Transaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Transaction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'portfolio_id' }),
    __metadata("design:type", String)
], Transaction.prototype, "portfolioId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => portfolio_entity_1.Portfolio, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'portfolio_id' }),
    __metadata("design:type", portfolio_entity_1.Portfolio)
], Transaction.prototype, "portfolio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'stock_id' }),
    __metadata("design:type", String)
], Transaction.prototype, "stockId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => stock_entity_1.Stock),
    (0, typeorm_1.JoinColumn)({ name: 'stock_id' }),
    __metadata("design:type", stock_entity_1.Stock)
], Transaction.prototype, "stock", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10 }),
    __metadata("design:type", String)
], Transaction.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Transaction.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 4 }),
    __metadata("design:type", Number)
], Transaction.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 4, default: 0 }),
    __metadata("design:type", Number)
], Transaction.prototype, "fees", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'transaction_date', type: 'date' }),
    __metadata("design:type", String)
], Transaction.prototype, "transactionDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Transaction.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Transaction.prototype, "createdAt", void 0);
exports.Transaction = Transaction = __decorate([
    (0, typeorm_1.Entity)('transactions')
], Transaction);
//# sourceMappingURL=transaction.entity.js.map