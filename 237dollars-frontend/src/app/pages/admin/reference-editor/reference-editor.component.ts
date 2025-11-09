import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { SafeUrlPipe } from '../../../shared/pipes/safe-url.pipe';

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
  imports: [CommonModule, RouterModule, FormsModule, DragDropModule, SafeUrlPipe],
  templateUrl: './reference-editor.component.html',
  styleUrls: ['./reference-editor.component.scss']
})
export class ReferenceEditorComponent implements OnInit {
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

  // UI state
  loading = false;
  saving = false;
  previewMode = false;
  showBlockEditor = false;

  // Reference ID (for editing)
  referenceId: number | null = null;
  isEditMode = false;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMajors();

    // Check if editing existing reference
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.referenceId = +params['id'];
        this.isEditMode = true;
        this.loadReference(this.referenceId);
      }
    });
  }

  loadMajors(): void {
    this.loading = true;
    this.api.get<Major[]>('references/majors').subscribe({
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
      this.api.get<Topic[]>(`references/majors/${this.selectedMajorId}/topics`).subscribe({
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
    this.api.get<any>(`references/${id}`).subscribe({
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

        this.loading = false;

        // Load topics for selected major
        if (this.selectedMajorId) {
          this.onMajorChange();
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

  onImageSelect(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }

    // Convert to base64 for preview (in production, upload to S3)
    const reader = new FileReader();
    reader.onload = (e: any) => {
      if (this.currentBlock && this.currentBlock.blockData) {
        this.currentBlock.blockData.url = e.target.result;
      }
    };
    reader.readAsDataURL(file);
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
}
