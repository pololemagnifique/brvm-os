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
exports.AlertsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const alert_entity_1 = require("./alert.entity");
let AlertsService = class AlertsService {
    alertsRepo;
    constructor(alertsRepo) {
        this.alertsRepo = alertsRepo;
    }
    findAll(userId) {
        return this.alertsRepo.find({
            where: { userId },
            relations: ['stock'],
            order: { createdAt: 'DESC' },
        });
    }
    async create(userId, dto) {
        const alert = this.alertsRepo.create({ ...dto, userId });
        return this.alertsRepo.save(alert);
    }
    async update(id, userId, dto) {
        const alert = await this.alertsRepo.findOne({ where: { id, userId } });
        if (!alert)
            throw new common_1.NotFoundException('Alerte non trouvée');
        Object.assign(alert, dto);
        return this.alertsRepo.save(alert);
    }
    async delete(id, userId) {
        const alert = await this.alertsRepo.findOne({ where: { id, userId } });
        if (!alert)
            throw new common_1.NotFoundException('Alerte non trouvée');
        await this.alertsRepo.delete(id);
        return { deleted: true };
    }
    async toggle(id, userId) {
        const alert = await this.alertsRepo.findOne({ where: { id, userId } });
        if (!alert)
            throw new common_1.NotFoundException('Alerte non trouvée');
        alert.isActive = !alert.isActive;
        return this.alertsRepo.save(alert);
    }
};
exports.AlertsService = AlertsService;
exports.AlertsService = AlertsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(alert_entity_1.Alert)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AlertsService);
//# sourceMappingURL=alerts.service.js.map