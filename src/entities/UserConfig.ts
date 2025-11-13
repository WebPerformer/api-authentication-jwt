import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { User } from "./User";
import { TemplateCategory } from "./TemplateCategory";

@Entity("user_configs")
export class UserConfig {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text", nullable: true })
  selected_template_id: string;

  @Column({ type: "text", nullable: true })
  template_url: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "text", nullable: true })
  instagram: string;

  @Column({ type: "text", nullable: true })
  twitter: string;

  @Column({ type: "text", nullable: true })
  whatsapp: string;

  @Column({ type: "boolean", default: false })
  is_template_configured: boolean;

  @Column({ type: "text", nullable: true })
  stripe_customer_id: string;

  @OneToOne(() => User, (user) => user.config)
  @JoinColumn()
  user: User;

  @OneToMany(() => TemplateCategory, (category) => category.userConfig, {
    cascade: true,
  })
  categories: TemplateCategory[];

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updated_at: Date;
}
