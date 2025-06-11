import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1747753724586 implements MigrationInterface {
    name = 'Default1747753724586'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_otps" ADD "attempts" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "user_otps" ADD "lastAttemptAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_otps" DROP COLUMN "lastAttemptAt"`);
        await queryRunner.query(`ALTER TABLE "user_otps" DROP COLUMN "attempts"`);
    }

}
