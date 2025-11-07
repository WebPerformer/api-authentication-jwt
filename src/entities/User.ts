import {
  Column,
  Entity,
  OneToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { UserOTP } from "./UserOtp";
import { UserConfig } from "./UserConfig";

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text", nullable: true })
  profileImage: string;

  @Column({ type: "text" })
  username: string;

  @Column({ type: "text", unique: true })
  email: string;

  @Column({ type: "text" })
  password: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @OneToMany(() => UserOTP, (otp) => otp.user)
  otps: UserOTP[];

  // 👇 NOVA RELAÇÃO COM USERCONFIG
  @OneToOne(() => UserConfig, (userConfig) => userConfig.user, {
    cascade: true,
    eager: true,
  })
  config: UserConfig;
}
