import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Stock } from './stock.entity';

@Entity('eod_prices')
export class EodPrice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'stock_id' })
  stockId: string;

  @ManyToOne(() => Stock)
  @JoinColumn({ name: 'stock_id' })
  stock: Stock;

  @Column({ name: 'trading_date', type: 'date' })
  tradingDate: string;

  @Column({ name: 'open_price', type: 'decimal', precision: 18, scale: 4, nullable: true })
  openPrice: number;

  @Column({ name: 'high_price', type: 'decimal', precision: 18, scale: 4, nullable: true })
  highPrice: number;

  @Column({ name: 'low_price', type: 'decimal', precision: 18, scale: 4, nullable: true })
  lowPrice: number;

  @Column({ name: 'close_price', type: 'decimal', precision: 18, scale: 4 })
  closePrice: number;

  @Column({ type: 'bigint', default: 0 })
  volume: number;

  @Column({ name: 'previous_close', type: 'decimal', precision: 18, scale: 4, nullable: true })
  previousClose: number;

  @Column({ name: 'change_pct', type: 'decimal', precision: 8, scale: 4, nullable: true })
  changePct: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
