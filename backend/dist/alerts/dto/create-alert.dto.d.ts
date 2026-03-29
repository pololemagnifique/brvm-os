import { AlertType } from '../alert.entity';
export declare class CreateAlertDto {
    stockId?: string;
    type: AlertType;
    condition: string;
    threshold: number;
}
