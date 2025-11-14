import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { EmailVerificationModalComponent } from '../../../shared/components/email-verification-modal/email-verification-modal.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule, EmailVerificationModalComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage = '';
  loading = false;
  showVerificationModal = false;
  unverifiedEmail = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private api: ApiService
  ) {
    this.loginForm = this.fb.group({
      identifier: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      const { identifier, password } = this.loginForm.value;

      this.authService.login(identifier, password).subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (error) => {
          const errorMsg = error.error?.message || 'Login failed. Please try again.';
          this.errorMessage = errorMsg;
          this.loading = false;

          // Check if it's an email verification error
          if (errorMsg.toLowerCase().includes('verify') || errorMsg.toLowerCase().includes('verification')) {
            // Get the user's email to show verification modal
            this.getUserEmail(identifier);
          }
        }
      });
    }
  }

  getUserEmail(identifier: string): void {
    // If identifier is an email, use it directly
    if (identifier.includes('@')) {
      this.unverifiedEmail = identifier;
      this.showResendOption();
    } else {
      // If it's a username, we need to get the email from backend
      // For now, just show a message to use email for verification
      this.errorMessage = 'Please verify your email. Use your email address to resend the verification code.';
    }
  }

  showResendOption(): void {
    this.errorMessage = 'Your email is not verified yet. Click below to resend the verification code.';
  }

  resendVerificationCode(): void {
    if (!this.unverifiedEmail) {
      this.errorMessage = 'Please enter your email address in the login form first.';
      return;
    }

    this.loading = true;
    this.api.post('auth/resend-verification', { email: this.unverifiedEmail }).subscribe({
      next: () => {
        this.loading = false;
        this.showVerificationModal = true;
        this.errorMessage = '';
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to resend code. Please try again.';
        this.loading = false;
      }
    });
  }

  onVerified(response: any): void {
    // User verified their email, save tokens and redirect
    if (response.accessToken) {
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      this.authService.currentUserSubject.next(response.user);
    }
    this.showVerificationModal = false;
    this.router.navigate(['/']);
  }

  closeVerificationModal(): void {
    this.showVerificationModal = false;
  }

  loginWithGoogle(): void {
    // Redirect to backend Google OAuth endpoint
    const backendUrl = 'http://localhost:3000';
    window.location.href = `${backendUrl}/auth/google`;
  }
}
