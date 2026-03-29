import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

@Entity('indices')
@Unique(['indexKey', 'tradingDate'])
export class Indice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'index_key' })
  indexKey: string;

  @Column()
  name: string;

  @Column({ name: 'trading_date', type: 'date' })
  tradingDate: string;

  @Column({ type: 'decimal', precision: 18, scale: 4 })
  value: number;

  @Column({ name: 'change_pct', type: 'decimal', precision: 8, scale: 4, nullable: true })
  changePct: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
