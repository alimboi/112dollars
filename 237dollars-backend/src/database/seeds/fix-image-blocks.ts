import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../../config/database.config';

async function fixImageBlocks() {
  const dataSource = new DataSource(dataSourceOptions);

  try {
    await dataSource.initialize();
    console.log('🔗 Database connected');

    const queryRunner = dataSource.createQueryRunner();

    // Get all image blocks that have content but missing blockData.url
    const imageBlocks = await queryRunner.query(`
      SELECT id, content, block_data
      FROM content_blocks
      WHERE block_type = 'image'
        AND content IS NOT NULL
        AND content != ''
    `);

    console.log(`📸 Found ${imageBlocks.length} image blocks to process`);

    let updatedCount = 0;

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

        updatedCount++;
        console.log(`  ✓ Updated block ${block.id}`);
      } else {
        console.log(`  ⊘ Skipped block ${block.id} (already has blockData.url)`);
      }
    }

    console.log(`\n✅ Successfully updated ${updatedCount} image blocks`);
    console.log(`⊘  Skipped ${imageBlocks.length - updatedCount} blocks (already have blockData.url)`);

    await queryRunner.release();
    await dataSource.destroy();

    console.log('\n🎉 Image block fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing image blocks:', error);
    process.exit(1);
  }
}

fixImageBlocks();
