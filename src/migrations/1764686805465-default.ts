import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1764686805465 implements MigrationInterface {
    name = 'Default1764686805465'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "template_categories" DROP CONSTRAINT "PK_ddd88953a0cd7ee62295a90f984"`);
        await queryRunner.query(`ALTER TABLE "template_categories" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "template_categories" ADD "id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "template_categories" ADD CONSTRAINT "PK_ddd88953a0cd7ee62295a90f984" PRIMARY KEY ("id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "template_categories" DROP CONSTRAINT "PK_ddd88953a0cd7ee62295a90f984"`);
        await queryRunner.query(`ALTER TABLE "template_categories" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "template_categories" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "template_categories" ADD CONSTRAINT "PK_ddd88953a0cd7ee62295a90f984" PRIMARY KEY ("id")`);
    }

}
