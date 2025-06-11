import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1747160173589 implements MigrationInterface {
    name = 'Default1747160173589'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_otps" ("id" SERIAL NOT NULL, "otpCode" text NOT NULL, "otpExpireAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_058cf61bf2024c3a3c3bfc4e1b7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_otps" ADD CONSTRAINT "FK_d535c53a68028a7c3d04ea893df" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_otps" DROP CONSTRAINT "FK_d535c53a68028a7c3d04ea893df"`);
        await queryRunner.query(`DROP TABLE "user_otps"`);
    }

}
