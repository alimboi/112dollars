import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { GALLERY_VALIDATION } from './gallery-validation.constants';
import { environment } from '../../../environments/environment';

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

  addImageUrl(): void {
    const urlInput = prompt('Enter image URL:');
    if (urlInput && this.isValidUrl(urlInput)) {
      this.images.push({
        imageUrl: urlInput,
        order: this.images.length
      });
      this.successMessage = 'Image URL added!';
      setTimeout(() => this.successMessage = '', 3000);
    } else if (urlInput) {
      this.error = 'Invalid URL format';
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
      if (this.isEditMode && this.galleryId) {
        // Update
        const payload = {
          title: this.title || 'Untitled Gallery',
          description: this.description || '',
          mainImageIndex: this.mainImageIndex,
          images: this.images.map(img => img.imageUrl),
          isPublished: this.isPublished
        };
        await this.api.put<any>(`blog/galleries/${this.galleryId}`, payload).toPromise();
        this.successMessage = 'Gallery updated successfully!';
      } else {
        // Create
        const payload = {
          title: this.title || 'Untitled Gallery',
          description: this.description || '',
          images: this.images.map(img => img.imageUrl)
        };
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
      this.error = err?.error?.message || 'Failed to save gallery';
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
   * Converts relative URLs to absolute by prepending the API base URL
   */
  getAbsoluteImageUrl(imageUrl: string): string {
    if (!imageUrl) return '';
    // If it's already an absolute URL (http:// or https://), return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    // Otherwise, prepend the API base URL
    return environment.apiUrl + imageUrl;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
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

    // Validate title if provided
    if (this.title.trim()) {
      const titleError = this.validateField('title', this.title);
      if (titleError) {
        this.validationErrors['title'] = titleError;
        isValid = false;
      }
    }

    // Validate description if provided
    if (this.description.trim()) {
      const descError = this.validateField('description', this.description);
      if (descError) {
        this.validationErrors['description'] = descError;
        isValid = false;
      }
    }

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
   * Validate a single field
   */
  private validateField(fieldName: string, value: string): string | null {
    const config = GALLERY_VALIDATION[fieldName as keyof typeof GALLERY_VALIDATION];

    if (!config) return null;

    // Type guard for fields with minLength/maxLength
    if ('minLength' in config && 'maxLength' in config) {
      const typedConfig = config as any;

      // Check minLength
      if (value.length < typedConfig.minLength) {
        return typedConfig.errorMessages.minLength;
      }

      // Check maxLength
      if (value.length > typedConfig.maxLength) {
        return typedConfig.errorMessages.maxLength;
      }
    }

    return null;
  }

  /**
   * Validate images array
   */
  private validateImages(): string | null {
    const config = GALLERY_VALIDATION.images;

    if (this.images.length < config.minItems) {
      return config.errorMessages.minItems;
    }

    // Validate each image URL
    for (const image of this.images) {
      if (!this.isValidUrl(image.imageUrl)) {
        return config.errorMessages.invalidUrl;
      }
    }

    return null;
  }

  /**
   * Validate a field in real-time and update error display
   */
  validateFieldOnChange(fieldName: string): void {
    if (fieldName === 'title' && this.title.trim()) {
      const error = this.validateField('title', this.title);
      if (error) {
        this.validationErrors['title'] = error;
      } else {
        delete this.validationErrors['title'];
      }
    } else if (fieldName === 'description' && this.description.trim()) {
      const error = this.validateField('description', this.description);
      if (error) {
        this.validationErrors['description'] = error;
      } else {
        delete this.validationErrors['description'];
      }
    }
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
