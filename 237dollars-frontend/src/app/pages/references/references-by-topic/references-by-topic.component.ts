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
  topic: Topic | null = null;
  contents: Reference[] = [];
  selectedContent: Reference | null = null;

  // UI state
  loading = true;
  error = '';
  sidebarOpen = false;

  private subscriptions = new Subscription();
  private topicId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private referencesService: ReferencesService
  ) {}

  ngOnInit(): void {
    const sub = this.route.params.subscribe(params => {
      this.topicId = +params['id'];
      this.loadTopic();
    });
    this.subscriptions.add(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Load topic details and its contents
  loadTopic(): void {
    this.loading = true;
    this.navigationLevel = 'contents';
    this.selectedContent = null;
    this.contents = [];

    // Note: We load contents directly since we already have the topic ID from the URL
    const sub = this.referencesService.getReferencesByTopic(this.topicId).subscribe({
      next: (contents) => {
        this.contents = contents;
        this.loading = false;

        // Auto-select first content
        if (contents.length > 0) {
          this.selectContent(contents[0]);
        } else {
          this.error = 'No contents available for this topic';
        }
      },
      error: (err) => {
        this.error = 'Failed to load contents';
        this.loading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  // Select content to view details
  selectContent(content: Reference): void {
    this.selectedContent = content;
    this.sidebarOpen = false;
  }

  // NAVIGATION: Go back to topics
  goBackToTopics(): void {
    this.route.params.subscribe(params => {
      const majorId = params['majorId'];
      if (majorId) {
        // If majorId is available in the route, navigate back to topics list
        // This requires the route to be updated to include majorId
        window.history.back();
      } else {
        // Fallback to browser back
        window.history.back();
      }
    });
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
