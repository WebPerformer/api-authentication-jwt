import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1747160207498 implements MigrationInterface {
    name = 'Default1747160207498'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "otpCode"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "otpExpireAt"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "otpExpireAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD "otpCode" text`);
    }

}
