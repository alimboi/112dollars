import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateBlogGalleryImageTable1730867210000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'blog_gallery_images',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'gallery_id',
            type: 'int',
          },
          {
            name: 'image_url',
            type: 'text',
          },
          {
            name: 'order',
            type: 'int',
            default: 0,
          },
        ],
        indices: [
          new TableIndex({ columnNames: ['gallery_id'] }),
          new TableIndex({ columnNames: ['gallery_id', 'order'] }),
        ],
      }),
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'blog_gallery_images',
      new TableForeignKey({
        columnNames: ['gallery_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'blog_image_galleries',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('blog_gallery_images');
    const foreignKey = table.foreignKeys.find((fk) => fk.columnNames.indexOf('gallery_id') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('blog_gallery_images', foreignKey);
    }
    await queryRunner.dropTable('blog_gallery_images');
  }
}
