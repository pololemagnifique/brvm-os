import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Watchlist } from './watchlist.entity';
import { Stock } from '../stocks/stock.entity';

@Entity('watchlist_items')
export class WatchlistItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'watchlist_id' })
  watchlistId: string;

  @ManyToOne(() => Watchlist, (w) => w.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'watchlist_id' })
  watchlist: Watchlist;

  @Column({ name: 'stock_id' })
  stockId: string;

  @ManyToOne(() => Stock, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stock_id' })
  stock: Stock;

  @CreateDateColumn({ name: 'added_at' })
  addedAt: Date;
}
