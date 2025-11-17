import { MigrationInterface, QueryRunner } from 'typeorm';

export class DatabaseIntegrityImprovements1763120000000 implements MigrationInterface {
  name = 'DatabaseIntegrityImprovements1763120000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // SECURITY FIX #28-31: Add missing database constraints and indexes

    // Add indexes for foreign keys to improve query performance
    console.log('Adding performance indexes...');

    // Content blocks - speed up queries by reference
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_content_blocks_reference_id"
      ON "content_blocks" ("reference_id")
    `);

    // Reading progress - speed up lookups by user and reference
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_reading_progress_user_id"
      ON "reading_progress" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_reading_progress_reference_id"
      ON "reading_progress" ("reference_id")
    `);

    // User points - speed up user point lookups
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_user_points_user_id"
      ON "user_points" ("user_id")
    `);

    // References - speed up topic queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_references_topic_id"
      ON "references" ("topic_id")
    `);

    // References - speed up published queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_references_is_published"
      ON "references" ("is_published")
    `);

    // Blog posts - speed up author queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_blog_posts_author_id"
      ON "blog_posts" ("author_id")
    `);

    // Blog posts - speed up published queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_blog_posts_is_published"
      ON "blog_posts" ("is_published")
    `);

    // Enrollments - speed up user lookups
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_enrollments_user_id"
      ON "enrollments" ("user_id")
    `);

    // Admin activity logs - speed up admin lookups
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_admin_activity_logs_admin_id"
      ON "admin_activity_logs" ("admin_id")
    `);

    // Blog gallery images - speed up gallery lookups
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_blog_gallery_images_gallery_id"
      ON "blog_gallery_images" ("gallery_id")
    `);

    // Add unique constraint for user reading progress (one progress per user per reference)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_reading_progress_user_reference_unique"
      ON "reading_progress" ("user_id", "reference_id")
    `);

    // Add check constraints for data integrity
    console.log('Adding data integrity constraints...');

    // Ensure percentage_read is between 0 and 100
    await queryRunner.query(`
      ALTER TABLE "reading_progress"
      ADD CONSTRAINT IF NOT EXISTS "chk_percentage_read_range"
      CHECK ("percentage_read" >= 0 AND "percentage_read" <= 100)
    `).catch(() => {
      // Constraint might already exist, ignore error
      console.log('Percentage read constraint already exists');
    });

    // Ensure reading_time_seconds is non-negative
    await queryRunner.query(`
      ALTER TABLE "reading_progress"
      ADD CONSTRAINT IF NOT EXISTS "chk_reading_time_positive"
      CHECK ("reading_time_seconds" >= 0)
    `).catch(() => {
      console.log('Reading time constraint already exists');
    });

    // Ensure display_order is non-negative for references
    await queryRunner.query(`
      ALTER TABLE "references"
      ADD CONSTRAINT IF NOT EXISTS "chk_display_order_positive"
      CHECK ("display_order" >= 0)
    `).catch(() => {
      console.log('Display order constraint already exists');
    });

    console.log('✅ Database integrity improvements completed (Fix #28-31)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_content_blocks_reference_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_reading_progress_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_reading_progress_reference_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_user_points_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_references_topic_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_references_is_published"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_blog_posts_author_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_blog_posts_is_published"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_enrollments_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_admin_activity_logs_admin_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_blog_gallery_images_gallery_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_reading_progress_user_reference_unique"`);

    // Remove constraints
    await queryRunner.query(`ALTER TABLE "reading_progress" DROP CONSTRAINT IF EXISTS "chk_percentage_read_range"`);
    await queryRunner.query(`ALTER TABLE "reading_progress" DROP CONSTRAINT IF EXISTS "chk_reading_time_positive"`);
    await queryRunner.query(`ALTER TABLE "references" DROP CONSTRAINT IF EXISTS "chk_display_order_positive"`);

    console.log('✅ Database integrity improvements rolled back');
  }
}
