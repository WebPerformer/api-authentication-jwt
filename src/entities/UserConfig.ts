// entities/UserConfig.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

@Entity("user_configs")
export class UserConfig {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text", nullable: true })
  selected_template_id: string;

  @Column({ type: "jsonb", nullable: true })
  portfolio_data: any;

  @Column({ type: "boolean", default: false })
  is_portfolio_configured: boolean;

  @Column({ type: "text", nullable: true })
  stripe_customer_id: string;

  @OneToOne(() => User, (user) => user.config)
  @JoinColumn()
  user: User;
}
