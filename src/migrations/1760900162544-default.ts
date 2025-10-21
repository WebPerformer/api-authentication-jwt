import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1760900162544 implements MigrationInterface {
    name = 'Default1760900162544'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "phone" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "slug" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "slug" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "phone" SET NOT NULL`);
    }

}
