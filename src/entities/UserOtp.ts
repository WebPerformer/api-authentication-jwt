import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from "typeorm";
import { User } from "./User";

@Entity("user_otps")
export class UserOTP {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "text", nullable: true })
  otpCode: string | null;

  @Column({ type: "boolean", default: false })
  otpValidated: boolean;

  @Column({ type: "timestamp", nullable: true })
  otpExpireAt: Date | null;

  @Column({ default: 0 })
  attempts: number;

  @Column({ nullable: true })
  lastAttemptAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.otps, { onDelete: "CASCADE" })
  user: User;
}
