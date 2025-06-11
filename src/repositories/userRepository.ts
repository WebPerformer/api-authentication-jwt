import { AppDataSource } from '../data-source'
import { User } from '../entities/User'
import { UserOTP } from '../entities/UserOtp'

export const userRepository = AppDataSource.getRepository(User)
export const userOtpRepository = AppDataSource.getRepository(UserOTP)
