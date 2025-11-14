import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsernameAndVerificationFields1736870000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add username column
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS username VARCHAR(50) DEFAULT NULL
    `);

    // Add telegram fields
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(255) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS telegram_phone VARCHAR(20) DEFAULT NULL
    `);

    // Add email verification fields
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS email_verification_code VARCHAR(6) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS email_verification_expiry TIMESTAMP DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS verification_attempts INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_verification_request TIMESTAMP DEFAULT NULL
    `);

    // Make firstName and lastName NOT NULL for new registrations
    // (Existing users might have NULL, so we'll allow it for now)
    await queryRunner.query(`
      ALTER TABLE users
      ALTER COLUMN first_name SET DEFAULT '',
      ALTER COLUMN last_name SET DEFAULT ''
    `);

    // Add unique constraint on username (only where not null)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username
      ON users(username)
      WHERE username IS NOT NULL
    `);

    // Add index on telegram_username for faster lookups
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_telegram_username
      ON users(telegram_username)
      WHERE telegram_username IS NOT NULL
    `);

    // Add index on email_verification_code for faster verification
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_verification_code
      ON users(email_verification_code)
      WHERE email_verification_code IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_users_username
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_users_telegram_username
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_users_verification_code
    `);

    // Remove email verification fields
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS email_verified,
      DROP COLUMN IF EXISTS email_verification_code,
      DROP COLUMN IF EXISTS email_verification_expiry,
      DROP COLUMN IF EXISTS verification_attempts,
      DROP COLUMN IF EXISTS last_verification_request
    `);

    // Remove telegram fields
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS telegram_username,
      DROP COLUMN IF EXISTS telegram_phone
    `);

    // Remove username column
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS username
    `);

    // Revert firstName and lastName defaults
    await queryRunner.query(`
      ALTER TABLE users
      ALTER COLUMN first_name DROP DEFAULT,
      ALTER COLUMN last_name DROP DEFAULT
    `);
  }
}
