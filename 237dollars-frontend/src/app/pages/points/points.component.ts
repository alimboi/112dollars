import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';

interface UserPoints {
  userId: number;
  userName?: string;
  topicId: number;
  topicName: string;
  readingPoints: number;
  quizPoints: number;
  totalPoints: number;
  topicsCompleted: number;
}

interface LeaderboardEntry {
  rank: number;
  userId: number;
  userName: string;
  totalPoints: number;
  quizPoints: number;
  readingPoints: number;
}

@Component({
  selector: 'app-points',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './points.component.html',
  styleUrls: ['./points.component.scss']
})
export class PointsComponent implements OnInit {
  myPoints: UserPoints[] = [];
  leaderboard: LeaderboardEntry[] = [];
  totalPoints = 0;
  totalReadingPoints = 0;
  totalQuizPoints = 0;
  myRank = 0;
  loading = true;
  error = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadMyPoints();
    this.loadLeaderboard();
  }

  loadMyPoints(): void {
    this.api.get<UserPoints[]>('points/my-points').subscribe({
      next: (points) => {
        this.myPoints = points;
        this.calculateTotals();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load your points';
        this.loading = false;
      }
    });
  }

  loadLeaderboard(): void {
    this.api.get<any>('points/leaderboard').subscribe({
      next: (data) => {
        this.leaderboard = data.leaderboard;
        this.myRank = data.userRank || 0;
      },
      error: (err) => {
        console.error('Failed to load leaderboard');
      }
    });
  }

  calculateTotals(): void {
    this.totalPoints = this.myPoints.reduce((sum, p) => sum + p.totalPoints, 0);
    this.totalReadingPoints = this.myPoints.reduce((sum, p) => sum + p.readingPoints, 0);
    this.totalQuizPoints = this.myPoints.reduce((sum, p) => sum + p.quizPoints, 0);
  }

  getRankBadgeClass(rank: number): string {
    if (rank === 1) return 'badge bg-gold';
    if (rank === 2) return 'badge bg-silver';
    if (rank === 3) return 'badge bg-bronze';
    return 'badge bg-secondary';
  }

  getRankIcon(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  }

  getProgressPercentage(points: number): number {
    const maxPoints = Math.max(...this.myPoints.map(p => p.totalPoints), 100);
    return (points / maxPoints) * 100;
  }
}
