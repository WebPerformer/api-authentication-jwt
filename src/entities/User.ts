import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { UserOTP } from "./UserOtp";

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

  @OneToMany(() => UserOTP, (otp) => otp.user)
  otps: UserOTP[];
}
