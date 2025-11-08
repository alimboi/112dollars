import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ReferencesService, Topic } from '../../../core/services/references.service';

@Component({
  selector: 'app-topics-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './topics-list.component.html',
  styleUrls: ['./topics-list.component.scss']
})
export class TopicsListComponent implements OnInit {
  topics: Topic[] = [];
  majorId: number = 0;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private referencesService: ReferencesService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.majorId = +params['id'];
      this.loadTopics();
    });
  }

  loadTopics(): void {
    this.referencesService.getTopicsByMajor(this.majorId).subscribe({
      next: (topics) => {
        this.topics = topics;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load topics';
        this.loading = false;
      }
    });
  }
}
