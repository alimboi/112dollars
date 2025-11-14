import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-email-verification-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './email-verification-modal.component.html',
  styleUrls: ['./email-verification-modal.component.scss']
})
export class EmailVerificationModalComponent implements OnInit, OnDestroy {
  @Input() email: string = '';
  @Output() verified = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();

  verificationForm: FormGroup;
  loading = false;
  error = '';
  success = '';
  timeRemaining = 300; // 5 minutes in seconds
  canResend = false;
  resendCooldown = 60; // 60 seconds cooldown
  private timerSubscription?: Subscription;
  private resendTimerSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private api: ApiService
  ) {
    this.verificationForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern(/^\d{6}$/)]]
    });
  }

  ngOnInit(): void {
    this.startTimer();
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
    if (this.resendTimerSubscription) {
      this.resendTimerSubscription.unsubscribe();
    }
  }

  startTimer(): void {
    this.timeRemaining = 300;
    this.timerSubscription = interval(1000).subscribe(() => {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        this.canResend = true;
        this.timerSubscription?.unsubscribe();
      }
    });
  }

  startResendCooldown(): void {
    this.canResend = false;
    this.resendCooldown = 60;
    this.resendTimerSubscription = interval(1000).subscribe(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        this.canResend = true;
        this.resendTimerSubscription?.unsubscribe();
      }
    });
  }

  getFormattedTime(): string {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  getResendCountdown(): string {
    return `${this.resendCooldown}s`;
  }

  verifyCode(): void {
    if (this.verificationForm.valid) {
      this.loading = true;
      this.error = '';
      this.success = '';

      const { code } = this.verificationForm.value;

      this.api.post('auth/verify-email', { email: this.email, code }).subscribe({
        next: (response) => {
          this.success = 'Email verified successfully!';
          this.loading = false;
          setTimeout(() => {
            this.verified.emit(response);
          }, 1000);
        },
        error: (error) => {
          this.error = error.error?.message || 'Verification failed. Please check your code and try again.';
          this.loading = false;
        }
      });
    }
  }

  resendCode(): void {
    if (!this.canResend) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    this.api.post('auth/resend-verification', { email: this.email }).subscribe({
      next: () => {
        this.success = 'Verification code sent! Please check your email.';
        this.loading = false;
        this.startTimer();
        this.startResendCooldown();
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to resend code. Please try again later.';
        this.loading = false;
      }
    });
  }

  closeModal(): void {
    this.close.emit();
  }
}
