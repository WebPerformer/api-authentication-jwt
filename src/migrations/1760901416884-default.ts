import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1760901416884 implements MigrationInterface {
    name = 'Default1760901416884'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "name" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "UQ_8536b8b85c06969f84f0c098b03"`);
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "subscription_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "UQ_db93eca56c67946150c9f30f87b" UNIQUE ("subscription_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "UQ_db93eca56c67946150c9f30f87b"`);
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "subscription_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "UQ_8536b8b85c06969f84f0c098b03" UNIQUE ("email")`);
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "name" DROP NOT NULL`);
    }

}
