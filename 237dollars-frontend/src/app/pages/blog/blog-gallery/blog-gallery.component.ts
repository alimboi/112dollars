import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';
import { ApiService } from '../../../core/services/api.service';

interface BlogGalleryImage {
  id: number;
  galleryId: number;
  imageUrl: string;
  order: number;
}

interface BlogGallery {
  id: number;
  title: string;
  description: string;
  mainImageIndex: number;
  images: BlogGalleryImage[];
  isPublished: boolean;
  createdAt: Date;
  creator?: { id: number; email: string };
}

@Component({
  selector: 'app-blog-gallery',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './blog-gallery.component.html',
  styleUrls: ['./blog-gallery.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 })),
      ]),
    ]),
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(1rem)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 })),
      ]),
    ]),
  ],
})
export class BlogGalleryComponent implements OnInit, OnDestroy {
  galleries: BlogGallery[] = [];
  selectedGallery: BlogGallery | null = null;
  currentImageIndex = 0;
  isModalOpen = false;
  loading = true;
  error = '';
  currentPage = 1;
  pageSize = 12;
  totalPages = 1;
  currentTheme: 'light' | 'dark' = 'light';

  private subscriptions = new Subscription();
  private hoverTimeout: any = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.detectTheme();
    this.listenForThemeChanges();
    this.loadGalleries();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
  }

  loadGalleries(): void {
    this.loading = true;
    const sub = this.api
      .get<any>(
        `blog/galleries?page=${this.currentPage}&limit=${this.pageSize}&published=true`,
      )
      .subscribe({
        next: (response) => {
          this.galleries = response.galleries || [];
          this.totalPages = response.totalPages || 1;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading galleries:', err);
          this.error = 'Failed to load galleries';
          this.loading = false;
        },
      });
    this.subscriptions.add(sub);
  }

  openGalleryModal(gallery: BlogGallery): void {
    this.selectedGallery = gallery;
    this.currentImageIndex = gallery.mainImageIndex || 0;
    this.isModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedGallery = null;
    this.currentImageIndex = 0;
    document.body.style.overflow = 'auto';
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
  }

  nextImage(): void {
    if (this.selectedGallery && this.selectedGallery.images.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.selectedGallery.images.length;
    }
  }

  previousImage(): void {
    if (this.selectedGallery && this.selectedGallery.images.length > 0) {
      this.currentImageIndex =
        (this.currentImageIndex - 1 + this.selectedGallery.images.length) %
        this.selectedGallery.images.length;
    }
  }

  goToImage(index: number): void {
    if (this.selectedGallery && index >= 0 && index < this.selectedGallery.images.length) {
      this.currentImageIndex = index;
    }
  }

  onGalleryHover(gallery: BlogGallery): void {
    if (!this.isModalOpen && gallery.images.length > 1) {
      if (this.hoverTimeout) {
        clearTimeout(this.hoverTimeout);
      }

      this.hoverTimeout = setInterval(() => {
        const currentIndex = this.galleries.indexOf(gallery);
        if (currentIndex !== -1) {
          const galleryInList = this.galleries[currentIndex];
          const mainIndex = galleryInList.mainImageIndex || 0;
          galleryInList.mainImageIndex = (mainIndex + 1) % gallery.images.length;
        }
      }, 2500); // Change image every 2.5 seconds on hover
    }
  }

  onGalleryLeave(gallery: BlogGallery): void {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
    // Reset to main image
    gallery.mainImageIndex = 0;
  }

  getCurrentImage(gallery: BlogGallery): BlogGalleryImage | null {
    if (gallery.images && gallery.images.length > 0) {
      const index = this.isModalOpen ? this.currentImageIndex : (gallery.mainImageIndex || 0);
      return gallery.images[index] || null;
    }
    return null;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadGalleries();
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
      attributeFilter: ['data-theme'],
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
