import { Repository } from 'typeorm';
import { Alert } from './alert.entity';
import { CreateAlertDto } from './dto/create-alert.dto';
export declare class AlertsService {
    private alertsRepo;
    constructor(alertsRepo: Repository<Alert>);
    findAll(userId: string): Promise<Alert[]>;
    create(userId: string, dto: CreateAlertDto): Promise<Alert>;
    update(id: string, userId: string, dto: Partial<CreateAlertDto>): Promise<Alert>;
    delete(id: string, userId: string): Promise<{
        deleted: boolean;
    }>;
    toggle(id: string, userId: string): Promise<Alert>;
}
