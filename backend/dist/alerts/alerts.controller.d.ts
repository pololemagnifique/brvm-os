import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
export declare class AlertsController {
    private alertsService;
    constructor(alertsService: AlertsService);
    findAll(req: any): Promise<import("./alert.entity").Alert[]>;
    create(req: any, dto: CreateAlertDto): Promise<import("./alert.entity").Alert>;
    toggle(id: string, req: any): Promise<import("./alert.entity").Alert>;
    update(id: string, req: any, dto: Partial<CreateAlertDto>): Promise<import("./alert.entity").Alert>;
    delete(id: string, req: any): Promise<{
        deleted: boolean;
    }>;
}
