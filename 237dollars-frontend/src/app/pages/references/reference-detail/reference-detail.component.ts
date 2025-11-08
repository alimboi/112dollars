import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { ReferencesService, Reference } from '../../../core/services/references.service';

@Component({
  selector: 'app-reference-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './reference-detail.component.html',
  styleUrls: ['./reference-detail.component.scss']
})
export class ReferenceDetailComponent implements OnInit, OnDestroy {
  reference: Reference | null = null;
  loading = true;
  error = '';
  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private referencesService: ReferencesService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const sub = this.route.params.subscribe(params => {
      const id = +params['id'];
      this.loadReference(id);
    });
    this.subscriptions.add(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadReference(id: number): void {
    const sub = this.referencesService.getReference(id).subscribe({
      next: (reference) => {
        this.reference = reference;
        this.sanitizeContentBlocks();
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load reference';
        this.loading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  private sanitizeContentBlocks(): void {
    if (this.reference?.contentBlocks) {
      this.reference.contentBlocks = this.reference.contentBlocks.map(block => ({
        ...block,
        content: block.type === 'text'
          ? (this.sanitizer.sanitize(1, block.content) || '')
          : block.content
      }));
    }
  }

  getSafeContent(content: string): SafeHtml {
    return this.sanitizer.sanitize(1, content) || '';
  }
}
