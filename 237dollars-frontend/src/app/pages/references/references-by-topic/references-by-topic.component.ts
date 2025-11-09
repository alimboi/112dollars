import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ReferencesService, Reference, Topic } from '../../../core/services/references.service';

@Component({
  selector: 'app-references-by-topic',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './references-by-topic.component.html',
  styleUrls: ['./references-by-topic.component.scss']
})
export class ReferencesByTopicComponent implements OnInit {
  references: Reference[] = [];
  topic: Topic | null = null;
  topicId: number = 0;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private referencesService: ReferencesService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.topicId = +params['id'];
      this.loadReferences();
    });
  }

  loadReferences(): void {
    this.referencesService.getReferencesByTopic(this.topicId).subscribe({
      next: (references) => {
        this.references = references;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load references';
        this.loading = false;
      }
    });
  }

  getEstimatedReadTime(reference: Reference): string {
    if (reference.readingTimeMinutes) {
      return `${reference.readingTimeMinutes} min read`;
    }
    return '';
  }
}
