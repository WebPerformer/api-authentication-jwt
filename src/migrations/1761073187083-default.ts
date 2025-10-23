import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1761073187083 implements MigrationInterface {
    name = 'Default1761073187083'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "password"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" ADD "password" text NOT NULL`);
    }

}
