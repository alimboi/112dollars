import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordResetFields1763110000000 implements MigrationInterface {
  name = 'AddPasswordResetFields1763110000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // SECURITY FIX #8: Move password reset codes from memory to database
    // Add password reset fields to users table
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "password_reset_code" VARCHAR(6),
      ADD COLUMN "password_reset_expiry" TIMESTAMP,
      ADD COLUMN "password_reset_attempts" INTEGER DEFAULT 0,
      ADD COLUMN "last_password_reset_request" TIMESTAMP
    `);

    console.log('✅ Added password reset fields to users table (Fix #8)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove password reset fields
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "last_password_reset_request",
      DROP COLUMN "password_reset_attempts",
      DROP COLUMN "password_reset_expiry",
      DROP COLUMN "password_reset_code"
    `);

    console.log('✅ Removed password reset fields from users table');
  }
}
