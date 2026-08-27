import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('system_settings')
export class SystemSetting {
  @PrimaryColumn({ type: 'int', default: 1 })
  id: number;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl: string | null;

  @Column({ name: 'primary_color', length: 9, default: '#1B4F72' })
  primaryColor: string;

  @Column({ name: 'institution_name', length: 200, default: 'Universidad Panamericana de El Salvador' })
  institutionName: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}