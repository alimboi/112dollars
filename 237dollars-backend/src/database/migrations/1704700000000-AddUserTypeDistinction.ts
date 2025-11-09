import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserTypeDistinction1704700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns for user type distinction
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS enrolled_major_id INTEGER DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS telegram_unlocked_majors JSONB DEFAULT '[]'
    `);

    // Update existing users to FREE_USER role
    await queryRunner.query(`
      UPDATE users
      SET role = 'free_user'
      WHERE role = 'student'
    `);

    // Update users who have enrollments to ENROLLED_STUDENT
    await queryRunner.query(`
      UPDATE users u
      SET role = 'enrolled_student',
          enrolled_major_id = (
            SELECT e.major_id
            FROM enrollments e
            INNER JOIN students s ON e.student_id = s.id
            WHERE s.user_id = u.id
            AND e.status = 'approved'
            AND e.contract_signed = true
            LIMIT 1
          )
      FROM students s
      WHERE s.user_id = u.id
      AND EXISTS (
        SELECT 1 FROM enrollments e2
        WHERE e2.student_id = s.id
        AND e2.status = 'approved'
        AND e2.contract_signed = true
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert role changes
    await queryRunner.query(`
      UPDATE users
      SET role = 'student'
      WHERE role IN ('free_user', 'enrolled_student')
    `);

    // Drop columns
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS enrolled_major_id,
      DROP COLUMN IF EXISTS telegram_unlocked_majors
    `);
  }
}
