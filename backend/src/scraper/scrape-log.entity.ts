import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum ScrapeStatus {
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('scrape_logs')
export class ScrapeLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, default: ScrapeStatus.RUNNING })
  status: ScrapeStatus;

  @Column({ name: 'trading_date', type: 'date', nullable: true })
  tradingDate: string;

  @Column({ name: 'stocks_count', type: 'int', default: 0 })
  stocksCount: number;

  @Column({ name: 'indices_count', type: 'int', default: 0 })
  indicesCount: number;

  @Column({ type: 'text', nullable: true })
  error: string;

  @Column({ name: 'duration_ms', type: 'int', nullable: true })
  durationMs: number;

  @CreateDateColumn({ name: 'started_at' })
  startedAt: Date;
}
