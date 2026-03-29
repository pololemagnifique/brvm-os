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
exports.Watchlist = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const watchlist_item_entity_1 = require("./watchlist-item.entity");
let Watchlist = class Watchlist {
    id;
    userId;
    user;
    name;
    isDefault;
    items;
    createdAt;
    updatedAt;
};
exports.Watchlist = Watchlist;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Watchlist.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", String)
], Watchlist.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], Watchlist.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Watchlist.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_default', default: false }),
    __metadata("design:type", Boolean)
], Watchlist.prototype, "isDefault", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => watchlist_item_entity_1.WatchlistItem, (item) => item.watchlist, { cascade: true }),
    __metadata("design:type", Array)
], Watchlist.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Watchlist.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Watchlist.prototype, "updatedAt", void 0);
exports.Watchlist = Watchlist = __decorate([
    (0, typeorm_1.Entity)('watchlists')
], Watchlist);
//# sourceMappingURL=watchlist.entity.js.map