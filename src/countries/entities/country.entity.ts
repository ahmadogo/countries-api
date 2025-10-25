import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'countries' })
@Index(['name'], { unique: true })
export class Country {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  capital?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  region?: string;

  @Column({ type: 'bigint' })
  population: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  currency_code?: string | null;

  @Column({ type: 'double precision', nullable: true })
  exchange_rate?: number | null;

  @Column({ type: 'double precision', nullable: true })
  estimated_gdp?: number | null;

  @Column({ type: 'text', nullable: true })
  flag_url?: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  last_refreshed_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
