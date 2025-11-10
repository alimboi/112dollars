import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { ReferencesService, Reference, Topic, Major } from '../../../core/services/references.service';

type NavigationLevel = 'topics' | 'contents';

@Component({
  selector: 'app-references-by-topic',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './references-by-topic.component.html',
  styleUrls: ['./references-by-topic.component.scss']
})
export class ReferencesByTopicComponent implements OnInit, OnDestroy {
  // Navigation state
  navigationLevel: NavigationLevel = 'topics';

  // Data
  topics: Topic[] = [];
  contents: Reference[] = [];
  selectedTopic: Topic | null = null;
  selectedContent: Reference | null = null;

  // UI state
  loading = true;
  error = '';
  sidebarOpen = false;

  private subscriptions = new Subscription();
  private majorId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private referencesService: ReferencesService
  ) {}

  ngOnInit(): void {
    const sub = this.route.params.subscribe(params => {
      this.majorId = +params['id'];
      this.loadTopics();
    });
    this.subscriptions.add(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // LEVEL 1: Load main topics
  loadTopics(): void {
    this.loading = true;
    this.navigationLevel = 'topics';
    this.selectedTopic = null;
    this.selectedContent = null;
    this.contents = [];

    const sub = this.referencesService.getTopicsByMajor(this.majorId).subscribe({
      next: (topics) => {
        this.topics = topics;
        this.loading = false;
        if (topics.length === 0) {
          this.error = 'No topics available for this major';
        }
      },
      error: (err) => {
        this.error = 'Failed to load topics';
        this.loading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  // LEVEL 2: Select topic and load its contents
  selectTopic(topic: Topic): void {
    this.selectedTopic = topic;
    this.selectedContent = null;
    this.navigationLevel = 'contents';
    this.sidebarOpen = false; // Close mobile sidebar
    this.loadContents(topic.id);
  }

  loadContents(topicId: number): void {
    this.loading = true;
    const sub = this.referencesService.getReferencesByTopic(topicId).subscribe({
      next: (contents) => {
        this.contents = contents;
        // Auto-select first content
        if (contents.length > 0) {
          this.selectContent(contents[0]);
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load contents';
        this.loading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  // LEVEL 3: Select content to view details
  selectContent(content: Reference): void {
    this.selectedContent = content;
    this.sidebarOpen = false;
  }

  // NAVIGATION: Go back to topics
  goBackToTopics(): void {
    this.loadTopics();
  }

  // SIDEBAR CONTROLS
  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  getEstimatedReadTime(reference: Reference): string {
    if (reference.readingTimeMinutes) {
      return `${reference.readingTimeMinutes} min read`;
    }
    return '';
  }
}
