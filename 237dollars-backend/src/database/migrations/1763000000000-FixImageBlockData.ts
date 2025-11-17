import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixImageBlockData1763000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get all image blocks that have content but missing blockData.url
    const imageBlocks = await queryRunner.query(`
      SELECT id, content, block_data
      FROM content_blocks
      WHERE block_type = 'image'
        AND content IS NOT NULL
        AND content != ''
    `);

    // Update each block to include blockData.url
    for (const block of imageBlocks) {
      let blockData = block.block_data || {};

      // Parse JSON if it's a string
      if (typeof blockData === 'string') {
        try {
          blockData = JSON.parse(blockData);
        } catch (e) {
          blockData = {};
        }
      }

      // Only update if blockData.url is not already set
      if (!blockData.url) {
        blockData.url = block.content;
        blockData.alt = blockData.alt || 'Content image';

        await queryRunner.query(
          `UPDATE content_blocks
           SET block_data = $1
           WHERE id = $2`,
          [JSON.stringify(blockData), block.id]
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This migration doesn't need to be reversed as it only adds missing data
    // If needed, you could remove the url field from blockData here
  }
}
