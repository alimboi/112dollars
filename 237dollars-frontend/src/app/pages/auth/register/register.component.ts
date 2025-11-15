import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { EmailVerificationModalComponent } from '../../../shared/components/email-verification-modal/email-verification-modal.component';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule, EmailVerificationModalComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnDestroy {
  registerForm: FormGroup;
  errorMessage = '';
  loading = false;
  showVerificationModal = false;
  registeredEmail = '';

  usernameAvailability: { checking: boolean; available: boolean | null; message: string } = {
    checking: false,
    available: null,
    message: ''
  };

  emailAvailability: { checking: boolean; available: boolean | null; message: string } = {
    checking: false,
    available: null,
    message: ''
  };

  private destroy$ = new Subject<void>();
  private usernameCheck$ = new Subject<string>();
  private emailCheck$ = new Subject<string>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private api: ApiService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z0-9_]+$/)
      ]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      ]],
      confirmPassword: ['', [Validators.required]],
      telegramUsername: ['', [Validators.pattern(/^@?[a-zA-Z0-9_]+$/)]],
      telegramPhone: ['', [Validators.pattern(/^\+?[1-9]\d{1,14}$/)]]
    }, { validators: this.passwordMatchValidator });

    // Setup real-time username availability check
    this.usernameCheck$.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(username => {
        if (!username || username.length < 3) {
          return of({ available: false, message: 'Username must be at least 3 characters' });
        }
        this.usernameAvailability.checking = true;
        return this.api.get(`auth/check-username?username=${encodeURIComponent(username)}`);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        this.usernameAvailability.checking = false;
        this.usernameAvailability.available = response.available;
        this.usernameAvailability.message = response.message;
      },
      error: () => {
        this.usernameAvailability.checking = false;
        this.usernameAvailability.available = null;
        this.usernameAvailability.message = 'Error checking username';
      }
    });

    // Setup real-time email availability check
    this.emailCheck$.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(email => {
        if (!email || !email.includes('@')) {
          return of({ available: false, message: 'Invalid email format' });
        }
        this.emailAvailability.checking = true;
        return this.api.get(`auth/check-email?email=${encodeURIComponent(email)}`);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        this.emailAvailability.checking = false;
        this.emailAvailability.available = response.available;
        this.emailAvailability.message = response.message;
      },
      error: () => {
        this.emailAvailability.checking = false;
        this.emailAvailability.available = null;
        this.emailAvailability.message = 'Error checking email';
      }
    });

    // Listen to username changes
    this.registerForm.get('username')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.usernameCheck$.next(value);
      });

    // Listen to email changes
    this.registerForm.get('email')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.emailCheck$.next(value);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Check if username and email are available
    if (this.usernameAvailability.available === false) {
      this.errorMessage = 'Username is already taken';
      return;
    }

    if (this.emailAvailability.available === false) {
      this.errorMessage = 'Email is already registered';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const formValue = this.registerForm.value;
    const registerData = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      username: formValue.username,
      email: formValue.email,
      password: formValue.password,
      telegramUsername: formValue.telegramUsername || undefined,
      telegramPhone: formValue.telegramPhone || undefined
    };

    this.api.post('auth/register', registerData).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.registeredEmail = formValue.email;
        this.showVerificationModal = true;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
        this.loading = false;
      }
    });
  }

  onVerified(response: any): void {
    // User verified their email, save tokens and redirect
    if (response.accessToken) {
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
    }
    this.showVerificationModal = false;
    this.router.navigate(['/']);
  }

  onCloseModal(): void {
    this.showVerificationModal = false;
    // User can close modal and verify later via email link
    this.router.navigate(['/auth/login']);
  }
}
