import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { StorageService } from '../../core/services/storage.service';

interface DashboardStats {
  points: {
    total: number;
    reading: number;
    quiz: number;
  };
  enrollments: {
    total: number;
    pending: number;
    approved: number;
  };
  documents: {
    total: number;
    recent: Array<{
      id: number;
      fileName: string;
      uploadedAt: string;
    }>;
  };
  discounts: {
    available: number;
    used: number;
    recentCode?: string;
    recentPercentage?: number;
  };
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  userName = '';
  stats: DashboardStats = {
    points: { total: 0, reading: 0, quiz: 0 },
    enrollments: { total: 0, pending: 0, approved: 0 },
    documents: { total: 0, recent: [] },
    discounts: { available: 0, used: 0 },
    recentActivity: []
  };
  loading = true;
  error = '';

  constructor(
    private api: ApiService,
    private storage: StorageService
  ) {}

  ngOnInit(): void {
    this.loadUserName();
    this.loadDashboardData();
  }

  loadUserName(): void {
    const user = this.storage.getItem<any>('user');
    this.userName = user?.name || 'Student';
  }

  loadDashboardData(): void {
    // Load points
    this.api.get<any>('points/my-total').subscribe({
      next: (data) => {
        this.stats.points = {
          total: data.totalPoints || 0,
          reading: data.readingPoints || 0,
          quiz: data.quizPoints || 0
        };
      },
      error: () => console.error('Failed to load points')
    });

    // Load enrollments
    this.api.get<any[]>('enrollments/my-enrollments').subscribe({
      next: (enrollments) => {
        this.stats.enrollments = {
          total: enrollments.length,
          pending: enrollments.filter(e => e.status === 'pending').length,
          approved: enrollments.filter(e => e.status === 'approved').length
        };
      },
      error: () => console.error('Failed to load enrollments')
    });

    // Load documents
    this.api.get<any[]>('students/documents').subscribe({
      next: (docs) => {
        this.stats.documents = {
          total: docs.length,
          recent: docs.slice(0, 3).map(d => ({
            id: d.id,
            fileName: d.fileName,
            uploadedAt: d.uploadedAt
          }))
        };
      },
      error: () => console.error('Failed to load documents')
    });

    // Load discounts
    this.api.get<any[]>('discounts/my-discounts').subscribe({
      next: (discounts) => {
        const available = discounts.filter(d => d.status === 'approved' && d.usedAt === null);
        const used = discounts.filter(d => d.usedAt !== null);
        const recent = available[0];

        this.stats.discounts = {
          available: available.length,
          used: used.length,
          recentCode: recent?.code,
          recentPercentage: recent?.percentage
        };
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        console.error('Failed to load discounts');
      }
    });
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'dashboard.goodMorning';
    if (hour < 18) return 'dashboard.goodAfternoon';
    return 'dashboard.goodEvening';
  }

  getProgressPercentage(current: number, target: number): number {
    return target > 0 ? Math.min((current / target) * 100, 100) : 0;
  }

  getEnrollmentStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'approved': return 'badge bg-success';
      case 'rejected': return 'badge bg-danger';
      case 'pending':
      default: return 'badge bg-warning';
    }
  }
}
