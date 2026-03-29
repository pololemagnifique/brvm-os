import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('exchange_rates')
export class ExchangeRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Date of the rate (trading date, not fetch date) */
  @Column({ type: 'date', name: 'rate_date' })
  rateDate: string;

  @Column({ type: 'text' })
  source: string;

  @Column({ type: 'float', name: 'usd_to_xof' })
  usdToXof: number;

  @Column({ type: 'float', name: 'eur_to_xof' })
  eurToXof: number;

  /** 1 USD = ? EUR (derived) */
  @Column({ type: 'float', name: 'usd_to_eur', nullable: true })
  usdToEur: number | null;

  @CreateDateColumn({ name: 'fetched_at' })
  fetchedAt: Date;
}
