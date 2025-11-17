import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueConstraints1763100000000 implements MigrationInterface {
  name = 'AddUniqueConstraints1763100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add unique constraint on user_points (user_id, topic_id)
    // This prevents duplicate points for the same user and topic
    await queryRunner.query(`
      ALTER TABLE "user_points"
      ADD CONSTRAINT "UQ_user_points_user_topic"
      UNIQUE ("user_id", "topic_id")
    `);

    // Add unique constraint on reading_progress (user_id, reference_id)
    // This prevents duplicate reading progress entries
    await queryRunner.query(`
      ALTER TABLE "reading_progress"
      ADD CONSTRAINT "UQ_reading_progress_user_reference"
      UNIQUE ("user_id", "reference_id")
    `);

    console.log('✅ Added unique constraints to prevent race conditions');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove unique constraints
    await queryRunner.query(`
      ALTER TABLE "reading_progress"
      DROP CONSTRAINT "UQ_reading_progress_user_reference"
    `);

    await queryRunner.query(`
      ALTER TABLE "user_points"
      DROP CONSTRAINT "UQ_user_points_user_topic"
    `);

    console.log('✅ Removed unique constraints');
  }
}
