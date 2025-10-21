import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1760970462172 implements MigrationInterface {
    name = 'Default1760970462172'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "UQ_8536b8b85c06969f84f0c098b03"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "email" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "phone" character varying`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "UQ_082b57a14467f4d6a19a41d4836"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "slug"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "slug" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "subscription_id"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "subscription_id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "status" DROP DEFAULT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "status" SET DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "subscription_id"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "subscription_id" text`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "slug"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "slug" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "UQ_082b57a14467f4d6a19a41d4836" UNIQUE ("slug")`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "phone" text`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "email" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "UQ_8536b8b85c06969f84f0c098b03" UNIQUE ("email")`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "name" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "created_at"`);
    }

}
