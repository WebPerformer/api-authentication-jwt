import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1760983150093 implements MigrationInterface {
    name = 'Default1760983150093'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" RENAME COLUMN "id" TO "customer_id"`);
        await queryRunner.query(`ALTER TABLE "customers" RENAME CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" TO "PK_6c444ce6637f2c1d71c3cf136c1"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "PK_6c444ce6637f2c1d71c3cf136c1"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "customer_id"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "customer_id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "PK_6c444ce6637f2c1d71c3cf136c1" PRIMARY KEY ("customer_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "PK_6c444ce6637f2c1d71c3cf136c1"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "customer_id"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "customer_id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "PK_6c444ce6637f2c1d71c3cf136c1" PRIMARY KEY ("customer_id")`);
        await queryRunner.query(`ALTER TABLE "customers" RENAME CONSTRAINT "PK_6c444ce6637f2c1d71c3cf136c1" TO "PK_133ec679a801fab5e070f73d3ea"`);
        await queryRunner.query(`ALTER TABLE "customers" RENAME COLUMN "customer_id" TO "id"`);
    }

}
