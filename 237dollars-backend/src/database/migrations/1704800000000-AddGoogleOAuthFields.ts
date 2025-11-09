import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleOAuthFields1704800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make password nullable for OAuth users
    await queryRunner.query(`
      ALTER TABLE users
      ALTER COLUMN password DROP NOT NULL
    `);

    // Add Google OAuth fields
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS first_name VARCHAR(255) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS last_name VARCHAR(255) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS profile_picture TEXT DEFAULT NULL
    `);

    // Add unique constraint on google_id
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id
      ON users(google_id)
      WHERE google_id IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove unique constraint
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_users_google_id
    `);

    // Remove Google OAuth fields
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS google_id,
      DROP COLUMN IF EXISTS first_name,
      DROP COLUMN IF EXISTS last_name,
      DROP COLUMN IF EXISTS profile_picture
    `);

    // Make password NOT NULL again (caution: this may fail if OAuth users exist)
    await queryRunner.query(`
      ALTER TABLE users
      ALTER COLUMN password SET NOT NULL
    `);
  }
}
