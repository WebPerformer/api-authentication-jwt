import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1762980171874 implements MigrationInterface {
    name = 'Default1762980171874'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "template_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "order" integer NOT NULL DEFAULT '0', "images" jsonb NOT NULL, "userConfigId" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ddd88953a0cd7ee62295a90f984" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_configs" DROP COLUMN "portfolio_data"`);
        await queryRunner.query(`ALTER TABLE "user_configs" DROP COLUMN "is_portfolio_configured"`);
        await queryRunner.query(`ALTER TABLE "user_configs" ADD "template_url" text`);
        await queryRunner.query(`ALTER TABLE "user_configs" ADD "description" text`);
        await queryRunner.query(`ALTER TABLE "user_configs" ADD "instagram" text`);
        await queryRunner.query(`ALTER TABLE "user_configs" ADD "twitter" text`);
        await queryRunner.query(`ALTER TABLE "user_configs" ADD "whatsapp" text`);
        await queryRunner.query(`ALTER TABLE "user_configs" ADD "is_template_configured" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "user_configs" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "user_configs" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "template_categories" ADD CONSTRAINT "FK_b3d58c01c457c13b53cbba8f43f" FOREIGN KEY ("userConfigId") REFERENCES "user_configs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "template_categories" DROP CONSTRAINT "FK_b3d58c01c457c13b53cbba8f43f"`);
        await queryRunner.query(`ALTER TABLE "user_configs" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "user_configs" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "user_configs" DROP COLUMN "is_template_configured"`);
        await queryRunner.query(`ALTER TABLE "user_configs" DROP COLUMN "whatsapp"`);
        await queryRunner.query(`ALTER TABLE "user_configs" DROP COLUMN "twitter"`);
        await queryRunner.query(`ALTER TABLE "user_configs" DROP COLUMN "instagram"`);
        await queryRunner.query(`ALTER TABLE "user_configs" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "user_configs" DROP COLUMN "template_url"`);
        await queryRunner.query(`ALTER TABLE "user_configs" ADD "is_portfolio_configured" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "user_configs" ADD "portfolio_data" jsonb`);
        await queryRunner.query(`DROP TABLE "template_categories"`);
    }

}
