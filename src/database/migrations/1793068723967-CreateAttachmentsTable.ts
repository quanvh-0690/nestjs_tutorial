import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAttachmentsTable1793068723967 implements MigrationInterface {
  name = 'CreateAttachmentsTable1793068723967';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "attachments" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "attachable_type" character varying(50) NOT NULL, "attachable_id" character varying(36) NOT NULL, "collection" character varying(50) NOT NULL, "file_name" character varying(255) NOT NULL, "file_type" character varying(100) NOT NULL, "file_size" integer NOT NULL, "path" character varying(500) NOT NULL, "url" character varying(500) NOT NULL, "uploaded_by" integer, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_5e1f050bcff31e3084a1d662412" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c72aa23def29434a3567bbc379" ON "attachments"  ("attachable_type", "attachable_id", "collection") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c72aa23def29434a3567bbc379"`,
    );
    await queryRunner.query(`DROP TABLE "attachments"`);
  }
}
