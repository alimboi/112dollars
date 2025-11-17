import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { CdkDrag, CdkDropList, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { SafeUrlPipe } from '../../../shared/pipes/safe-url.pipe';
import { ColorThemeUtil } from '../../../shared/utils/color-theme.util';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface Major {
  id: number;
  name: string;
}

interface Topic {
  id: number;
  name: string;
  majorId: number;
}

interface TextStyle {
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  textAlign?: string;
  lineHeight?: number;
  letterSpacing?: number;
  marginTop?: number;
  marginBottom?: number;
  padding?: number;
}

interface ContentBlock {
  id?: number;
  tempId?: string;
  blockType: 'heading' | 'text' | 'image' | 'video' | 'code_block';
  content?: string;
  styling?: TextStyle;
  blockData?: any;
  blockOrder: number;
  topicName?: string;
}

@Component({
  selector: 'app-reference-editor',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CdkDrag, CdkDropList, SafeUrlPipe],
  templateUrl: './reference-editor.component.html',
  styleUrls: ['./reference-editor.component.scss']
})
export class ReferenceEditorComponent implements OnInit, OnDestroy {
  // Memory leak prevention
  private destroy$ = new Subject<void>();
  private themeObserver?: MutationObserver;
  private storageChangeHandler = (e: StorageEvent) => {
    if (e.key === 'theme') {
      this.detectTheme();
    }
  };

  // Form data
  selectedMajorId: number | null = null;
  selectedTopicId: number | null = null;
  referenceTitle = '';
  referenceDescription = '';

  // Majors and topics
  majors: Major[] = [];
  topics: Topic[] = [];

  // Content blocks
  contentBlocks: ContentBlock[] = [];
  currentBlock: ContentBlock | null = null;
  editingBlockIndex: number | null = null;
  contrastWarning: string = '';

  // UI state
  loading = false;
  saving = false;
  previewMode = false;
  showBlockEditor = false;
  currentTheme: 'light' | 'dark' = 'light';

  // Reference ID (for editing)
  referenceId: number | null = null;
  isEditMode = false;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Detect initial theme
    this.detectTheme();

    // Listen for theme changes
    this.listenForThemeChanges();

    this.loadMajors();

