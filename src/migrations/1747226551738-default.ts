import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1747226551738 implements MigrationInterface {
    name = 'Default1747226551738'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_otps" DROP CONSTRAINT "FK_d535c53a68028a7c3d04ea893df"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "user_otps" ALTER COLUMN "otpCode" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_otps" ALTER COLUMN "otpExpireAt" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_otps" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "user_otps" ADD "userId" uuid`);
        await queryRunner.query(`ALTER TABLE "user_otps" ADD CONSTRAINT "FK_d535c53a68028a7c3d04ea893df" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_otps" DROP CONSTRAINT "FK_d535c53a68028a7c3d04ea893df"`);
        await queryRunner.query(`ALTER TABLE "user_otps" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "user_otps" ADD "userId" integer`);
        await queryRunner.query(`ALTER TABLE "user_otps" ALTER COLUMN "otpExpireAt" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_otps" ALTER COLUMN "otpCode" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "user_otps" ADD CONSTRAINT "FK_d535c53a68028a7c3d04ea893df" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
