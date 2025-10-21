import { AppDataSource } from "../data-source";
import { Customer } from "../entities/Customer";

export const customerRepository = AppDataSource.getRepository(Customer);
