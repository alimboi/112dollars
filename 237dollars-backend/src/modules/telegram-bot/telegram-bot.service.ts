import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Telegraf, Context, Markup } from 'telegraf';
import { User } from '../../database/entities/user.entity';
import { Major } from '../../database/entities/major.entity';
import { Topic } from '../../database/entities/topic.entity';
import { Reference } from '../../database/entities/reference.entity';
import { BlogImageGallery } from '../../database/entities/blog-image-gallery.entity';
import { ReferencesService } from '../references/references.service';
import { BlogGalleryService } from '../blog/blog-gallery.service';
import { UserRole } from '../../types/user-role.enum';
import {
  ConversationState,
  ConversationFlow,
  ReferenceCreationStep,
  GalleryCreationStep,
  ContentBlockStep,
} from './interfaces/conversation-state.interface';

@Injectable()
export class TelegramBotService implements OnModuleInit {
  private bot: Telegraf;
  private readonly logger = new Logger(TelegramBotService.name);
  private conversationStates = new Map<number, ConversationState>();

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Major)
    private majorRepository: Repository<Major>,
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
    @InjectRepository(Reference)
    private referenceRepository: Repository<Reference>,
    @InjectRepository(BlogImageGallery)
    private galleryRepository: Repository<BlogImageGallery>,
    private referencesService: ReferencesService,
    private blogGalleryService: BlogGalleryService,
  ) {}

  async onModuleInit() {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set in environment variables. Bot will not start.');
      return;
    }

    this.bot = new Telegraf(botToken);
    this.setupCommands();

    try {
      await this.bot.launch();
      this.logger.log('Telegram bot started successfully');
    } catch (error) {
      this.logger.error('Failed to start telegram bot:', error);
    }

    // Graceful shutdown
    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }

  /**
   * Escape special characters for MarkdownV2
   */
  private escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  }

  private setupCommands() {
    // Start command
    this.bot.command('start', (ctx) => this.handleStart(ctx));

    // Help command
    this.bot.command('help', (ctx) => this.handleHelp(ctx));

    // Navigation commands
    this.bot.command('majors', (ctx) => this.handleMajors(ctx));
    this.bot.command('topics', (ctx) => this.handleTopics(ctx));

    // Reference management
    this.bot.command('create_reference', (ctx) => this.handleCreateReference(ctx));
    this.bot.command('my_references', (ctx) => this.handleMyReferences(ctx));
    this.bot.command('publish_ref', (ctx) => this.handlePublishReference(ctx));
    this.bot.command('unpublish_ref', (ctx) => this.handleUnpublishReference(ctx));

    // Content block management
    this.bot.command('add_blocks', (ctx) => this.handleAddBlocks(ctx));
    this.bot.command('list_blocks', (ctx) => this.handleListBlocks(ctx));
    this.bot.command('delete_block', (ctx) => this.handleDeleteBlock(ctx));

    // Gallery management
    this.bot.command('create_gallery', (ctx) => this.handleCreateGallery(ctx));
    this.bot.command('my_galleries', (ctx) => this.handleMyGalleries(ctx));
    this.bot.command('publish_gallery', (ctx) => this.handlePublishGallery(ctx));
    this.bot.command('unpublish_gallery', (ctx) => this.handleUnpublishGallery(ctx));

    // Cancel command
    this.bot.command('cancel', (ctx) => this.handleCancel(ctx));

    // Handle text messages (for conversation flows)
    this.bot.on('text', (ctx) => this.handleTextMessage(ctx));

    // Handle callback queries (inline buttons)
    this.bot.on('callback_query', (ctx) => this.handleCallbackQuery(ctx));
  }

  private async handleStart(ctx: Context) {
    const telegramUsername = ctx.from?.username;

    if (!telegramUsername) {
      await ctx.reply(
        '❌ Please set a Telegram username in your account settings to use this bot.'
      );
      return;
    }

    const admin = await this.getAdminByTelegramUsername(telegramUsername);

    if (!admin) {
      await ctx.reply(
        '📚 This bot is for admins only.\n\n' +
        'But as a free user, you can still use our site for free!\n\n' +
        '🌐 Visit us at: https://112dollars.com\n\n' +
        '💡 Get access to educational content and resources.'
      );
      return;
    }

    await ctx.reply(
      `👋 Welcome, ${admin.email}!\n\n` +
      `You are authenticated as: ${admin.role}\n\n` +
      `Use /help to see available commands.`,
      Markup.inlineKeyboard([
        [Markup.button.callback('📚 Create Reference', 'create_reference')],
        [Markup.button.callback('🖼 Create Gallery', 'create_gallery')],
        [Markup.button.callback('📖 My References', 'my_references')],
        [Markup.button.callback('🎨 My Galleries', 'my_galleries')],
        [Markup.button.callback('❓ Help', 'help')],
      ])
    );
  }

  private async handleHelp(ctx: Context) {
    const admin = await this.checkAdminAuth(ctx);
    if (!admin) return;

    const helpText = `
🤖 *Admin Bot Commands*

*Navigation:*
/majors \\- List all majors
/topics \\[major\\_id\\] \\- List topics for a major

*Reference Management:*
/create\\_reference \\- Create new reference
/my\\_references \\- View your references
/publish\\_ref \\[id\\] \\- Publish a reference
/unpublish\\_ref \\[id\\] \\- Unpublish a reference

*Content Blocks:*
/add\\_blocks \\[ref\\_id\\] \\- Add blocks to reference
/list\\_blocks \\[ref\\_id\\] \\- View all blocks
/delete\\_block \\[block\\_id\\] \\- Delete a block

*Gallery Management:*
/create\\_gallery \\- Create new gallery
/my\\_galleries \\- View your galleries
/publish\\_gallery \\[id\\] \\- Publish a gallery
/unpublish\\_gallery \\[id\\] \\- Unpublish a gallery

*Other:*
/help \\- Show this help message
/cancel \\- Cancel current operation

💡 Tip: Use the inline buttons for easier navigation\\!
    `;

    await ctx.reply(helpText, { parse_mode: 'MarkdownV2' });
  }

  private async handleMajors(ctx: Context) {
    const admin = await this.checkAdminAuth(ctx);
    if (!admin) return;

    const majors = await this.majorRepository.find({
      order: { displayOrder: 'ASC' },
    });

    if (majors.length === 0) {
      await ctx.reply('No majors found.');
      return;
    }

    const buttons = majors.map((major) => [
      Markup.button.callback(
        `${major.name} (ID: ${major.id})`,
        `major_${major.id}`
      ),
    ]);

    await ctx.reply(
      '📚 *Select a major to view topics:*',
      {
        parse_mode: 'MarkdownV2',
        ...Markup.inlineKeyboard(buttons),
      }
    );
  }

  private async handleTopics(ctx: Context) {
    const admin = await this.checkAdminAuth(ctx);
    if (!admin) return;

    const args = (ctx.message as any).text.split(' ');
    const majorId = parseInt(args[1]);

    if (!majorId || isNaN(majorId)) {
      await ctx.reply('❌ Please provide a major ID: /topics [major_id]');
      return;
    }

    const major = await this.majorRepository.findOne({ where: { id: majorId } });
    if (!major) {
      await ctx.reply('❌ Major not found.');
      return;
    }

    const topics = await this.topicRepository.find({
      where: { majorId },
      order: { displayOrder: 'ASC' },
    });

    if (topics.length === 0) {
      await ctx.reply(`No topics found for ${major.name}.`);
      return;
    }

    let message = `📖 *Topics in ${this.escapeMarkdown(major.name)}:*\n\n`;
    topics.forEach((topic) => {
      message += `• ${this.escapeMarkdown(topic.name)} \\(ID: ${topic.id}\\)\n`;
    });

    await ctx.reply(message, { parse_mode: 'MarkdownV2' });
  }

  private async handleCreateReference(ctx: Context) {
    const admin = await this.checkAdminAuth(ctx);
    if (!admin) return;

    // Check role permissions
    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER].includes(admin.role as UserRole)) {
      await ctx.reply('❌ You do not have permission to create references.');
      return;
    }

    // Initialize conversation state
    this.conversationStates.set(ctx.from.id, {
      userId: admin.id,
      telegramUsername: admin.telegramUsername,
      flow: ConversationFlow.CREATE_REFERENCE,
      referenceData: {
        step: ReferenceCreationStep.SELECT_MAJOR,
      },
    });

    // Show major selection
    const majors = await this.majorRepository.find({
      order: { displayOrder: 'ASC' },
    });

    const buttons = majors.map((major) => [
      Markup.button.callback(major.name, `ref_major_${major.id}`),
    ]);
    buttons.push([Markup.button.callback('❌ Cancel', 'cancel')]);

    await ctx.reply(
      '📚 *Step 1/5\\: Select Major*\n\nChoose a major for this reference\\:',
      {
        parse_mode: 'MarkdownV2',
        ...Markup.inlineKeyboard(buttons),
      }
    );
  }

  private async handleMyReferences(ctx: Context) {
    const admin = await this.checkAdminAuth(ctx);
    if (!admin) return;

    const references = await this.referenceRepository.find({
      where: { createdBy: admin.id },
      relations: ['topic', 'topic.major'],
      order: { createdAt: 'DESC' },
      take: 20,
    });

    if (references.length === 0) {
      await ctx.reply('You have not created any references yet.');
      return;
    }

    let message = '📚 *Your References:*\n\n';
    references.forEach((ref) => {
      const status = ref.isPublished ? '✅' : '⏸';
      message += `${status} *${this.escapeMarkdown(ref.title)}* \\(ID: ${ref.id}\\)\n`;
      message += `   📖 ${this.escapeMarkdown(ref.topic.major.name)} \\> ${this.escapeMarkdown(ref.topic.name)}\n`;
      message += `   📅 ${this.escapeMarkdown(ref.createdAt.toLocaleDateString())}\n\n`;
    });

    await ctx.reply(message, { parse_mode: 'MarkdownV2' });
  }

  private async handlePublishReference(ctx: Context) {
    const admin = await this.checkAdminAuth(ctx);
    if (!admin) return;

    const args = (ctx.message as any).text.split(' ');
    const refId = parseInt(args[1]);

    if (!refId || isNaN(refId)) {
      await ctx.reply('❌ Please provide a reference ID: /publish_ref [id]');
      return;
    }

    try {
      await this.referencesService.publish(refId);
      await ctx.reply(`✅ Reference ${refId} published successfully!`);
    } catch (error) {
      await ctx.reply(`❌ Error: ${error.message}`);
    }
  }

  private async handleUnpublishReference(ctx: Context) {
    const admin = await this.checkAdminAuth(ctx);
    if (!admin) return;

    const args = (ctx.message as any).text.split(' ');
    const refId = parseInt(args[1]);

    if (!refId || isNaN(refId)) {
      await ctx.reply('❌ Please provide a reference ID: /unpublish_ref [id]');
      return;
    }

    try {
      await this.referencesService.unpublish(refId);
      await ctx.reply(`⏸ Reference ${refId} unpublished successfully!`);
    } catch (error) {
      await ctx.reply(`❌ Error: ${error.message}`);
    }
  }

  private async handleCreateGallery(ctx: Context) {
    const admin = await this.checkAdminAuth(ctx);
    if (!admin) return;

    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER].includes(admin.role as UserRole)) {
      await ctx.reply('❌ You do not have permission to create galleries.');
      return;
    }

    this.conversationStates.set(ctx.from.id, {
      userId: admin.id,
      telegramUsername: admin.telegramUsername,
      flow: ConversationFlow.CREATE_GALLERY,
      galleryData: {
        step: GalleryCreationStep.ENTER_TITLE,
      },
    });

    await ctx.reply(
      '🖼 *Gallery Creation \\- Step 1/4*\n\n' +
      'Please enter the gallery title\\:\n\n' +
      '\\(Use /cancel to abort\\)',
      { parse_mode: 'MarkdownV2' }
    );
  }

  private async handleMyGalleries(ctx: Context) {
    const admin = await this.checkAdminAuth(ctx);
    if (!admin) return;

    const galleries = await this.galleryRepository.find({
      where: { createdBy: admin.id },
      relations: ['images'],
      order: { createdAt: 'DESC' },
      take: 20,
    });

    if (galleries.length === 0) {
      await ctx.reply('You have not created any galleries yet.');
      return;
    }

    let message = '🖼 *Your Galleries:*\n\n';
    galleries.forEach((gallery) => {
      const status = gallery.isPublished ? '✅' : '⏸';
      message += `${status} *${this.escapeMarkdown(gallery.title)}* \\(ID: ${gallery.id}\\)\n`;
      message += `   🖼 ${gallery.images.length} images\n`;
      message += `   📅 ${this.escapeMarkdown(gallery.createdAt.toLocaleDateString())}\n\n`;
    });

    await ctx.reply(message, { parse_mode: 'MarkdownV2' });
  }

  private async handlePublishGallery(ctx: Context) {
    const admin = await this.checkAdminAuth(ctx);
    if (!admin) return;

    const args = (ctx.message as any).text.split(' ');
    const galleryId = parseInt(args[1]);

    if (!galleryId || isNaN(galleryId)) {
      await ctx.reply('❌ Please provide a gallery ID: /publish_gallery [id]');
      return;
    }

    try {
      await this.blogGalleryService.publish(galleryId);
      await ctx.reply(`✅ Gallery ${galleryId} published successfully!`);
    } catch (error) {
      await ctx.reply(`❌ Error: ${error.message}`);
    }
  }

  private async handleUnpublishGallery(ctx: Context) {
    const admin = await this.checkAdminAuth(ctx);
    if (!admin) return;

    const args = (ctx.message as any).text.split(' ');
    const galleryId = parseInt(args[1]);

    if (!galleryId || isNaN(galleryId)) {
      await ctx.reply('❌ Please provide a gallery ID: /unpublish_gallery [id]');
      return;
    }

    try {
      await this.blogGalleryService.unpublish(galleryId);
      await ctx.reply(`⏸ Gallery ${galleryId} unpublished successfully!`);
    } catch (error) {
      await ctx.reply(`❌ Error: ${error.message}`);
    }
  }

  private async handleCancel(ctx: Context) {
    this.conversationStates.delete(ctx.from.id);
    await ctx.reply('❌ Operation cancelled.');
  }

  private async handleTextMessage(ctx: Context) {
    const admin = await this.checkAdminAuth(ctx);
    if (!admin) return;

    const state = this.conversationStates.get(ctx.from.id);
    if (!state) return;

    if (state.flow === ConversationFlow.CREATE_REFERENCE || state.flow === ConversationFlow.ADD_CONTENT_BLOCK) {
      await this.handleReferenceCreationFlow(ctx, state);
    } else if (state.flow === ConversationFlow.CREATE_GALLERY) {
      await this.handleGalleryCreationFlow(ctx, state);
    }
  }

  private async handleCallbackQuery(ctx: Context) {
    const admin = await this.checkAdminAuth(ctx);
    if (!admin) return;

    const data = (ctx.callbackQuery as any).data;

    if (data === 'help') {
      await this.handleHelp(ctx);
    } else if (data === 'create_reference') {
      await this.handleCreateReference(ctx);
    } else if (data === 'create_gallery') {
      await this.handleCreateGallery(ctx);
    } else if (data === 'my_references') {
      await this.handleMyReferences(ctx);
    } else if (data === 'my_galleries') {
      await this.handleMyGalleries(ctx);
    } else if (data === 'cancel') {
      await this.handleCancel(ctx);
    } else if (data.startsWith('major_')) {
      const majorId = parseInt(data.replace('major_', ''));
      await this.showTopicsForMajor(ctx, majorId);
    } else if (data.startsWith('ref_major_')) {
      await this.handleReferenceMajorSelection(ctx, data);
    } else if (data.startsWith('ref_topic_')) {
      await this.handleReferenceTopicSelection(ctx, data);
    } else if (data.startsWith('block_')) {
      await this.handleBlockTypeSelection(ctx, data);
    } else if (data.startsWith('heading_')) {
      await this.handleHeadingLevelSelection(ctx, data);
    }

    await ctx.answerCbQuery();
  }

  private async handleBlockTypeSelection(ctx: Context, data: string) {
    const state = this.conversationStates.get(ctx.from.id);
    if (!state) return;

    if (data === 'block_done') {
      const totalBlocks = state.referenceData.contentBlocks?.length || 0;
      await ctx.reply(
        `✅ *Reference complete with ${totalBlocks} blocks\\!*\n\n` +
        `Use /publish\\_ref ${state.referenceData.referenceId} to publish it\\.`,
        { parse_mode: 'MarkdownV2' }
      );
      this.conversationStates.delete(ctx.from.id);
      return;
    }

    const blockTypeMap = {
      'block_text': 'TEXT',
      'block_heading': 'HEADING',
      'block_image': 'IMAGE',
      'block_video': 'VIDEO',
      'block_code': 'CODE_BLOCK',
    };

    const blockType = blockTypeMap[data];
    if (!blockType) return;

    state.referenceData.currentBlock = { blockType };
    state.referenceData.blockStep = ContentBlockStep.ENTER_CONTENT;

    const prompts = {
      'TEXT': 'Enter text content\\:',
      'HEADING': 'Enter heading text\\:',
      'IMAGE': 'Enter image URL\\:',
      'VIDEO': 'Enter video URL\\:',
      'CODE_BLOCK': 'Enter code content\\:',
    };

    await ctx.reply(prompts[blockType], { parse_mode: 'MarkdownV2' });
  }

  private async handleHeadingLevelSelection(ctx: Context, data: string) {
    const state = this.conversationStates.get(ctx.from.id);
    if (!state || !state.referenceData.currentBlock) return;

    const level = parseInt(data.replace('heading_', ''));
    state.referenceData.currentBlock.styling = { level };
    await this.saveContentBlock(ctx, state);
  }

  private async handleReferenceMajorSelection(ctx: Context, data: string) {
    const majorId = parseInt(data.replace('ref_major_', ''));
    const state = this.conversationStates.get(ctx.from.id);

    if (!state || state.flow !== ConversationFlow.CREATE_REFERENCE) return;

    state.referenceData.majorId = majorId;
    state.referenceData.step = ReferenceCreationStep.SELECT_TOPIC;

    const topics = await this.topicRepository.find({
      where: { majorId },
      order: { displayOrder: 'ASC' },
    });

    if (topics.length === 0) {
      await ctx.reply('❌ No topics found for this major.');
      this.conversationStates.delete(ctx.from.id);
      return;
    }

    const buttons = topics.map((topic) => [
      Markup.button.callback(topic.name, `ref_topic_${topic.id}`),
    ]);
    buttons.push([Markup.button.callback('❌ Cancel', 'cancel')]);

    await ctx.reply(
      '📖 *Step 2/5\\: Select Topic*\n\nChoose a topic for this reference\\:',
      {
        parse_mode: 'MarkdownV2',
        ...Markup.inlineKeyboard(buttons),
      }
    );
  }

  private async handleReferenceTopicSelection(ctx: Context, data: string) {
    const topicId = parseInt(data.replace('ref_topic_', ''));
    const state = this.conversationStates.get(ctx.from.id);

    if (!state || state.flow !== ConversationFlow.CREATE_REFERENCE) return;

    state.referenceData.topicId = topicId;
    state.referenceData.step = ReferenceCreationStep.ENTER_TITLE;

    await ctx.reply(
      '✏️ *Step 3/4\\: Enter Title*\n\n' +
      'Please enter the reference title\\:\n\n' +
      '\\(Use /cancel to abort\\)',
      { parse_mode: 'MarkdownV2' }
    );
  }

  private async handleReferenceCreationFlow(ctx: Context, state: ConversationState) {
    const text = (ctx.message as any).text;

    switch (state.referenceData.step) {
      case ReferenceCreationStep.ENTER_TITLE:
        state.referenceData.title = text;
        state.referenceData.step = ReferenceCreationStep.ENTER_DESCRIPTION;
        await ctx.reply(
          '📝 *Step 4/4\\: Enter Description*\n\n' +
          'Please enter the reference description\\:\n\n' +
          '\\(Use /cancel to abort\\)',
          { parse_mode: 'MarkdownV2' }
        );
        break;

      case ReferenceCreationStep.ENTER_DESCRIPTION:
        state.referenceData.description = text;
        // Create reference immediately
        await this.createReferenceAndStartBlocks(ctx, state);
        break;

      case ReferenceCreationStep.ADD_CONTENT_BLOCKS:
        // Handle block content input based on current block being created
        await this.handleBlockContentInput(ctx, state, text);
        break;
    }
  }

  private async handleGalleryCreationFlow(ctx: Context, state: ConversationState) {
    const text = (ctx.message as any).text;

    switch (state.galleryData.step) {
      case GalleryCreationStep.ENTER_TITLE:
        state.galleryData.title = text;
        state.galleryData.step = GalleryCreationStep.ENTER_DESCRIPTION;
        await ctx.reply(
          '📝 *Gallery Creation \\- Step 2/4*\n\n' +
          'Please enter the gallery description\\:\n\n' +
          '\\(Use /cancel to abort\\)',
          { parse_mode: 'MarkdownV2' }
        );
        break;

      case GalleryCreationStep.ENTER_DESCRIPTION:
        state.galleryData.description = text;
        state.galleryData.step = GalleryCreationStep.ENTER_IMAGES;
        await ctx.reply(
          '🖼 *Gallery Creation \\- Step 3/4*\n\n' +
          'Please enter image URLs \\(one per line, minimum 1 image\\)\\:\n\n' +
          'Example\\:\n' +
          'https\\://example\\.com/image1\\.jpg\n' +
          'https\\://example\\.com/image2\\.jpg\n\n' +
          '\\(Use /cancel to abort\\)',
          { parse_mode: 'MarkdownV2' }
        );
        break;

      case GalleryCreationStep.ENTER_IMAGES:
        const imageUrls = text.split('\n').map(url => url.trim()).filter(url => url);

        if (imageUrls.length === 0) {
          await ctx.reply('❌ Please provide at least one image URL.');
          return;
        }

        state.galleryData.images = imageUrls;
        await this.createGalleryFromState(ctx, state);
        break;
    }
  }

  private async createReferenceAndStartBlocks(ctx: Context, state: ConversationState) {
    try {
      // Create reference with empty content
      const reference = await this.referencesService.create(
        {
          topicId: state.referenceData.topicId,
          title: state.referenceData.title,
          description: state.referenceData.description,
          content: {},
          isPublished: false,
        },
        state.userId
      );

      // Save reference ID and initialize blocks array
      state.referenceData.referenceId = reference.id;
      state.referenceData.contentBlocks = [];
      state.referenceData.step = ReferenceCreationStep.ADD_CONTENT_BLOCKS;

      await ctx.reply(
        `✅ *Reference created\\!*\n\n` +
        `ID: ${reference.id}\n` +
        `Title: ${this.escapeMarkdown(reference.title)}\n\n` +
        `Now add content blocks\\:`,
        { parse_mode: 'MarkdownV2' }
      );

      // Show block type menu
      await this.showBlockTypeMenu(ctx);
    } catch (error) {
      await ctx.reply(`❌ Error creating reference: ${error.message}`);
      this.conversationStates.delete(ctx.from.id);
    }
  }

  private async showBlockTypeMenu(ctx: Context) {
    const buttons = [
      [Markup.button.callback('📝 Text', 'block_text')],
      [Markup.button.callback('🔤 Heading', 'block_heading')],
      [Markup.button.callback('🖼 Image', 'block_image')],
      [Markup.button.callback('🎥 Video', 'block_video')],
      [Markup.button.callback('💻 Code', 'block_code')],
      [Markup.button.callback('✅ Done', 'block_done')],
      [Markup.button.callback('❌ Cancel', 'cancel')],
    ];

    await ctx.reply(
      'Choose block type to add\\:',
      {
        parse_mode: 'MarkdownV2',
        ...Markup.inlineKeyboard(buttons),
      }
    );
  }

  private async handleBlockContentInput(ctx: Context, state: ConversationState, text: string) {
    const currentBlock = state.referenceData.currentBlock;
    const blockStep = state.referenceData.blockStep;

    if (!currentBlock) return;

    switch (blockStep) {
      case ContentBlockStep.ENTER_CONTENT:
        currentBlock.content = text;

        // Check if we need styling/additional info
        if (currentBlock.blockType === 'HEADING') {
          state.referenceData.blockStep = ContentBlockStep.ENTER_STYLING;
          const buttons = [
            [Markup.button.callback('H1', 'heading_1')],
            [Markup.button.callback('H2', 'heading_2')],
            [Markup.button.callback('H3', 'heading_3')],
          ];
          await ctx.reply(
            'Select heading level\\:',
            {
              parse_mode: 'MarkdownV2',
              ...Markup.inlineKeyboard(buttons),
            }
          );
        } else if (currentBlock.blockType === 'CODE_BLOCK') {
          state.referenceData.blockStep = ContentBlockStep.ENTER_STYLING;
          await ctx.reply(
            'Enter programming language \\(e\\.g\\. javascript, python, typescript\\)\\:',
            { parse_mode: 'MarkdownV2' }
          );
        } else {
          // No additional styling needed, save the block
          await this.saveContentBlock(ctx, state);
        }
        break;

      case ContentBlockStep.ENTER_STYLING:
        // For code blocks, text is the language
        if (currentBlock.blockType === 'CODE_BLOCK') {
          currentBlock.styling = { language: text };
        }
        await this.saveContentBlock(ctx, state);
        break;
    }
  }

  private async saveContentBlock(ctx: Context, state: ConversationState) {
    try {
      const blockData = {
        blockType: state.referenceData.currentBlock.blockType,
        content: state.referenceData.currentBlock.content,
        styling: state.referenceData.currentBlock.styling || {},
        blockData: state.referenceData.currentBlock.blockData || {},
        blockOrder: state.referenceData.contentBlocks.length,
      };

      await this.referencesService.addContentBlock(
        state.referenceData.referenceId,
        blockData
      );

      state.referenceData.contentBlocks.push(blockData);
      state.referenceData.currentBlock = null;
      state.referenceData.blockStep = null;

      await ctx.reply(
        `✅ Block added\\! Total blocks: ${state.referenceData.contentBlocks.length}`,
        { parse_mode: 'MarkdownV2' }
      );

      await this.showBlockTypeMenu(ctx);
    } catch (error) {
      await ctx.reply(`❌ Error saving block: ${error.message}`);
      await this.showBlockTypeMenu(ctx);
    }
  }

  private async handleAddBlocks(ctx: Context) {
    const admin = await this.checkAdminAuth(ctx);
    if (!admin) return;

    const args = (ctx.message as any).text.split(' ');
    const refId = parseInt(args[1]);

    if (!refId || isNaN(refId)) {
      await ctx.reply('❌ Please provide a reference ID: /add\\_blocks \\[ref\\_id\\]', {
        parse_mode: 'MarkdownV2',
      });
      return;
    }

    // Verify reference exists and belongs to user
    const reference = await this.referenceRepository.findOne({
      where: { id: refId, createdBy: admin.id },
    });

    if (!reference) {
      await ctx.reply('❌ Reference not found or you don\\'t have permission\\.', {
        parse_mode: 'MarkdownV2',
      });
      return;
    }

    // Initialize state for adding blocks to existing reference
    this.conversationStates.set(ctx.from.id, {
      userId: admin.id,
      telegramUsername: admin.telegramUsername,
      flow: ConversationFlow.ADD_CONTENT_BLOCK,
      referenceData: {
        referenceId: refId,
        step: ReferenceCreationStep.ADD_CONTENT_BLOCKS,
        contentBlocks: [],
      },
    });

    await ctx.reply(
      `Adding blocks to: *${this.escapeMarkdown(reference.title)}*`,
      { parse_mode: 'MarkdownV2' }
    );

    await this.showBlockTypeMenu(ctx);
  }

  private async handleListBlocks(ctx: Context) {
    const admin = await this.checkAdminAuth(ctx);
    if (!admin) return;

    const args = (ctx.message as any).text.split(' ');
    const refId = parseInt(args[1]);

    if (!refId || isNaN(refId)) {
      await ctx.reply('❌ Please provide a reference ID: /list\\_blocks \\[ref\\_id\\]', {
        parse_mode: 'MarkdownV2',
      });
      return;
    }

    try {
      const reference = await this.referencesService.findOne(refId);

      if (!reference || !reference.contentBlocks || reference.contentBlocks.length === 0) {
        await ctx.reply('No blocks found for this reference\\.', {
          parse_mode: 'MarkdownV2',
        });
        return;
      }

      let message = `📚 *Blocks in: ${this.escapeMarkdown(reference.title)}*\n\n`;
      reference.contentBlocks.forEach((block, index) => {
        message += `${index + 1}\\. ${block.blockType} \\(ID: ${block.id}\\)\n`;
        if (block.content) {
          const preview = block.content.substring(0, 50);
          message += `   ${this.escapeMarkdown(preview)}${block.content.length > 50 ? '\\.\\.\\.' : ''}\n`;
        }
        message += '\n';
      });

      await ctx.reply(message, { parse_mode: 'MarkdownV2' });
    } catch (error) {
      await ctx.reply(`❌ Error: ${error.message}`);
    }
  }

  private async handleDeleteBlock(ctx: Context) {
    const admin = await this.checkAdminAuth(ctx);
    if (!admin) return;

    const args = (ctx.message as any).text.split(' ');
    const blockId = parseInt(args[1]);

    if (!blockId || isNaN(blockId)) {
      await ctx.reply('❌ Please provide a block ID: /delete\\_block \\[block\\_id\\]', {
        parse_mode: 'MarkdownV2',
      });
      return;
    }

    try {
      await this.referencesService.deleteContentBlock(blockId);
      await ctx.reply(`✅ Block ${blockId} deleted successfully\\!`, {
        parse_mode: 'MarkdownV2',
      });
    } catch (error) {
      await ctx.reply(`❌ Error: ${error.message}`);
    }
  }

  private async createGalleryFromState(ctx: Context, state: ConversationState) {
    try {
      const gallery = await this.blogGalleryService.create(
        {
          title: state.galleryData.title,
          description: state.galleryData.description,
          images: state.galleryData.images,
        },
        state.userId
      );

      await ctx.reply(
        `✅ *Gallery created successfully\\!*\n\n` +
        `ID: ${gallery.id}\n` +
        `Title: ${this.escapeMarkdown(gallery.title)}\n` +
        `Images: ${state.galleryData.images.length}\n` +
        `Status: Unpublished\n\n` +
        `Use /publish\\_gallery ${gallery.id} to publish it\\.`,
        { parse_mode: 'MarkdownV2' }
      );

      this.conversationStates.delete(ctx.from.id);
    } catch (error) {
      await ctx.reply(`❌ Error creating gallery: ${error.message}`);
      this.conversationStates.delete(ctx.from.id);
    }
  }

  private async showTopicsForMajor(ctx: Context, majorId: number) {
    const major = await this.majorRepository.findOne({ where: { id: majorId } });
    if (!major) {
      await ctx.reply('❌ Major not found.');
      return;
    }

    const topics = await this.topicRepository.find({
      where: { majorId },
      order: { displayOrder: 'ASC' },
    });

    if (topics.length === 0) {
      await ctx.reply(`No topics found for ${major.name}.`);
      return;
    }

    let message = `📖 *Topics in ${this.escapeMarkdown(major.name)}:*\n\n`;
    topics.forEach((topic) => {
      message += `• ${this.escapeMarkdown(topic.name)} \\(ID: ${topic.id}\\)\n`;
    });

    await ctx.reply(message, { parse_mode: 'MarkdownV2' });
  }

  private async getAdminByTelegramUsername(telegramUsername: string): Promise<User | null> {
    const normalizedUsername = telegramUsername.startsWith('@')
      ? telegramUsername.substring(1)
      : telegramUsername;

    return this.userRepository.findOne({
      where: {
        telegramUsername: normalizedUsername,
        role: In([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.STUDENT_MANAGER]),
        isActive: true,
      },
    });
  }

  private async checkAdminAuth(ctx: Context): Promise<User | null> {
    const telegramUsername = ctx.from?.username;

    if (!telegramUsername) {
      await ctx.reply('❌ Please set a Telegram username to use this bot.');
      return null;
    }

    const admin = await this.getAdminByTelegramUsername(telegramUsername);

    if (!admin) {
      await ctx.reply(
        '❌ You are not authorized to use this bot.\n\n' +
        '🌐 Visit https://112dollars.com to access our free content!'
      );
      return null;
    }

    return admin;
  }
}
