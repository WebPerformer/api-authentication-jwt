import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1740601171719 implements MigrationInterface {
    name = 'Default1740601171719'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "otpCode" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD "otpExpireAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "otpExpireAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "otpCode"`);
    }

}
