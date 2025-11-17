# Telegram Bot Complete Redesign

## Problem
Current bot only accepts plain text for content, while the UI allows rich content with multiple blocks (headings, text, images, videos, code blocks).

## Solution
Complete redesign to match UI capabilities:

### New Reference Creation Flow

**Step 1-3:** Major → Topic → Title (same as before)

**Step 4:** Description

**Step 5:** Add Content Blocks
- Show menu with options:
  - 📝 Add Text Block
  - 🔤 Add Heading
  - 🖼 Add Image
  - 🎥 Add Video
  - 💻 Add Code Block
  - ✅ Done (Finish & Create)
  - ❌ Cancel

**For each block type:**

**Text Block:**
- Enter text content
- Block added, return to menu

**Heading:**
- Enter heading text
- Select level (H1, H2, H3)
- Block added, return to menu

**Image:**
- Enter image URL
- Optional: Enter caption
- Block added, return to menu

**Video:**
- Enter video URL
- Optional: Enter caption
- Block added, return to menu

**Code Block:**
- Enter code content
- Enter language (javascript, python, etc.)
- Block added, return to menu

**Done:**
- Show summary of all blocks
- Create reference with all blocks
- Success message with ID

### New Commands

**Reference Management:**
- `/create_reference` - Create with blocks
- `/edit_reference [id]` - Edit title/description
- `/add_block [ref_id]` - Add blocks to existing reference
- `/list_blocks [ref_id]` - List all blocks
- `/delete_block [block_id]` - Delete a block
- `/my_references` - View your references with block count

**Gallery Management:**
- Keep existing flow (already good)

### Technical Implementation

**Create Reference:**
1. Collect title & description
2. Create empty reference in DB
3. Enter block addition loop
4. For each block, call `addContentBlock(referenceId, blockData)`
5. Show summary
6. Reference stays unpublished until admin publishes

**Content Block Structure:**
```typescript
{
  blockType: 'TEXT' | 'HEADING' | 'IMAGE' | 'VIDEO' | 'CODE_BLOCK',
  blockOrder: number,
  content: string,
  styling: {
    // For headings
    level?: 1 | 2 | 3,
    // For code
    language?: string,
    // For images/videos
    caption?: string
  },
  blockData: {
    // Additional data as needed
  }
}
```

## Benefits
1. ✅ Same capabilities as UI
2. ✅ Rich content support
3. ✅ Multiple blocks per reference
4. ✅ Edit existing references
5. ✅ Manage content blocks
6. ✅ Professional, complete solution
