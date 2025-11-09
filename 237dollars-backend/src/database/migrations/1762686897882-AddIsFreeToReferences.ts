import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddIsFreeToReferences1762686897882 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'references',
            new TableColumn({
                name: 'is_free',
                type: 'boolean',
                default: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('references', 'is_free');
    }

}
