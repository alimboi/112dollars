import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { StorageService } from '../../../core/services/storage.service';

@Component({
  selector: 'app-google-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="callback-container">
      <div class="callback-card">
        <div *ngIf="!error" class="text-center">
          <div class="spinner-border text-accent" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-3">Completing sign-in...</p>
        </div>

        <div *ngIf="error" class="alert alert-danger">
          <h4>Authentication Failed</h4>
          <p>{{ error }}</p>
          <button class="btn btn-primary" routerLink="/auth/login">
            Back to Login
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .callback-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .callback-card {
      background-color: var(--bg-secondary);
      border-radius: 12px;
      padding: 40px;
      max-width: 450px;
      width: 100%;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      text-align: center;

      p {
        color: var(--text-secondary);
        margin: 0;
      }
    }

    .text-accent {
      color: var(--accent) !important;
    }
  `]
})
export class GoogleCallbackComponent implements OnInit {
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private storage: StorageService
  ) {}

  ngOnInit(): void {
    // Get tokens from URL query parameters
    this.route.queryParams.subscribe(params => {
      const accessToken = params['accessToken'];
      const refreshToken = params['refreshToken'];

      if (accessToken && refreshToken) {
        // Store tokens
        this.storage.setItem('accessToken', accessToken);
        this.storage.setItem('refreshToken', refreshToken);

        // Redirect to home
        // The auth guard and interceptor will handle user data fetching
        this.router.navigate(['/']);
      } else {
        this.error = 'Failed to receive authentication tokens. Please try again.';
      }
    });
  }
}
