import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { GALLERY_VALIDATION } from './gallery-validation.constants';
import { environment } from '../../../../environments/environment';

interface BlogGalleryImage {
  id?: number;
  imageUrl: string;
  order?: number;
}

interface BlogGallery {
  id?: number;
  title: string;
  description: string;
  mainImageIndex: number;
  images: BlogGalleryImage[];
  isPublished: boolean;
  createdAt?: Date;
}

@Component({
  selector: 'app-blog-gallery-editor',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './blog-gallery-editor.component.html',
  styleUrls: ['./blog-gallery-editor.component.scss']
})
export class BlogGalleryEditorComponent implements OnInit {
  galleryId: number | null = null;
  isEditMode = false;
  loading = false;
  saving = false;
  error = '';
  successMessage = '';

  // Form data
  title = '';
  description = '';
  mainImageIndex = 0;
  isPublished = false;
  images: BlogGalleryImage[] = [];

  // Validation
  VALIDATION = GALLERY_VALIDATION;
  validationErrors: { [key: string]: string } = {};

  // File upload
  fileInput: HTMLInputElement | null = null;
  uploading = false;
  uploadProgress = 0;

  // UI
  currentTheme: 'light' | 'dark' = 'light';

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.detectTheme();
    this.listenForThemeChanges();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.galleryId = parseInt(id, 10);
      this.isEditMode = true;
      this.loadGallery();
    }
  }

  loadGallery(): void {
    if (!this.galleryId) return;

    this.loading = true;
    this.api.get<any>(`blog/galleries/${this.galleryId}`).subscribe({
      next: (response) => {
        const gallery = response;
        this.title = gallery.title || '';
        this.description = gallery.description || '';
        this.mainImageIndex = gallery.mainImageIndex || 0;
        this.isPublished = gallery.isPublished || false;
        this.images = gallery.images || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load gallery';
        this.loading = false;
      }
    });
  }

  triggerFileUpload(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e: any) => {
      const files = e.target.files;
      if (files) {
        this.handleFileUpload(files);
      }
    };
    input.click();
  }

  handleFileUpload(files: FileList): void {
    this.uploading = true;
    this.uploadProgress = 0;
    let uploadedCount = 0;
    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('image', file);

      this.api.post<any>('upload/image', formData).subscribe({
        next: (response) => {
          // Add the returned URL to images
          if (response.url) {
            this.images.push({
              imageUrl: response.url,
              order: this.images.length
            });
          }
          uploadedCount++;
          this.uploadProgress = Math.round((uploadedCount / totalFiles) * 100);

          if (uploadedCount === totalFiles) {
            this.uploading = false;
            this.successMessage = `${uploadedCount} image(s) uploaded successfully!`;
            setTimeout(() => this.successMessage = '', 3000);
          }
        },
        error: (err) => {
          console.error('Upload error:', err);
          this.error = `Failed to upload image: ${file.name}`;
          uploadedCount++;

          if (uploadedCount === totalFiles) {
            this.uploading = false;
          }
        }
      });
    }
  }

  removeImage(index: number): void {
    if (confirm('Remove this image?')) {
      this.images.splice(index, 1);
      // Reorder remaining images
      this.images.forEach((img, i) => img.order = i);
      // Adjust mainImageIndex if needed
      if (this.mainImageIndex >= this.images.length && this.images.length > 0) {
        this.mainImageIndex = this.images.length - 1;
      }
    }
  }

  setMainImage(index: number): void {
    this.mainImageIndex = index;
  }

  moveImageUp(index: number): void {
    if (index > 0) {
      [this.images[index], this.images[index - 1]] = [this.images[index - 1], this.images[index]];
      this.images.forEach((img, i) => img.order = i);
    }
  }

  moveImageDown(index: number): void {
    if (index < this.images.length - 1) {
      [this.images[index], this.images[index + 1]] = [this.images[index + 1], this.images[index]];
      this.images.forEach((img, i) => img.order = i);
    }
  }

  async saveGallery(): Promise<void> {
    // Validate form before submission
    this.validationErrors = {};

    if (!this.validateForm()) {
      return;
    }

    this.saving = true;
    this.error = '';

    try {
      const payload: any = {
        images: this.images.map(img => img.imageUrl)
      };

      // Only include title and description if they have values
      if (this.title && this.title.trim()) {
        payload.title = this.title.trim();
      }
      if (this.description && this.description.trim()) {
        payload.description = this.description.trim();
      }

      if (this.isEditMode && this.galleryId) {
        // Update
        payload.mainImageIndex = this.mainImageIndex;
        payload.isPublished = this.isPublished;

        await this.api.put<any>(`blog/galleries/${this.galleryId}`, payload).toPromise();
        this.successMessage = 'Gallery updated successfully!';
      } else {
        // Create
        const response = await this.api.post<any>('blog/galleries', payload).toPromise();
        this.successMessage = 'Gallery created successfully!';

        // Navigate to edit page for new gallery
        if (response?.id) {
          setTimeout(() => {
            this.router.navigate(['/admin/galleries', response.id, 'edit']);
          }, 1000);
        }
      }

      this.saving = false;
      setTimeout(() => {
        if (!this.isEditMode) return; // Don't navigate for new galleries (already done above)
        this.router.navigate(['/admin']);
      }, 2000);
    } catch (err: any) {
      console.error('Save gallery error:', err);

      // Extract error message from various possible error structures
      let errorMessage = 'Failed to save gallery';

      if (err?.error?.message) {
        // NestJS validation error
        if (Array.isArray(err.error.message)) {
          errorMessage = err.error.message.join(', ');
        } else {
          errorMessage = err.error.message;
        }
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      this.error = errorMessage;
      this.saving = false;
    }
  }

  async publishGallery(): Promise<void> {
    if (!this.isEditMode || !this.galleryId) return;

    try {
      await this.api.put<any>(`blog/galleries/${this.galleryId}/publish`, {}).toPromise();
      this.isPublished = true;
      this.successMessage = 'Gallery published!';
      setTimeout(() => this.successMessage = '', 3000);
    } catch (err: any) {
      this.error = 'Failed to publish gallery';
    }
  }

  async unpublishGallery(): Promise<void> {
    if (!this.isEditMode || !this.galleryId) return;

    try {
      await this.api.put<any>(`blog/galleries/${this.galleryId}/unpublish`, {}).toPromise();
      this.isPublished = false;
      this.successMessage = 'Gallery unpublished!';
      setTimeout(() => this.successMessage = '', 3000);
    } catch (err: any) {
      this.error = 'Failed to unpublish gallery';
    }
  }

  async deleteGallery(): Promise<void> {
    if (!this.isEditMode || !this.galleryId) return;

    if (!confirm('Delete this gallery permanently? This cannot be undone.')) {
      return;
    }

    try {
      await this.api.delete<any>(`blog/galleries/${this.galleryId}`).toPromise();
      this.successMessage = 'Gallery deleted!';
      setTimeout(() => {
        this.router.navigate(['/admin']);
      }, 1000);
    } catch (err: any) {
      this.error = 'Failed to delete gallery';
    }
  }

  goBack(): void {
    this.router.navigate(['/admin']);
  }

  /**
   * Get absolute image URL for display
   * Converts relative URLs to absolute by prepending the appropriate base URL
   */
  getAbsoluteImageUrl(imageUrl: string): string {
    if (!imageUrl) {
      console.warn('getAbsoluteImageUrl: Empty imageUrl');
      return '';
    }
    // If it's already an absolute URL (http:// or https://), return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      console.log('getAbsoluteImageUrl: Using absolute URL:', imageUrl);
      return imageUrl;
    }
    // For upload URLs, use the base URL (without /api prefix)
    // because static assets bypass the global API prefix
    if (imageUrl.startsWith('/uploads/')) {
      const fullUrl = environment.baseUrl + imageUrl;
      console.log('getAbsoluteImageUrl: Converted upload URL:', imageUrl, '->', fullUrl);
      return fullUrl;
    }
    // For other relative URLs, prepend the API base URL
    const fullUrl = environment.apiUrl + imageUrl;
    console.log('getAbsoluteImageUrl: Converted relative URL:', imageUrl, '->', fullUrl);
    return fullUrl;
  }

  onImageError(event: any, image: BlogGalleryImage): void {
    console.error('Image failed to load:', {
      originalUrl: image.imageUrl,
      attemptedSrc: event.target?.src,
      image: image
    });
  }

  private detectTheme(): void {
    const dataTheme = document.documentElement.getAttribute('data-theme');
    if (dataTheme === 'dark') {
      this.currentTheme = 'dark';
      return;
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.currentTheme = 'dark';
      return;
    }

    this.currentTheme = 'light';
  }

  private listenForThemeChanges(): void {
    const observer = new MutationObserver(() => {
      this.detectTheme();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

  /**
   * Validate the entire form
   */
  private validateForm(): boolean {
    let isValid = true;

    // Validate images
    const imagesError = this.validateImages();
    if (imagesError) {
      this.validationErrors['images'] = imagesError;
      isValid = false;
    }

    if (!isValid) {
      this.error = Object.values(this.validationErrors)[0] || 'Please fix validation errors';
    }

    return isValid;
  }

  /**
   * Validate images array
   */
  private validateImages(): string | null {
    const config = GALLERY_VALIDATION.images;

    if (this.images.length < config.minItems) {
      return config.errorMessages.minItems;
    }

    return null;
  }

  /**
   * Check if field has validation error
   */
  hasFieldError(fieldName: string): boolean {
    return !!this.validationErrors[fieldName];
  }

  /**
   * Get field error message
   */
  getFieldError(fieldName: string): string {
    return this.validationErrors[fieldName] || '';
  }
}
