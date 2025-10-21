import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1760899068017 implements MigrationInterface {
    name = 'Default1760899068017'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "current_period_end"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "name" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "phone" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "UQ_88acd889fbe17d0e16cc4bc9174" UNIQUE ("phone")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "UQ_88acd889fbe17d0e16cc4bc9174"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "current_period_end" TIMESTAMP WITH TIME ZONE`);
    }

}
