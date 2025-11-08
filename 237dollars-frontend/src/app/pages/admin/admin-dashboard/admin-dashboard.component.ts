import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('usersChart') usersChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('enrollmentsChart') enrollmentsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('contentChart') contentChartRef!: ElementRef<HTMLCanvasElement>;

  stats: any = null;
  loading = true;
  error = '';
  chartsInitialized = false;

  private usersChart?: Chart;
  private enrollmentsChart?: Chart;
  private contentChart?: Chart;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data is loaded
  }

  loadDashboard(): void {
    this.api.get('analytics/dashboard').subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
        // Initialize charts after data is loaded
        setTimeout(() => this.initializeCharts(), 100);
      },
      error: (err) => {
        this.error = 'Failed to load dashboard';
        this.loading = false;
      }
    });
  }

  private initializeCharts(): void {
    if (this.chartsInitialized || !this.stats) return;

    this.createUsersChart();
    this.createEnrollmentsChart();
    this.createContentChart();

    this.chartsInitialized = true;
  }

  private createUsersChart(): void {
    const ctx = this.usersChartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: ['Active Users', 'Inactive Users'],
        datasets: [{
          data: [
            this.stats?.users?.active || 0,
            (this.stats?.users?.total || 0) - (this.stats?.users?.active || 0)
          ],
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',
            'rgba(233, 69, 96, 0.8)'
          ],
          borderColor: [
            'rgba(16, 185, 129, 1)',
            'rgba(233, 69, 96, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#eaeaea',
              padding: 15,
              font: { size: 12 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(26, 26, 46, 0.95)',
            titleColor: '#eaeaea',
            bodyColor: '#94a1b2',
            borderColor: '#e94560',
            borderWidth: 1,
            padding: 12,
            displayColors: true
          }
        }
      }
    };

    this.usersChart = new Chart(ctx, config);
  }

  private createEnrollmentsChart(): void {
    const ctx = this.enrollmentsChartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: ['Pending', 'Approved', 'Rejected'],
        datasets: [{
          label: 'Enrollments',
          data: [
            this.stats?.enrollments?.pending || 0,
            this.stats?.enrollments?.approved || 0,
            this.stats?.enrollments?.rejected || 0
          ],
          backgroundColor: [
            'rgba(245, 158, 11, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(233, 69, 96, 0.8)'
          ],
          borderColor: [
            'rgba(245, 158, 11, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(233, 69, 96, 1)'
          ],
          borderWidth: 2,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(26, 26, 46, 0.95)',
            titleColor: '#eaeaea',
            bodyColor: '#94a1b2',
            borderColor: '#e94560',
            borderWidth: 1,
            padding: 12
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#94a1b2',
              font: { size: 11 }
            },
            grid: {
              color: 'rgba(148, 161, 178, 0.1)'
            }
          },
          x: {
            ticks: {
              color: '#94a1b2',
              font: { size: 11 }
            },
            grid: {
              display: false
            }
          }
        }
      }
    };

    this.enrollmentsChart = new Chart(ctx, config);
  }

  private createContentChart(): void {
    const ctx = this.contentChartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: ['References', 'Topics', 'Quizzes', 'Blog Posts'],
        datasets: [{
          label: 'Content Items',
          data: [
            this.stats?.content?.totalReferences || 0,
            this.stats?.content?.totalTopics || 0,
            this.stats?.content?.totalQuizzes || 0,
            this.stats?.content?.totalBlogPosts || 0
          ],
          fill: true,
          backgroundColor: 'rgba(233, 69, 96, 0.2)',
          borderColor: 'rgba(233, 69, 96, 1)',
          borderWidth: 3,
          tension: 0.4,
          pointBackgroundColor: '#e94560',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(26, 26, 46, 0.95)',
            titleColor: '#eaeaea',
            bodyColor: '#94a1b2',
            borderColor: '#e94560',
            borderWidth: 1,
            padding: 12
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#94a1b2',
              font: { size: 11 }
            },
            grid: {
              color: 'rgba(148, 161, 178, 0.1)'
            }
          },
          x: {
            ticks: {
              color: '#94a1b2',
              font: { size: 11 }
            },
            grid: {
              display: false
            }
          }
        }
      }
    };

    this.contentChart = new Chart(ctx, config);
  }

  ngOnDestroy(): void {
    this.usersChart?.destroy();
    this.enrollmentsChart?.destroy();
    this.contentChart?.destroy();
  }
}
