import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1760815242829 implements MigrationInterface {
    name = 'Default1760815242829'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "whatsapp"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "UQ_168e25d6b3f627af7e7cfb716b8"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "productSlug"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "slug" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "UQ_082b57a14467f4d6a19a41d4836" UNIQUE ("slug")`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "subscription_id" text`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "current_period_end" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "status" SET DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "status" SET DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "current_period_end"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "subscription_id"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "UQ_082b57a14467f4d6a19a41d4836"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "slug"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "productSlug" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "UQ_168e25d6b3f627af7e7cfb716b8" UNIQUE ("productSlug")`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "whatsapp" text`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "name" text NOT NULL`);
    }

}
