import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';
import { ApiService } from '../../../core/services/api.service';

interface BlogImage {
  id?: number;
  title: string;
  description: string;
  imageUrl: string;
  isPublished: boolean;
  createdAt?: Date;
  creator?: { id: number; email: string };
}

@Component({
  selector: 'app-blog-image-manager',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule],
  templateUrl: './blog-image-manager.component.html',
  styleUrls: ['./blog-image-manager.component.scss'],
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
export class BlogImageManagerComponent implements OnInit, OnDestroy {
  blogImages: BlogImage[] = [];
  isFormOpen = false;
  isEditMode = false;
  editingId: number | null = null;
  loading = false;
  saving = false;
  error = '';
  successMessage = '';
  currentPage = 1;
  pageSize = 20;
  totalPages = 1;
  currentTheme: 'light' | 'dark' = 'light';

  formData: BlogImage = {
    title: '',
    description: '',
    imageUrl: '',
    isPublished: false
  };

  private subscriptions = new Subscription();

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.detectTheme();
    this.listenForThemeChanges();
    this.loadBlogImages();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadBlogImages(): void {
    this.loading = true;
    const sub = this.api.get<any>(`blog/images?page=${this.currentPage}&limit=${this.pageSize}`)
      .subscribe({
        next: (response) => {
          this.blogImages = response.images || [];
          this.totalPages = response.totalPages || 1;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading blog images:', err);
          this.error = 'Failed to load blog images';
          this.loading = false;
        }
      });
    this.subscriptions.add(sub);
  }

  openForm(image?: BlogImage): void {
    if (image) {
      this.isEditMode = true;
      this.editingId = image.id || null;
      this.formData = { ...image };
    } else {
      this.isEditMode = false;
      this.editingId = null;
      this.formData = {
        title: '',
        description: '',
        imageUrl: '',
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

  async saveImage(): Promise<void> {
    // Validation
    if (!this.formData.title.trim()) {
      this.error = 'Title is required';
      return;
    }
    if (!this.formData.description.trim()) {
      this.error = 'Description is required';
      return;
    }
    if (!this.formData.imageUrl.trim()) {
      this.error = 'Image URL is required';
      return;
    }

    this.saving = true;
    this.error = '';

    try {
      if (this.isEditMode && this.editingId) {
        // Update
        const response = await this.api.put<any>(`blog/images/${this.editingId}`, this.formData).toPromise();
        this.successMessage = 'Blog image updated successfully!';
      } else {
        // Create
        const response = await this.api.post<any>('blog/images', this.formData).toPromise();
        this.successMessage = 'Blog image created successfully!';
      }

      this.saving = false;
      this.closeForm();
      this.loadBlogImages();
      setTimeout(() => this.successMessage = '', 3000);
    } catch (err: any) {
      this.error = err?.error?.message || 'Failed to save blog image';
      this.saving = false;
    }
  }

  async deleteImage(id: number): Promise<void> {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      await this.api.delete<any>(`blog/images/${id}`).toPromise();
      this.successMessage = 'Blog image deleted successfully!';
      this.loadBlogImages();
      setTimeout(() => this.successMessage = '', 3000);
    } catch (err: any) {
      this.error = err?.error?.message || 'Failed to delete blog image';
    }
  }

  async togglePublish(image: BlogImage, publish: boolean): Promise<void> {
    if (!image.id) return;

    try {
      const endpoint = publish ? `blog/images/${image.id}/publish` : `blog/images/${image.id}/unpublish`;
      await this.api.put<any>(endpoint, {}).toPromise();
      const action = publish ? 'published' : 'unpublished';
      this.successMessage = `Blog image ${action} successfully!`;
      this.loadBlogImages();
      setTimeout(() => this.successMessage = '', 3000);
    } catch (err: any) {
      this.error = err?.error?.message || 'Failed to update publish status';
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadBlogImages();
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
