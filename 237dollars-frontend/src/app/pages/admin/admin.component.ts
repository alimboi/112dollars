import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { BlogGalleryManagerComponent } from './blog-gallery-manager/blog-gallery-manager.component';
import { environment } from '../../../environments/environment';

interface Reference {
  id: number;
  title: string;
  description: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  topic?: {
    id: number;
    name: string;
    major?: {
      id: number;
      name: string;
    };
  };
  creator?: {
    id: number;
    email: string;
  };
}

interface Major {
  id: number;
  name: string;
}

interface Topic {
  id: number;
  name: string;
  majorId: number;
}

interface ReferenceResponse {
  references: Reference[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, BlogGalleryManagerComponent],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  // Tab navigation
  activeTab: 'references' | 'blog' = 'references';

  // References data
  references: Reference[] = [];
  galleries: any[] = [];
  loading = false;
  error: string | null = null;

  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalReferences = 0;
  limit = 20;

  // Filters
  publishedFilter: 'all' | 'published' | 'unpublished' = 'all';
  majorFilter: number | 'all' = 'all';
  topicFilter: number | 'all' = 'all';

  // Filter data
  majors: Major[] = [];
  topics: Topic[] = [];
  filteredTopics: Topic[] = [];

  // Drag and drop for galleries
  draggedGalleryIndex: number | null = null;
  dragOverGalleryIndex: number | null = null;

  // Drag and drop for references
  draggedReferenceIndex: number | null = null;
  dragOverReferenceIndex: number | null = null;

  constructor(
    private api: ApiService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadMajors();
    this.loadTopics();
    this.loadReferences();
    this.loadGalleries();
  }

  loadMajors(): void {
    this.api.get<Major[]>('references/majors').subscribe({
      next: (majors) => {
        this.majors = majors;
      },
      error: (err) => {
        console.error('Error loading majors:', err);
      }
    });
  }

  loadTopics(): void {
    // Load all topics by fetching from all majors
    this.api.get<Major[]>('references/majors').subscribe({
      next: (majors) => {
        // Fetch topics for each major
        const topicRequests = majors.map(major =>
          this.api.get<Topic[]>(`references/majors/${major.id}/topics`)
        );

        // Wait for all topic requests to complete
        Promise.all(topicRequests.map(req => req.toPromise()))
          .then(topicArrays => {
            this.topics = topicArrays.flat().filter(t => t != null) as Topic[];
            this.filteredTopics = this.topics;
          })
          .catch(err => {
            console.error('Error loading topics:', err);
          });
      },
      error: (err) => {
        console.error('Error loading majors for topics:', err);
      }
    });
  }

  onMajorFilterChange(): void {
    // Filter topics based on selected major
    if (this.majorFilter === 'all') {
      this.filteredTopics = this.topics;
    } else {
      this.filteredTopics = this.topics.filter(t => t.majorId === this.majorFilter);
    }

    // Reset topic filter if current topic doesn't belong to selected major
    if (this.topicFilter !== 'all') {
      const topicExists = this.filteredTopics.some(t => t.id === this.topicFilter);
      if (!topicExists) {
        this.topicFilter = 'all';
      }
    }

    this.currentPage = 1;
    this.loadReferences();
  }

  loadGalleries(): void {
    this.api.get<any>('blog/galleries?page=1&limit=100').subscribe({
      next: (response) => {
        this.galleries = response.galleries || [];
      },
      error: (err) => {
        console.error('Error loading galleries:', err);
      }
    });
  }

