import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BlogService, BlogPost } from '../../../core/services/blog.service';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './blog-list.component.html',
  styleUrls: ['./blog-list.component.scss']
})
export class BlogListComponent implements OnInit {
  posts: BlogPost[] = [];
  total = 0;
  page = 1;
  limit = 9;
  loading = true;
  error = '';
  Math = Math;

  constructor(private blogService: BlogService) {}

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.blogService.getAllPosts(this.page, this.limit).subscribe({
      next: (data) => {
        this.posts = data.posts;
        this.total = data.total;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load blog posts';
        this.loading = false;
      }
    });
  }

  nextPage(): void {
    if (this.page * this.limit < this.total) {
      this.page++;
      this.loading = true;
      this.loadPosts();
    }
  }

  previousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loading = true;
      this.loadPosts();
    }
  }
}
