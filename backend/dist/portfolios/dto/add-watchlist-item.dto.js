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
exports.UpdateWatchlistDto = exports.CreateWatchlistDto = exports.AddWatchlistItemDto = void 0;
const class_validator_1 = require("class-validator");
class AddWatchlistItemDto {
    ticker;
}
exports.AddWatchlistItemDto = AddWatchlistItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddWatchlistItemDto.prototype, "ticker", void 0);
class CreateWatchlistDto {
    name;
    tickers;
}
exports.CreateWatchlistDto = CreateWatchlistDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWatchlistDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateWatchlistDto.prototype, "tickers", void 0);
class UpdateWatchlistDto {
    name;
}
exports.UpdateWatchlistDto = UpdateWatchlistDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateWatchlistDto.prototype, "name", void 0);
//# sourceMappingURL=add-watchlist-item.dto.js.map