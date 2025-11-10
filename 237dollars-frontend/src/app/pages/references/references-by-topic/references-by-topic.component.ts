import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { ReferencesService, Reference, Topic, Major } from '../../../core/services/references.service';

@Component({
  selector: 'app-references-by-topic',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './references-by-topic.component.html',
  styleUrls: ['./references-by-topic.component.scss']
})
export class ReferencesByTopicComponent implements OnInit, OnDestroy {
  references: Reference[] = [];
  topics: Topic[] = [];
  selectedTopic: Topic | null = null;
  selectedMajor: Major | null = null;
  loading = true;
  loadingReferences = false;
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
      this.loadTopicsAndInitialize();
    });
    this.subscriptions.add(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadTopicsAndInitialize(): void {
    this.loading = true;
    const sub = this.referencesService.getTopicsByMajor(this.majorId).subscribe({
      next: (topics) => {
        this.topics = topics;
        if (topics.length > 0) {
          // Select first topic by default
          this.selectTopic(topics[0]);
        } else {
          this.loading = false;
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

  selectTopic(topic: Topic): void {
    this.selectedTopic = topic;
    this.sidebarOpen = false; // Close sidebar on mobile after selection
    this.loadReferences(topic.id);
  }

  loadReferences(topicId: number): void {
    this.loadingReferences = true;
    const sub = this.referencesService.getReferencesByTopic(topicId).subscribe({
      next: (references) => {
        this.references = references;
        this.loadingReferences = false;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load references';
        this.loadingReferences = false;
        this.loading = false;
      }
    });
    this.subscriptions.add(sub);
  }

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
