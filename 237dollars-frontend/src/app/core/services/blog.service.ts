import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface BlogPost {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  authorId: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  constructor(private api: ApiService) {}

  getAllPosts(page: number = 1, limit: number = 10, published?: boolean): Observable<{ posts: BlogPost[], total: number }> {
    const params: any = { page, limit };
    if (published !== undefined) {
      params.published = published;
    }
    return this.api.get<{ posts: BlogPost[], total: number }>('blog/posts', params);
  }

  getPost(id: number): Observable<BlogPost> {
    return this.api.get<BlogPost>(`blog/posts/${id}`);
  }

  createPost(data: Partial<BlogPost>): Observable<BlogPost> {
    return this.api.post<BlogPost>('blog/posts', data);
  }

  updatePost(id: number, data: Partial<BlogPost>): Observable<BlogPost> {
    return this.api.put<BlogPost>(`blog/posts/${id}`, data);
  }

  deletePost(id: number): Observable<void> {
    return this.api.delete<void>(`blog/posts/${id}`);
  }
}
