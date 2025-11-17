# Telegram Bot Module

This module integrates a Telegram bot with the 237dollars backend, allowing admins to manage content (references and galleries) directly through Telegram.

## Features

- **Admin Authentication**: Authenticates users by their Telegram username stored in the database
- **Reference Management**: Create, view, publish/unpublish references
- **Gallery Management**: Create, view, publish/unpublish image galleries
- **Interactive Workflows**: Step-by-step guided flows for creating content
- **Role-Based Access**: Only SUPER_ADMIN and CONTENT_MANAGER can create content

## Setup

### 1. Create a Telegram Bot

1. Talk to [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` command
3. Follow instructions to create your bot
4. Copy the bot token provided

### 2. Configure Environment

Add the bot token to your `.env` file:

```env
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-from-botfather
```

### 3. Set Admin Telegram Usernames

Admins must have their Telegram username set in the database to use the bot:

1. Go to Admin Management in the frontend
2. Edit admin accounts and add their Telegram username (without @)
3. The username is normalized automatically (@ prefix removed if present)

### 4. Start the Bot

The bot starts automatically when the backend application starts:

```bash
npm run start:dev
```

You should see: `Telegram bot started successfully` in the logs.

## Bot Commands

### General Commands

- `/start` - Welcome message and main menu
- `/help` - Show all available commands
- `/cancel` - Cancel current operation

### Navigation Commands

- `/majors` - List all available majors
- `/topics [major_id]` - List topics for a specific major

### Reference Management

- `/create_reference` - Start creating a new reference (interactive flow)
- `/my_references` - View your created references
- `/publish_ref [id]` - Publish a reference
- `/unpublish_ref [id]` - Unpublish a reference

### Gallery Management

- `/create_gallery` - Start creating a new gallery (interactive flow)
- `/my_galleries` - View your created galleries
- `/publish_gallery [id]` - Publish a gallery
- `/unpublish_gallery [id]` - Unpublish a gallery

## Usage Examples

### Creating a Reference

1. Send `/create_reference`
2. Select a major from the inline buttons
3. Select a topic from the inline buttons
4. Enter the reference title
5. Enter the reference description
6. Enter the reference content (can be plain text or JSON)
7. Reference is created as unpublished
8. Use `/publish_ref [id]` to publish it

Example content formats:

**Plain text:**
```
This is a simple text reference about Korean grammar.
```

**JSON structured content:**
```json
{
  "type": "lesson",
  "sections": [
    {
      "heading": "Introduction",
      "content": "Learn basic Korean grammar..."
    }
  ]
}
```

### Creating a Gallery

1. Send `/create_gallery`
2. Enter gallery title
3. Enter gallery description
4. Enter image URLs (one per line, minimum 1 image)
5. Gallery is created as unpublished
6. Use `/publish_gallery [id]` to publish it

Example image URLs:
```
https://example.com/image1.jpg
https://example.com/image2.jpg
https://example.com/image3.jpg
```

## Authentication Flow

1. User starts the bot with `/start`
2. Bot extracts Telegram username from user profile
3. Bot queries database for admin with matching telegram username
4. If found and active: User is authenticated as admin
5. If not found: User receives message about free site access

**For non-admins:**
```
📚 This bot is for admins only.

But as a free user, you can still use our site for free!

🌐 Visit us at: https://112dollars.com

💡 Get access to educational content and resources.
```

## Conversation State Management

The bot uses in-memory conversation state to track multi-step flows:

- State is stored per Telegram user ID
- Tracks current flow (reference creation, gallery creation)
- Tracks current step and collected data
- Automatically cleaned up on completion or cancellation

**Note:** State is lost on bot restart. For production, consider using Redis for persistent state.

## Permissions

| Command | Required Role |
|---------|--------------|
| `/create_reference` | SUPER_ADMIN, CONTENT_MANAGER |
| `/create_gallery` | SUPER_ADMIN, CONTENT_MANAGER |
| `/publish_ref` | Any admin role |
| `/unpublish_ref` | Any admin role |
| `/publish_gallery` | Any admin role |
| `/unpublish_gallery` | Any admin role |
| Navigation commands | Any admin role |

## Architecture

### Module Structure

```
telegram-bot/
├── telegram-bot.module.ts       # Module definition
├── telegram-bot.service.ts      # Main bot logic and command handlers
├── interfaces/
│   └── conversation-state.interface.ts  # State management interfaces
└── README.md                    # This file
```

### Dependencies

- `telegraf` - Telegram bot framework for Node.js
- Existing services: `ReferencesService`, `BlogGalleryService`
- Existing repositories: `User`, `Major`, `Topic`, `Reference`, `BlogImageGallery`

### Integration Points

The bot integrates with existing backend services:

- **ReferencesService**:
  - `create()` - Create references
  - `publish()` - Publish references
  - `unpublish()` - Unpublish references

- **BlogGalleryService**:
  - `create()` - Create galleries
  - `publish()` - Publish galleries
  - `unpublish()` - Unpublish galleries

- **User Repository**: Authenticate admins by telegram username
- **Major/Topic Repositories**: Navigate content hierarchy

## Error Handling

The bot handles various error scenarios:

- Missing Telegram username
- Unauthorized users (not admin)
- Invalid command arguments
- Database errors during content creation
- Missing required fields
- Invalid data formats

All errors are communicated to the user with friendly messages.

## Future Enhancements

- [ ] Redis-based conversation state for persistence
- [ ] Edit existing references/galleries
- [ ] Delete references/galleries
- [ ] Add content blocks to references
- [ ] Upload images directly through Telegram
- [ ] Search references and galleries
- [ ] Analytics and statistics
- [ ] Webhook mode (instead of polling)
- [ ] Multi-language support

## Troubleshooting

### Bot doesn't start

- Check if `TELEGRAM_BOT_TOKEN` is set in `.env`
- Verify token is valid from BotFather
- Check backend logs for error messages

### User can't access bot

- Verify user has Telegram username set in profile
- Ensure username is added to database without @ prefix
- Check user role is SUPER_ADMIN, ADMIN, or CONTENT_MANAGER
- Verify user account is active (`isActive: true`)

### Commands not working

- Ensure user sends commands starting with `/`
- Check if bot is running (check backend logs)
- Try `/cancel` to reset conversation state
- Restart the bot by restarting the backend

### Reference/Gallery creation fails

- Verify all required fields are provided
- Check image URLs are valid for galleries
- Ensure topic ID exists for references
- Check backend logs for detailed error messages

## Security Considerations

- Bot token should be kept secret (use environment variables)
- Telegram username authentication is secure (usernames are unique)
- Only admins with database records can access bot features
- All database operations respect role-based permissions
- Content is created as unpublished by default for review

## Support

For issues or questions:
- Check backend logs for detailed error messages
- Verify database records for admin telegram usernames
- Ensure all environment variables are configured
- Test with `/help` command to verify bot is responsive
