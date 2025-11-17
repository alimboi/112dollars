export enum ConversationFlow {
  NONE = 'none',
  CREATE_REFERENCE = 'create_reference',
  CREATE_GALLERY = 'create_gallery',
}

export enum ReferenceCreationStep {
  SELECT_MAJOR = 'select_major',
  SELECT_TOPIC = 'select_topic',
  ENTER_TITLE = 'enter_title',
  ENTER_DESCRIPTION = 'enter_description',
  ENTER_CONTENT = 'enter_content',
  CONFIRM = 'confirm',
}

export enum GalleryCreationStep {
  ENTER_TITLE = 'enter_title',
  ENTER_DESCRIPTION = 'enter_description',
  ENTER_IMAGES = 'enter_images',
  CONFIRM = 'confirm',
}

export interface ConversationState {
  userId: number;
  telegramUsername: string;
  flow: ConversationFlow;
  referenceData?: {
    step: ReferenceCreationStep;
    majorId?: number;
    topicId?: number;
    title?: string;
    description?: string;
    content?: any;
  };
  galleryData?: {
    step: GalleryCreationStep;
    title?: string;
    description?: string;
    images?: string[];
  };
}