    // Check if editing existing reference
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['id']) {
          this.referenceId = +params['id'];
          this.isEditMode = true;
          this.loadReference(this.referenceId);
        }
      });
  }

  loadMajors(): void {
    this.loading = true;
    this.api.get<Major[]>('references/majors')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (majors) => {
          this.majors = majors;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading majors:', err);
          this.loading = false;
        }
      });
  }

  onMajorChange(): void {
    this.selectedTopicId = null;
    this.topics = [];

    if (this.selectedMajorId) {
      this.loading = true;
      this.api.get<Topic[]>(`references/majors/${this.selectedMajorId}/topics`)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (topics) => {
            this.topics = topics;
            this.loading = false;
          },
          error: (err) => {
            console.error('Error loading topics:', err);
            this.loading = false;
          }
        });
    }
  }

  loadReference(id: number): void {
    this.loading = true;
    this.api.get<any>(`references/${id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reference) => {
          this.referenceTitle = reference.title;
          this.referenceDescription = reference.description || '';
          this.selectedTopicId = reference.topicId;
          this.selectedMajorId = reference.topic?.majorId;

          // Load content blocks
          if (reference.contentBlocks && reference.contentBlocks.length > 0) {
            this.contentBlocks = reference.contentBlocks.map((block: any) => ({
              id: block.id,
              blockType: block.blockType,
              content: block.content,
              styling: block.styling,
              blockData: block.blockData,
              blockOrder: block.blockOrder,
              topicName: block.topicName
            }));
          }

          // Load topics for selected major (this will also set loading to false when done)
          if (this.selectedMajorId) {
            this.loadTopicsForMajor(this.selectedMajorId);
          } else {
            this.loading = false;
          }
        },
        error: (err) => {
          console.error('Error loading reference:', err);
          alert('Failed to load reference');
          this.router.navigate(['/admin']);
          this.loading = false;
        }
      });
  }

  /**
   * Load topics for a major
   */
  private loadTopicsForMajor(majorId: number): void {
    this.api.get<Topic[]>(`references/majors/${majorId}/topics`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (topics) => {
          this.topics = topics;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading topics:', err);
          this.loading = false;
        }
      });
  }

  // ===== CONTENT BLOCK MANAGEMENT =====

  addTextBlock(): void {
    const block: ContentBlock = {
      tempId: this.generateTempId(),
      blockType: 'text',
      content: '',
      styling: {
        fontFamily: 'Arial',
        fontSize: 16,
        color: '#ffffff',
        backgroundColor: 'transparent',
        fontWeight: 'normal',
        textAlign: 'left',
        lineHeight: 1.5,
        letterSpacing: 0,
        marginTop: 0,
        marginBottom: 16,
        padding: 0
      },
      blockOrder: this.contentBlocks.length,
      topicName: ''
    };

    this.currentBlock = block;
    this.editingBlockIndex = null;
    this.showBlockEditor = true;
  }

  addHeadingBlock(): void {
    const block: ContentBlock = {
      tempId: this.generateTempId(),
      blockType: 'heading',
      content: '',
      styling: {
        fontFamily: 'Arial',
        fontSize: 32,
        color: '#ff3366',
        backgroundColor: 'transparent',
        fontWeight: 'bold',
        textAlign: 'left',
        lineHeight: 1.2,
        letterSpacing: 0,
        marginTop: 24,
        marginBottom: 16,
        padding: 0
      },
      blockOrder: this.contentBlocks.length,
      topicName: ''
    };

    this.currentBlock = block;
    this.editingBlockIndex = null;
    this.showBlockEditor = true;
  }

  addImageBlock(): void {
    const block: ContentBlock = {
      tempId: this.generateTempId(),
      blockType: 'image',
      content: '',
      blockData: {
        url: '',
        alt: '',
        width: '100%',
        height: 'auto',
        alignment: 'center',
        borderRadius: 8,
        boxShadow: 'medium'
      },
      blockOrder: this.contentBlocks.length
    };

    this.currentBlock = block;
    this.editingBlockIndex = null;
    this.showBlockEditor = true;
  }

  addVideoBlock(): void {
    const block: ContentBlock = {
      tempId: this.generateTempId(),
      blockType: 'video',
      content: '',
      blockData: {
        url: '',
        width: '100%',
        alignment: 'center',
        showTitle: true,
        showDescription: false
      },
      blockOrder: this.contentBlocks.length
    };

    this.currentBlock = block;
    this.editingBlockIndex = null;
    this.showBlockEditor = true;
  }

  addCodeBlock(): void {
    const block: ContentBlock = {
      tempId: this.generateTempId(),
      blockType: 'code_block',
      content: '',
      styling: {
        fontFamily: 'Courier New',
        fontSize: 14,
        color: '#00ff00',
        backgroundColor: '#1a1a1a',
        padding: 16,
        marginTop: 16,
        marginBottom: 16
      },
      blockData: {
        language: 'javascript'
      },
      blockOrder: this.contentBlocks.length
    };

    this.currentBlock = block;
    this.editingBlockIndex = null;
    this.showBlockEditor = true;
  }

  saveCurrentBlock(): void {
    if (!this.currentBlock) return;

    if (this.editingBlockIndex !== null) {
      // Update existing block
      this.contentBlocks[this.editingBlockIndex] = { ...this.currentBlock };
    } else {
      // Add new block
      this.contentBlocks.push({ ...this.currentBlock });
    }

    this.closeBlockEditor();
  }

  editBlock(index: number): void {
    this.currentBlock = { ...this.contentBlocks[index] };
    this.editingBlockIndex = index;
    this.showBlockEditor = true;
  }

  deleteBlock(index: number): void {
    if (confirm('Delete this content block?')) {
      this.contentBlocks.splice(index, 1);
      // Update block orders
      this.contentBlocks.forEach((block, idx) => {
        block.blockOrder = idx;
      });
    }
  }

  closeBlockEditor(): void {
    this.currentBlock = null;
    this.editingBlockIndex = null;
    this.showBlockEditor = false;
  }

  // ===== DRAG AND DROP =====

  drop(event: CdkDragDrop<ContentBlock[]>): void {
    moveItemInArray(this.contentBlocks, event.previousIndex, event.currentIndex);
    // Update block orders
    this.contentBlocks.forEach((block, idx) => {
      block.blockOrder = idx;
    });
  }

  // ===== IMAGE UPLOAD =====

  async onImageSelect(event: any): Promise<void> {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    // Upload image to backend
    const formData = new FormData();
    formData.append('image', file);

    this.loading = true;

    try {
      const response = await this.api.post<any>('upload/image', formData).toPromise();

      if (this.currentBlock) {
        // Store the URL in content field (consistent with telegram bot)
        const fullUrl = 'http://localhost:3000' + response?.url;
        this.currentBlock.content = fullUrl;

        // Also store in blockData for backward compatibility
        if (this.currentBlock.blockData) {
          this.currentBlock.blockData.url = fullUrl;
          this.currentBlock.blockData.filename = response?.filename;
        }
      }

      this.loading = false;
      alert('Image uploaded successfully!');
    } catch (err: any) {
      console.error('Error uploading image:', err);

      // Handle different error types
      let errorMessage = 'Failed to upload image';
      if (err?.status === 401) {
        errorMessage = 'Unauthorized: Your session may have expired. Please log in again and try again.';
      } else if (err?.status === 403) {
        errorMessage = 'Forbidden: You don\'t have permission to upload images. Please contact your administrator.';
      } else if (err?.status === 413) {
        errorMessage = 'File too large: Maximum file size is 5MB';
      } else if (err?.error?.message) {
        errorMessage = err.error.message;
      }

      alert(errorMessage);
      this.loading = false;
    }
  }

  // ===== VIDEO URL =====

  extractYouTubeId(url: string): string | null {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  onVideoUrlChange(url: string): void {
    if (this.currentBlock && this.currentBlock.blockData) {
      const videoId = this.extractYouTubeId(url);
      if (videoId) {
        this.currentBlock.blockData.videoId = videoId;
        this.currentBlock.blockData.url = url;
      }
    }
  }

  // ===== SAVE REFERENCE =====

  async saveReference(publish: boolean = false): Promise<void> {
    if (!this.validateForm()) return;

    this.saving = true;

    try {
      let referenceId = this.referenceId;

      // Step 1: Create or update reference
      const referenceData = {
        topicId: this.selectedTopicId,
        title: this.referenceTitle,
        description: this.referenceDescription,
        content: {}, // Empty object for now
        isPublished: publish
      };

      if (this.isEditMode && referenceId) {
        // Update existing reference
        await this.api.put(`references/${referenceId}`, referenceData).toPromise();
      } else {
        // Create new reference
        const response = await this.api.post<any>('references', referenceData).toPromise();
        referenceId = response.id;
        this.referenceId = referenceId;
      }

      // Step 2: Save content blocks
      if (referenceId) {
        await this.saveContentBlocks(referenceId);
      }

      this.saving = false;
      alert(`Reference ${publish ? 'published' : 'saved as draft'} successfully!`);
      this.router.navigate(['/admin']);

    } catch (err) {
      console.error('Error saving reference:', err);
      alert('Failed to save reference');
      this.saving = false;
    }
  }

  async saveContentBlocks(referenceId: number): Promise<void> {
    // Delete all existing blocks and recreate (simpler for now)
    for (const block of this.contentBlocks) {
      const blockData = {
        blockType: block.blockType,
        content: block.content || '',
        styling: block.styling || {},
        blockData: block.blockData || {},
        blockOrder: block.blockOrder,
        topicName: block.topicName || ''
      };

      await this.api.post(`references/${referenceId}/content-blocks`, blockData).toPromise();
    }
  }

  validateForm(): boolean {
    if (!this.selectedMajorId) {
      alert('Please select a major');
      return false;
    }

    if (!this.selectedTopicId) {
      alert('Please select a topic');
      return false;
    }

    if (!this.referenceTitle.trim()) {
      alert('Please enter a title');
      return false;
    }

    if (this.contentBlocks.length === 0) {
      alert('Please add at least one content block');
      return false;
    }

    return true;
  }

  // ===== PREVIEW =====

  togglePreview(): void {
    this.previewMode = !this.previewMode;
  }

  // ===== HELPERS =====

  generateTempId(): string {
    return 'temp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  getBlockTypeIcon(type: string): string {
    const icons: any = {
      'heading': '📌',
      'text': '📝',
      'image': '🖼️',
      'video': '▶️',
      'code_block': '{ }'
    };
    return icons[type] || '•';
  }

  getBlockPreview(block: ContentBlock): string {
    if (block.blockType === 'image') {
      return 'Image: ' + (block.blockData?.alt || 'Untitled');
    } else if (block.blockType === 'video') {
      return 'Video: ' + (block.blockData?.url || 'No URL');
    } else {
      return block.content?.substring(0, 50) || 'Empty block';
    }
  }

  // ===== COLOR CONTRAST CHECKING =====

  /**
   * Check contrast when color changes
   * Shows warning if colors have poor contrast
   */
  onColorChange(): void {
    if (!this.currentBlock?.styling) {
      this.contrastWarning = '';
      return;
    }

    const textColor = this.currentBlock.styling.color;
    const bgColor = this.currentBlock.styling.backgroundColor;

    // Only check if both colors are set
    if (!textColor || !bgColor) {
      this.contrastWarning = '';
      return;
    }

    const warning = ColorThemeUtil.getContrastWarning(textColor, bgColor);
    this.contrastWarning = warning.hasWarning
      ? `⚠️ ${warning.message}`
      : `✓ ${warning.message}`;
  }

  /**
   * Get color accessibility options for admin
   */
  getColorOptions(): Array<{ value: string; label: string }> {
    return ColorThemeUtil.getColorOptions();
  }

  /**
   * Check if colors are accessible
   */
  areColorsAccessible(): boolean {
    if (!this.currentBlock?.styling) return true;

    const textColor = this.currentBlock.styling.color;
    const bgColor = this.currentBlock.styling.backgroundColor;

    if (!textColor || !bgColor) return true;

    return ColorThemeUtil.isAccessibleContrast(textColor, bgColor);
  }

  // ===== THEME AWARENESS =====

  /**
   * Detect current theme from document root attribute
   */
  private detectTheme(): void {
    // Check data-theme attribute on document root (set by navbar)
    const dataTheme = document.documentElement.getAttribute('data-theme');
    if (dataTheme === 'dark') {
      this.currentTheme = 'dark';
      return;
    }

    // Check if user has a saved theme preference in localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.currentTheme = 'dark';
      return;
    }

    // Default to light theme
    this.currentTheme = 'light';
  }

  /**
   * Listen for theme changes in real-time
   */
  private listenForThemeChanges(): void {
    // Use MutationObserver to watch for data-theme attribute changes on document root
    this.themeObserver = new MutationObserver(() => {
      this.detectTheme();
    });

    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    // Also listen for storage changes (in case theme changes in different tab)
    window.addEventListener('storage', this.storageChangeHandler);
  }

  /**
   * Get theme-aware style for a content block
   * Automatically adjusts colors based on current theme
   */
  getThemeAwareStyle(styling: any): any {
    if (!styling) return {};

    const themeAwareStyle = { ...styling };

    // Adjust color based on current theme
    if (styling.color) {
      themeAwareStyle.color = ColorThemeUtil.getThemeAwareColor(styling.color, this.currentTheme);
    }

    // Adjust background color based on current theme
    if (styling.backgroundColor) {
      themeAwareStyle.backgroundColor = ColorThemeUtil.getThemeAwareColor(
        styling.backgroundColor,
        this.currentTheme
      );
    }

    return themeAwareStyle;
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.destroy$.next();
    this.destroy$.complete();

    // Disconnect MutationObserver
    if (this.themeObserver) {
      this.themeObserver.disconnect();
    }

    // Remove storage event listener
    window.removeEventListener('storage', this.storageChangeHandler);
  }
}
