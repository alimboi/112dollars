import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

interface BlogImage {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  isPublished: boolean;
  createdAt: Date;
  creator?: { id: number; email: string };
}

@Component({
  selector: 'app-blog-gallery',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './blog-gallery.component.html',
  styleUrls: ['./blog-gallery.component.scss']
})
export class BlogGalleryComponent implements OnInit, OnDestroy {
  blogImages: BlogImage[] = [];
  selectedImage: BlogImage | null = null;
  isModalOpen = false;
  loading = true;
  error = '';
  currentPage = 1;
  pageSize = 12;
  totalPages = 1;
  currentTheme: 'light' | 'dark' = 'light';

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
    const sub = this.api.get<any>(`blog/images?page=${this.currentPage}&limit=${this.pageSize}&published=true`)
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

  openModal(image: BlogImage): void {
    this.selectedImage = image;
    this.isModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedImage = null;
    document.body.style.overflow = 'auto';
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadBlogImages();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getTruncatedDescription(description: string, maxLength: number = 100): string {
    if (description.length <= maxLength) {
      return description;
    }
    return description.substring(0, maxLength) + '...';
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
