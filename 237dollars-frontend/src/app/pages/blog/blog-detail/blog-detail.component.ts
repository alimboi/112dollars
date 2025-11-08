import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { BlogService, BlogPost } from '../../../core/services/blog.service';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './blog-detail.component.html',
  styleUrls: ['./blog-detail.component.scss']
})
export class BlogDetailComponent implements OnInit, OnDestroy {
  post: BlogPost | null = null;
  sanitizedContent: SafeHtml = '';
  loading = true;
  error = '';
  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private blogService: BlogService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const sub = this.route.params.subscribe(params => {
      const id = +params['id'];
      this.loadPost(id);
    });
    this.subscriptions.add(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadPost(id: number): void {
    const sub = this.blogService.getPost(id).subscribe({
      next: (post) => {
        this.post = post;
        // Sanitize HTML content to prevent XSS attacks
        this.sanitizedContent = this.sanitizer.sanitize(1, post.content) || '';
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load blog post';
        this.loading = false;
      }
    });
    this.subscriptions.add(sub);
  }
}