  loadReferences(): void {
    this.loading = true;
    this.error = null;

    let queryParams = `page=${this.currentPage}&limit=${this.limit}`;
    if (this.publishedFilter !== 'all') {
      queryParams += `&published=${this.publishedFilter === 'published'}`;
    }
    if (this.majorFilter !== 'all') {
      queryParams += `&majorId=${this.majorFilter}`;
    }
    if (this.topicFilter !== 'all') {
      queryParams += `&topicId=${this.topicFilter}`;
    }

    this.api.get<ReferenceResponse>(`references/admin/all?${queryParams}`).subscribe({
      next: (response) => {
        this.references = response.references;
        this.totalPages = response.totalPages;
        this.totalReferences = response.total;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading references:', err);
        this.error = err?.error?.message || err?.message || 'Failed to load references';
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadReferences();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadReferences();
    }
  }

  togglePublish(reference: Reference): void {
    const endpoint = reference.isPublished ? 'unpublish' : 'publish';
    const action = reference.isPublished ? 'unpublishing' : 'publishing';

    if (!confirm(`Are you sure you want to ${action === 'unpublishing' ? 'unpublish' : 'publish'} "${reference.title}"?`)) {
      return;
    }

    this.api.put(`references/${reference.id}/${endpoint}`, {}).subscribe({
      next: () => {
        reference.isPublished = !reference.isPublished;
      },
      error: (err) => {
        console.error(`Error ${action} reference:`, err);
        alert(`Failed to ${action === 'unpublishing' ? 'unpublish' : 'publish'} reference: ${err.error?.message || 'Unknown error'}`);
      }
    });
  }

  deleteReference(reference: Reference): void {
    if (!confirm(`Are you sure you want to delete "${reference.title}"? This action cannot be undone.`)) {
      return;
    }

    this.api.delete(`references/${reference.id}`).subscribe({
      next: () => {
        this.loadReferences();
      },
      error: (err) => {
        console.error('Error deleting reference:', err);
        alert(`Failed to delete reference: ${err.error?.message || 'Unknown error'}`);
      }
    });
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;

    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  switchTab(tab: 'references' | 'blog'): void {
    this.activeTab = tab;
  }

  getMainGalleryImage(gallery: any): string {
    if (!gallery.images || gallery.images.length === 0) {
      return 'https://via.placeholder.com/300x200?text=No+Image';
    }
    const mainIndex = gallery.mainImageIndex || 0;
    const imageUrl = gallery.images[mainIndex]?.imageUrl;

    if (!imageUrl) {
      return 'https://via.placeholder.com/300x200?text=No+Image';
    }

    // If already absolute URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    // For uploads, prepend backend base URL
    if (imageUrl.startsWith('/uploads/')) {
      return environment.baseUrl + imageUrl;
    }

    return environment.apiUrl + imageUrl;
  }

  getGalleryImageCount(gallery: any): number {
    return gallery.images?.length || 0;
  }

  deleteGallery(id: number): void {
    if (!confirm('Delete this gallery permanently? This action cannot be undone.')) {
      return;
    }

    this.api.delete(`blog/galleries/${id}`).subscribe({
      next: () => {
        this.galleries = this.galleries.filter(g => g.id !== id);
      },
      error: (err) => {
        alert(`Failed to delete gallery: ${err.error?.message || 'Unknown error'}`);
      }
    });
  }

  // Gallery drag and drop handlers
  onGalleryDragStart(event: DragEvent, index: number): void {
    this.draggedGalleryIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onGalleryDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    this.dragOverGalleryIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onGalleryDragLeave(event: DragEvent): void {
    this.dragOverGalleryIndex = null;
  }

  onGalleryDrop(event: DragEvent, dropIndex: number): void {
    event.preventDefault();

    if (this.draggedGalleryIndex === null || this.draggedGalleryIndex === dropIndex) {
      this.draggedGalleryIndex = null;
      this.dragOverGalleryIndex = null;
      return;
    }

    // Reorder galleries array
    const draggedGallery = this.galleries[this.draggedGalleryIndex];
    this.galleries.splice(this.draggedGalleryIndex, 1);
    this.galleries.splice(dropIndex, 0, draggedGallery);

    // Save new order to backend
    const orderData = {
      galleries: this.galleries.map((g, index) => ({
        id: g.id,
        order: index
      }))
    };

    this.api.put('blog/galleries/reorder', orderData).subscribe({
      next: () => {
        console.log('Gallery order saved successfully');
      },
      error: (err) => {
        console.error('Failed to save gallery order:', err);
        alert('Failed to save gallery order');
      }
    });

    this.draggedGalleryIndex = null;
    this.dragOverGalleryIndex = null;
  }

  onGalleryDragEnd(): void {
    this.draggedGalleryIndex = null;
    this.dragOverGalleryIndex = null;
  }

  // Reference drag and drop handlers
  onReferenceDragStart(event: DragEvent, index: number): void {
    this.draggedReferenceIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onReferenceDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    this.dragOverReferenceIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onReferenceDragLeave(event: DragEvent): void {
    this.dragOverReferenceIndex = null;
  }

  onReferenceDrop(event: DragEvent, dropIndex: number): void {
    event.preventDefault();

    if (this.draggedReferenceIndex === null || this.draggedReferenceIndex === dropIndex) {
      this.draggedReferenceIndex = null;
      this.dragOverReferenceIndex = null;
      return;
    }

    // Reorder references array
    const draggedReference = this.references[this.draggedReferenceIndex];
    this.references.splice(this.draggedReferenceIndex, 1);
    this.references.splice(dropIndex, 0, draggedReference);

    // Save new order to backend
    const orderData = {
      references: this.references.map((r, index) => ({
        id: r.id,
        order: index
      }))
    };

    this.api.put('references/reorder', orderData).subscribe({
      next: () => {
        console.log('Reference order saved successfully');
      },
      error: (err) => {
        console.error('Failed to save reference order:', err);
        alert('Failed to save reference order');
      }
    });

    this.draggedReferenceIndex = null;
    this.dragOverReferenceIndex = null;
  }

  onReferenceDragEnd(): void {
    this.draggedReferenceIndex = null;
    this.dragOverReferenceIndex = null;
  }
}
