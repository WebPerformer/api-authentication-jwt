import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1764940117591 implements MigrationInterface {
    name = 'Default1764940117591'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_configs" DROP COLUMN "has_used_trial"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_configs" ADD "has_used_trial" boolean NOT NULL DEFAULT false`);
    }

}
