import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';
import { ApiService } from '../../../core/services/api.service';
import { environment } from '../../../../environments/environment';

interface BlogGalleryImage {
  id?: number;
  galleryId?: number;
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
  creator?: { id: number; email: string };
}

@Component({
  selector: 'app-blog-gallery-manager',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule],
  templateUrl: './blog-gallery-manager.component.html',
  styleUrls: ['./blog-gallery-manager.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(1rem)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class BlogGalleryManagerComponent implements OnInit, OnDestroy {
  galleries: BlogGallery[] = [];
  isFormOpen = false;
  isEditMode = false;
  editingId: number | null = null;
  loading = false;
  saving = false;
  error = '';
  successMessage = '';
  currentPage = 1;
  pageSize = 12;
  totalPages = 1;
  currentTheme: 'light' | 'dark' = 'light';

  formData: BlogGallery = {
    title: '',
    description: '',
    mainImageIndex: 0,
    images: [{ imageUrl: '' }],
    isPublished: false
  };

  private subscriptions = new Subscription();

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    console.log('[MANAGER] ============ COMPONENT LOADED - VERSION 2.0 ============');
    console.log('[MANAGER] environment.baseUrl:', environment.baseUrl);
    this.detectTheme();
    this.listenForThemeChanges();
    this.loadGalleries();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadGalleries(): void {
    this.loading = true;
    const sub = this.api.get<any>(`blog/galleries?page=${this.currentPage}&limit=${this.pageSize}`)
      .subscribe({
        next: (response) => {
          console.log('[MANAGER] Loaded galleries response:', response);
          this.galleries = response.galleries || [];
          console.log('[MANAGER] Galleries array:', this.galleries);
          this.galleries.forEach((g, i) => {
            console.log(`[MANAGER] Gallery ${i}:`, {
              id: g.id,
              title: g.title,
              images: g.images,
              mainImageIndex: g.mainImageIndex
            });
          });
          this.totalPages = response.totalPages || 1;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading galleries:', err);
          this.error = 'Failed to load galleries';
          this.loading = false;
        }
      });
    this.subscriptions.add(sub);
  }

  openForm(gallery?: BlogGallery): void {
    if (gallery) {
      this.isEditMode = true;
      this.editingId = gallery.id || null;
      this.formData = {
        ...gallery,
        images: gallery.images && gallery.images.length > 0
          ? [...gallery.images]
          : [{ imageUrl: '' }]
      };
    } else {
      this.isEditMode = false;
      this.editingId = null;
      this.formData = {
        title: '',
        description: '',
        mainImageIndex: 0,
        images: [{ imageUrl: '' }],
        isPublished: false
      };
    }
    this.isFormOpen = true;
    this.error = '';
    this.successMessage = '';
  }

  closeForm(): void {
    this.isFormOpen = false;
    this.error = '';
  }

  addImageField(): void {
    this.formData.images.push({ imageUrl: '' });
  }

  removeImageField(index: number): void {
    if (this.formData.images.length > 1) {
      this.formData.images.splice(index, 1);
      // Adjust mainImageIndex if necessary
      if (this.formData.mainImageIndex >= this.formData.images.length) {
        this.formData.mainImageIndex = Math.max(0, this.formData.images.length - 1);
      }
    }
  }

  async saveGallery(): Promise<void> {
    // Validation
    if (!this.formData.title.trim()) {
      this.error = 'Title is required';
      return;
    }
    if (!this.formData.description.trim()) {
      this.error = 'Description is required';
      return;
    }

    const validImages = this.formData.images.filter(img => img.imageUrl.trim());
    if (validImages.length === 0) {
      this.error = 'At least one image URL is required';
      return;
    }

    if (this.formData.mainImageIndex >= validImages.length) {
      this.error = 'Invalid main image selection';
      return;
    }

    this.saving = true;
    this.error = '';

    try {
      if (this.isEditMode && this.editingId) {
        // Update - can include all fields
        const updatePayload = {
          title: this.formData.title,
          description: this.formData.description,
          mainImageIndex: this.formData.mainImageIndex,
          images: validImages.map(img => img.imageUrl),
          isPublished: this.formData.isPublished
        };
        await this.api.put<any>(`blog/galleries/${this.editingId}`, updatePayload).toPromise();
        this.successMessage = 'Gallery updated successfully!';
      } else {
        // Create - only title, description, and images
        const createPayload = {
          title: this.formData.title,
          description: this.formData.description,
          images: validImages.map(img => img.imageUrl)
        };
        await this.api.post<any>('blog/galleries', createPayload).toPromise();
        this.successMessage = 'Gallery created successfully!';
      }

      this.saving = false;
      this.closeForm();
      this.loadGalleries();
      setTimeout(() => this.successMessage = '', 3000);
    } catch (err: any) {
      this.error = err?.error?.message || 'Failed to save gallery';
      this.saving = false;
    }
  }

  async deleteGallery(id: number): Promise<void> {
    if (!confirm('Are you sure you want to delete this gallery?')) {
      return;
    }

    try {
      await this.api.delete<any>(`blog/galleries/${id}`).toPromise();
      this.successMessage = 'Gallery deleted successfully!';
      this.loadGalleries();
      setTimeout(() => this.successMessage = '', 3000);
    } catch (err: any) {
      this.error = err?.error?.message || 'Failed to delete gallery';
    }
  }

  async togglePublish(gallery: BlogGallery, publish: boolean): Promise<void> {
    if (!gallery.id) return;

    try {
      const endpoint = publish ? `blog/galleries/${gallery.id}/publish` : `blog/galleries/${gallery.id}/unpublish`;
      await this.api.put<any>(endpoint, {}).toPromise();
      const action = publish ? 'published' : 'unpublished';
      this.successMessage = `Gallery ${action} successfully!`;
      this.loadGalleries();
      setTimeout(() => this.successMessage = '', 3000);
    } catch (err: any) {
      this.error = err?.error?.message || 'Failed to update publish status';
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadGalleries();
    }
  }

  getMainImage(gallery: BlogGallery): string {
    const images = gallery.images || [];
    const index = gallery.mainImageIndex || 0;
    const imageUrl = images[index]?.imageUrl;
    console.log('[MANAGER] getMainImage called:', {
      galleryId: gallery.id,
      imageUrl,
      index,
      totalImages: images.length
    });
    const result = this.getAbsoluteImageUrl(imageUrl);
    console.log('[MANAGER] getMainImage result:', result);
    return result;
  }

  getImageCount(gallery: BlogGallery): number {
    return (gallery.images || []).length;
  }

  getAbsoluteImageUrl(imageUrl: string | undefined): string {
    console.log('[MANAGER] getAbsoluteImageUrl input:', imageUrl);
    if (!imageUrl) {
      console.log('[MANAGER] No imageUrl, returning placeholder');
      return 'https://via.placeholder.com/300x200?text=No+Image';
    }
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      console.log('[MANAGER] Already absolute URL:', imageUrl);
      return imageUrl;
    }
    if (imageUrl.startsWith('/uploads/')) {
      const result = environment.baseUrl + imageUrl;
      console.log('[MANAGER] Converted upload URL:', imageUrl, '->', result);
      return result;
    }
    const result = environment.apiUrl + imageUrl;
    console.log('[MANAGER] Converted relative URL:', imageUrl, '->', result);
    return result;
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

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        this.detectTheme();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    this.subscriptions.add(() => {
      observer.disconnect();
      window.removeEventListener('storage', handleStorageChange);
    });
  }
}
