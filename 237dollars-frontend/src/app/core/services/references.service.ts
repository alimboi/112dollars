import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Major {
  id: number;
  name: string;
  description: string;
  displayOrder: number;
}

export interface Topic {
  id: number;
  majorId: number;
  name: string;
  description: string;
  displayOrder: number;
}

export interface Reference {
  id: number;
  topicId: number;
  title: string;
  description: string;
  content: string;
  isFree: boolean;
  totalWords: number;
  readingTimeMinutes: number;
  contentBlocks?: ContentBlock[];
}

export interface ContentBlock {
  id: number;
  referenceId: number;
  type: 'text' | 'image' | 'video' | 'code';
  content: string;
  displayOrder: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReferencesService {
  constructor(private api: ApiService) {}

  getAllMajors(): Observable<Major[]> {
    return this.api.get<Major[]>('references/majors');
  }

  getTopicsByMajor(majorId: number): Observable<Topic[]> {
    return this.api.get<Topic[]>(`references/majors/${majorId}/topics`);
  }

  getReferencesByTopic(topicId: number): Observable<Reference[]> {
    return this.api.get<Reference[]>(`references/topics/${topicId}`);
  }

  getReference(id: number): Observable<Reference> {
    return this.api.get<Reference>(`references/${id}`);
  }

  createReference(data: Partial<Reference>): Observable<Reference> {
    return this.api.post<Reference>('references', data);
  }

  updateReference(id: number, data: Partial<Reference>): Observable<Reference> {
    return this.api.put<Reference>(`references/${id}`, data);
  }

  deleteReference(id: number): Observable<void> {
    return this.api.delete<void>(`references/${id}`);
  }
}
