import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { UserOTP } from "./UserOtp";
import { Customer } from "./Customer"; // 👈 Importa a entidade Customer

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

  @OneToMany(() => Customer, (customer) => customer.user)
  customers: Customer[];
}
