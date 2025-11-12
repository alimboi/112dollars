import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMediaTypeToGalleryImages1747166400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add media_type column with enum
    await queryRunner.addColumn(
      'blog_gallery_images',
      new TableColumn({
        name: 'media_type',
        type: 'enum',
        enum: ['IMAGE', 'VIDEO', 'YOUTUBE', 'INSTAGRAM', 'TELEGRAM'],
        default: "'IMAGE'",
      }),
    );

    // Add media_url column (nullable for backward compatibility)
    await queryRunner.addColumn(
      'blog_gallery_images',
      new TableColumn({
        name: 'media_url',
        type: 'text',
        isNullable: true,
      }),
    );

    // Add title column
    await queryRunner.addColumn(
      'blog_gallery_images',
      new TableColumn({
        name: 'title',
        type: 'text',
        isNullable: true,
      }),
    );

    // Add description column
    await queryRunner.addColumn(
      'blog_gallery_images',
      new TableColumn({
        name: 'description',
        type: 'text',
        isNullable: true,
      }),
    );

    // Add thumbnail column for videos
    await queryRunner.addColumn(
      'blog_gallery_images',
      new TableColumn({
        name: 'thumbnail',
        type: 'text',
        isNullable: true,
      }),
    );

    // Add duration column for videos (in seconds)
    await queryRunner.addColumn(
      'blog_gallery_images',
      new TableColumn({
        name: 'duration',
        type: 'int',
        isNullable: true,
      }),
    );

    // Add created_at column
    await queryRunner.addColumn(
      'blog_gallery_images',
      new TableColumn({
        name: 'created_at',
        type: 'timestamp',
        default: 'CURRENT_TIMESTAMP',
      }),
    );

    // Update existing rows: copy image_url to media_url
    await queryRunner.query(
      `UPDATE blog_gallery_images SET media_url = image_url WHERE media_url IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('blog_gallery_images', 'created_at');
    await queryRunner.dropColumn('blog_gallery_images', 'duration');
    await queryRunner.dropColumn('blog_gallery_images', 'thumbnail');
    await queryRunner.dropColumn('blog_gallery_images', 'description');
    await queryRunner.dropColumn('blog_gallery_images', 'title');
    await queryRunner.dropColumn('blog_gallery_images', 'media_url');
    await queryRunner.dropColumn('blog_gallery_images', 'media_type');
  }
}
