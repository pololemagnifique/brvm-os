import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert, AlertType } from './alert.entity';
import { CreateAlertDto } from './dto/create-alert.dto';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert) private alertsRepo: Repository<Alert>,
  ) {}

  findAll(userId: string) {
    return this.alertsRepo.find({
      where: { userId },
      relations: ['stock'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(userId: string, dto: CreateAlertDto) {
    const alert = this.alertsRepo.create({ ...dto, userId });
    return this.alertsRepo.save(alert);
  }

  async update(id: string, userId: string, dto: Partial<CreateAlertDto>) {
    const alert = await this.alertsRepo.findOne({ where: { id, userId } });
    if (!alert) throw new NotFoundException('Alerte non trouvée');
    Object.assign(alert, dto);
    return this.alertsRepo.save(alert);
  }

  async delete(id: string, userId: string) {
    const alert = await this.alertsRepo.findOne({ where: { id, userId } });
    if (!alert) throw new NotFoundException('Alerte non trouvée');
    await this.alertsRepo.delete(id);
    return { deleted: true };
  }

  async toggle(id: string, userId: string) {
    const alert = await this.alertsRepo.findOne({ where: { id, userId } });
    if (!alert) throw new NotFoundException('Alerte non trouvée');
    alert.isActive = !alert.isActive;
    return this.alertsRepo.save(alert);
  }
}
