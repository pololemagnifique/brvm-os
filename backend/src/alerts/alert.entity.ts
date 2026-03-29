import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Stock } from '../stocks/stock.entity';

export enum AlertType {
  PRICE_ABOVE = 'PRICE_ABOVE',
  PRICE_BELOW = 'PRICE_BELOW',
  CHANGE_PCT = 'CHANGE_PCT',
  VOLUME_SPIKE = 'VOLUME_SPIKE',
}

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'stock_id', nullable: true })
  stockId: string;

  @ManyToOne(() => Stock, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'stock_id' })
  stock: Stock;

  @Column({ type: 'varchar', length: 30 })
  type: AlertType;

  @Column({ type: 'varchar', length: 20 })
  condition: string;

  @Column({ type: 'decimal', precision: 18, scale: 4 })
  threshold: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_triggered', nullable: true })
  lastTriggered: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
