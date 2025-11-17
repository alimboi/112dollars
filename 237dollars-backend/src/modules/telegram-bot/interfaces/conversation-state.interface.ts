export enum ConversationFlow {
  NONE = 'none',
  CREATE_REFERENCE = 'create_reference',
  EDIT_REFERENCE = 'edit_reference',
  ADD_CONTENT_BLOCK = 'add_content_block',
  EDIT_CONTENT_BLOCK = 'edit_content_block',
  CREATE_GALLERY = 'create_gallery',
}

export enum ReferenceCreationStep {
  SELECT_MAJOR = 'select_major',
  SELECT_TOPIC = 'select_topic',
  ENTER_TITLE = 'enter_title',
  ENTER_DESCRIPTION = 'enter_description',
  ADD_CONTENT_BLOCKS = 'add_content_blocks',
  CONFIRM = 'confirm',
}

export enum ContentBlockStep {
  SELECT_TYPE = 'select_type',
  ENTER_CONTENT = 'enter_content',
  ENTER_STYLING = 'enter_styling',
}

export enum GalleryCreationStep {
  ENTER_TITLE = 'enter_title',
  ENTER_DESCRIPTION = 'enter_description',
  ENTER_IMAGES = 'enter_images',
  CONFIRM = 'confirm',
}

export interface ContentBlockData {
  blockType?: string;
  content?: string;
  styling?: any;
  blockData?: any;
}

export interface ConversationState {
  userId: number;
  telegramUsername: string;
  flow: ConversationFlow;
  referenceData?: {
    step: ReferenceCreationStep;
    referenceId?: number;
    majorId?: number;
    topicId?: number;
    title?: string;
    description?: string;
    contentBlocks?: ContentBlockData[];
    currentBlock?: ContentBlockData;
    blockStep?: ContentBlockStep;
  };
  galleryData?: {
    step: GalleryCreationStep;
    title?: string;
    description?: string;
    images?: string[];
  };
}
