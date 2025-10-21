import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1760956684989 implements MigrationInterface {
    name = 'Default1760956684989'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" ADD "email" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "UQ_8536b8b85c06969f84f0c098b03" UNIQUE ("email")`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "name" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "phone" text`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "slug" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "UQ_082b57a14467f4d6a19a41d4836" UNIQUE ("slug")`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "status" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "UQ_082b57a14467f4d6a19a41d4836"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "slug"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "UQ_8536b8b85c06969f84f0c098b03"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "email"`);
    }

}
