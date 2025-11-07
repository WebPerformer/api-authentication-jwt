import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1762354772309 implements MigrationInterface {
    name = 'Default1762354772309'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_6cdcdb50ed6da5709b9472d0b0a"`);
        await queryRunner.query(`CREATE TABLE "user_configs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "selected_template_id" text, "portfolio_data" jsonb, "is_portfolio_configured" boolean NOT NULL DEFAULT false, "userId" uuid, CONSTRAINT "REL_b2e94d5a023177b035defb5ba4" UNIQUE ("userId"), CONSTRAINT "PK_fc11c8861af6469fbd8920e9f80" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_bc0c27d77ee64f0a097a5c269b3"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "slug"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "selected_template_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "portfolio_data"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_portfolio_configured"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_active"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "selectedTemplateId"`);
        await queryRunner.query(`ALTER TABLE "user_configs" ADD CONSTRAINT "FK_b2e94d5a023177b035defb5ba4a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_configs" DROP CONSTRAINT "FK_b2e94d5a023177b035defb5ba4a"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "selectedTemplateId" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" ADD "is_active" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "users" ADD "is_portfolio_configured" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "portfolio_data" jsonb`);
        await queryRunner.query(`ALTER TABLE "users" ADD "selected_template_id" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD "slug" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_bc0c27d77ee64f0a097a5c269b3" UNIQUE ("slug")`);
        await queryRunner.query(`DROP TABLE "user_configs"`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_6cdcdb50ed6da5709b9472d0b0a" FOREIGN KEY ("selectedTemplateId") REFERENCES "templates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
