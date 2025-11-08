import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ReferencesService, Reference } from '../../../core/services/references.service';

@Component({
  selector: 'app-reference-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './reference-detail.component.html',
  styleUrls: ['./reference-detail.component.scss']
})
export class ReferenceDetailComponent implements OnInit {
  reference: Reference | null = null;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private referencesService: ReferencesService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      this.loadReference(id);
    });
  }

  loadReference(id: number): void {
    this.referencesService.getReference(id).subscribe({
      next: (reference) => {
        this.reference = reference;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load reference';
        this.loading = false;
      }
    });
  }
}
