import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1747676690608 implements MigrationInterface {
    name = 'Default1747676690608'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_otps" ADD "otpValidated" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_otps" DROP COLUMN "otpValidated"`);
    }

}
