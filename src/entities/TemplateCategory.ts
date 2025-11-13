import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { UserConfig } from "./UserConfig";

@Entity("template_categories")
export class TemplateCategory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ type: "int", default: 0 })
  order: number;

  @Column({ type: "jsonb" })
  images: TemplateImage[];

  @ManyToOne(() => UserConfig, (config) => config.categories)
  userConfig: UserConfig;

  @Column()
  userConfigId: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updated_at: Date;
}

export interface TemplateImage {
  url: string;
  filename: string;
  key: string; // Identificador único no Cloudflare
  uploaded_at: Date;
  size: number;
  metadata?: {
    categoryId?: string;
    userId?: string;
    description?: string;
  };
}
