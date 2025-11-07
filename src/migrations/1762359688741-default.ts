import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1762359688741 implements MigrationInterface {
    name = 'Default1762359688741'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_configs" ADD "stripe_customer_id" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_configs" DROP COLUMN "stripe_customer_id"`);
    }

}
