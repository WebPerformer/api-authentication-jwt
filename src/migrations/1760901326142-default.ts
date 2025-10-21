import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1760901326142 implements MigrationInterface {
    name = 'Default1760901326142'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "name" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "UQ_88acd889fbe17d0e16cc4bc9174"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "UQ_082b57a14467f4d6a19a41d4836"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "UQ_082b57a14467f4d6a19a41d4836" UNIQUE ("slug")`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "UQ_88acd889fbe17d0e16cc4bc9174" UNIQUE ("phone")`);
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "name" SET NOT NULL`);
    }

}
