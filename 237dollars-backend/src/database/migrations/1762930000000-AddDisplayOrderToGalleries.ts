import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDisplayOrderToGalleries1762930000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'blog_image_galleries',
      new TableColumn({
        name: 'display_order',
        type: 'int',
        default: 0,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('blog_image_galleries', 'display_order');
  }
}
