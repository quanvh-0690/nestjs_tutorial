import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateArticlesTagsFavoritesTables1793068868028 implements MigrationInterface {
  name = 'CreateArticlesTagsFavoritesTables1793068868028';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tags" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, CONSTRAINT "UQ_d90243459a697eadb8ad56e9092" UNIQUE ("name"), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "articles" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "slug" character varying(300) NOT NULL, "title" character varying(255) NOT NULL, "description" character varying(500) NOT NULL DEFAULT '', "body" text NOT NULL, "favorites_count" integer NOT NULL DEFAULT '0', "author_id" integer NOT NULL, CONSTRAINT "UQ_1123ff6815c5b8fec0ba9fec370" UNIQUE ("slug"), CONSTRAINT "PK_0a6e2c450d83e0b6052c2793334" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "favorites" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "article_id" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_a9e152dd51d71f08637b6a9ca00" UNIQUE ("user_id", "article_id"), CONSTRAINT "PK_890818d27523748dd36a4d1bdc8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "article_tags" ("article_id" integer NOT NULL, "tag_id" integer NOT NULL, CONSTRAINT "PK_dd79accc42e2f122f6f3ff7588a" PRIMARY KEY ("article_id", "tag_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f8c9234a4c4cb37806387f0c9e" ON "article_tags"  ("article_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1325dd0b98ee0f8f673db6ce19" ON "article_tags"  ("tag_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "articles" ADD CONSTRAINT "FK_6515da4dff8db423ce4eb841490" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorites" ADD CONSTRAINT "FK_35a6b05ee3b624d0de01ee50593" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorites" ADD CONSTRAINT "FK_0d2b1e08e4e234e10a0e5ff5fc5" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "article_tags" ADD CONSTRAINT "FK_f8c9234a4c4cb37806387f0c9e9" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "article_tags" ADD CONSTRAINT "FK_1325dd0b98ee0f8f673db6ce194" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "article_tags" DROP CONSTRAINT "FK_1325dd0b98ee0f8f673db6ce194"`,
    );
    await queryRunner.query(
      `ALTER TABLE "article_tags" DROP CONSTRAINT "FK_f8c9234a4c4cb37806387f0c9e9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorites" DROP CONSTRAINT "FK_0d2b1e08e4e234e10a0e5ff5fc5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorites" DROP CONSTRAINT "FK_35a6b05ee3b624d0de01ee50593"`,
    );
    await queryRunner.query(
      `ALTER TABLE "articles" DROP CONSTRAINT "FK_6515da4dff8db423ce4eb841490"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1325dd0b98ee0f8f673db6ce19"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f8c9234a4c4cb37806387f0c9e"`,
    );
    await queryRunner.query(`DROP TABLE "article_tags"`);
    await queryRunner.query(`DROP TABLE "favorites"`);
    await queryRunner.query(`DROP TABLE "articles"`);
    await queryRunner.query(`DROP TABLE "tags"`);
  }
}
