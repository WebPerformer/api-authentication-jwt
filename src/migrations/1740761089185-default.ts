import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1740761089185 implements MigrationInterface {
    name = 'Default1740761089185'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "googleId"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "googleAccessToken"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "googleRefreshToken"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "googleRefreshToken" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD "googleAccessToken" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD "googleId" text`);
    }

}
