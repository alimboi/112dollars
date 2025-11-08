import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-password-reset',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule],
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.scss']
})
export class PasswordResetComponent {
  step: 'request' | 'verify' = 'request';
  requestForm: FormGroup;
  resetForm: FormGroup;
  loading = false;
  error = '';
  success = '';
  email = '';

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router
  ) {
    this.requestForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.resetForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : {'mismatch': true};
  }

  requestReset(): void {
    if (this.requestForm.valid) {
      this.loading = true;
      this.error = '';
      this.success = '';

      const { email } = this.requestForm.value;
      this.email = email;

      this.api.post('auth/password-reset/request', { email }).subscribe({
        next: () => {
          this.success = 'A verification code has been sent to your email!';
          this.loading = false;
          this.step = 'verify';
        },
        error: (error) => {
          this.error = error.error?.message || 'Failed to send reset code. Please try again.';
          this.loading = false;
        }
      });
    }
  }

  resetPassword(): void {
    if (this.resetForm.valid) {
      this.loading = true;
      this.error = '';
      this.success = '';

      const { code, newPassword } = this.resetForm.value;

      this.api.post('auth/password-reset/verify', {
        email: this.email,
        code,
        newPassword
      }).subscribe({
        next: () => {
          this.success = 'Password reset successfully! You can now login with your new password.';
          this.loading = false;
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 2000);
        },
        error: (error) => {
          this.error = error.error?.message || 'Failed to reset password. Please check the code and try again.';
          this.loading = false;
        }
      });
    }
  }

  backToRequest(): void {
    this.step = 'request';
    this.resetForm.reset();
    this.error = '';
    this.success = '';
  }
}
