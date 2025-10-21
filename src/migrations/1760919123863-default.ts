import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1760919123863 implements MigrationInterface {
    name = 'Default1760919123863'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "UQ_8536b8b85c06969f84f0c098b03" UNIQUE ("email")`);
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "slug" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "UQ_082b57a14467f4d6a19a41d4836" UNIQUE ("slug")`);
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "subscription_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "UQ_db93eca56c67946150c9f30f87b"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "UQ_db93eca56c67946150c9f30f87b" UNIQUE ("subscription_id")`);
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "subscription_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "UQ_082b57a14467f4d6a19a41d4836"`);
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "slug" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "UQ_8536b8b85c06969f84f0c098b03"`);
    }

}
