import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTokenRotationAndRevocation1763130000000 implements MigrationInterface {
  name = 'AddTokenRotationAndRevocation1763130000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // SECURITY FIX #6 & #2: Add token rotation and revocation fields

    console.log('Adding token rotation and revocation fields...');

    // Add refresh_token_hash column for token rotation (Fix #6)
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "refresh_token_hash" TEXT NULL
    `);

    // Add revoked_tokens column for token revocation (Fix #2)
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "revoked_tokens" JSONB DEFAULT '[]'::jsonb
    `);

    // Add index on refresh_token_hash for faster validation
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_refresh_token_hash"
      ON "users" ("refresh_token_hash")
      WHERE "refresh_token_hash" IS NOT NULL
    `);

    console.log('✅ Token rotation and revocation fields added (Fix #6 & #2)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove index
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_refresh_token_hash"`);

    // Remove columns
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "revoked_tokens"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "refresh_token_hash"`);

    console.log('✅ Token rotation and revocation fields removed');
  }
}
