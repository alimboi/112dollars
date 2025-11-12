import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDisplayOrderToReferences1762940000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'references',
      new TableColumn({
        name: 'display_order',
        type: 'int',
        default: 0,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('references', 'display_order');
  }
}
