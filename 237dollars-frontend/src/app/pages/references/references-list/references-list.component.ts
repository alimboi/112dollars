import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReferencesService, Major } from '../../../core/services/references.service';

@Component({
  selector: 'app-references-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './references-list.component.html',
  styleUrls: ['./references-list.component.scss']
})
export class ReferencesListComponent implements OnInit {
  majors: Major[] = [];
  loading = true;
  error = '';

  constructor(private referencesService: ReferencesService) {}

  ngOnInit(): void {
    this.loadMajors();
  }

  loadMajors(): void {
    this.referencesService.getAllMajors().subscribe({
      next: (majors) => {
        this.majors = majors;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load majors';
        this.loading = false;
      }
    });
  }

  getMajorIcon(name: string): string {
    const icons: Record<string, string> = {
      'Korean': 'bi bi-translate',
      'English': 'bi bi-book',
      'Coding': 'bi bi-code-slash'
    };
    return icons[name] || 'bi bi-star';
  }
}
