import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService, User } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

interface UserStats {
  referencesRead: number;
  totalReadingTime: {
    hours: number;
    minutes: number;
    seconds: number;
    formatted: string;
  };
  totalPoints: number;
  totalReadingPoints: number;
  currentStreak: number;
  accountAge: number;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  preferencesForm: FormGroup;
  loading = false;
  passwordLoading = false;
  success = '';
  error = '';
  passwordSuccess = '';
  passwordError = '';

  // User stats
  stats: UserStats = {
    referencesRead: 0,
    totalReadingTime: {
      hours: 0,
      minutes: 0,
      seconds: 0,
      formatted: '0h 0m'
    },
    currentStreak: 0,
    totalPoints: 0,
    totalReadingPoints: 0,
    accountAge: 0
  };
  statsLoading = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private api: ApiService,
    private translate: TranslateService
  ) {
    this.profileForm = this.fb.group({
      email: [{ value: '', disabled: true }],
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
      firstName: ['', [Validators.minLength(1), Validators.maxLength(50)]],
      lastName: ['', [Validators.minLength(1), Validators.maxLength(50)]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)]],
      confirmNewPassword: ['', Validators.required]
    });

    this.preferencesForm = this.fb.group({
      language: ['EN', Validators.required],
      darkMode: [true]
    });
  }

  ngOnInit(): void {
    this.loadProfile();
    this.loadStats();
  }

  loadProfile(): void {
    this.api.get<User>('users/profile').subscribe({
      next: (data) => {
        this.user = data;
        this.profileForm.patchValue({
          email: data.email,
          username: data.username || '',
          firstName: data.firstName || '',
          lastName: data.lastName || ''
        });
        this.preferencesForm.patchValue({
          language: data.language || 'EN',
          darkMode: data.darkMode !== undefined ? data.darkMode : true
        });
      },
      error: (err) => {
        this.error = 'Failed to load profile';
        console.error('Failed to load profile', err);
      }
    });
  }

  loadStats(): void {
    this.statsLoading = true;
    this.api.get<UserStats>('users/stats').subscribe({
      next: (data) => {
        this.stats = data;
        this.statsLoading = false;
      },
      error: (err) => {
        console.error('Failed to load stats', err);
        this.statsLoading = false;
      }
    });
  }

  updateProfile(): void {
    if (this.profileForm.valid) {
      this.loading = true;
      this.error = '';
      this.success = '';

      const updateData: any = {};

      const username = this.profileForm.get('username')?.value;
      const firstName = this.profileForm.get('firstName')?.value;
      const lastName = this.profileForm.get('lastName')?.value;

      if (username) updateData.username = username;
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;

      this.api.put<User>('users/profile', updateData).subscribe({
        next: (response) => {
          this.success = 'Profile updated successfully';
          this.loading = false;
          // Update local user data
          this.authService.updateUserData(response);
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to update profile';
          this.loading = false;
        }
      });
    }
  }

  updatePassword(): void {
    if (this.passwordForm.valid) {
      this.passwordLoading = true;
      this.passwordError = '';
      this.passwordSuccess = '';

      const { newPassword, confirmNewPassword } = this.passwordForm.value;

      if (newPassword !== confirmNewPassword) {
        this.passwordError = 'New passwords do not match';
        this.passwordLoading = false;
        return;
      }

      this.api.put('users/change-password', this.passwordForm.value).subscribe({
        next: () => {
          this.passwordSuccess = 'Password changed successfully';
          this.passwordLoading = false;
          this.passwordForm.reset();
        },
        error: (err) => {
          this.passwordError = err.error?.message || 'Failed to change password';
          this.passwordLoading = false;
        }
      });
    }
  }

  updatePreferences(): void {
    if (this.preferencesForm.valid) {
      this.loading = true;
      this.error = '';
      this.success = '';

      this.api.put<User>('users/preferences', this.preferencesForm.value).subscribe({
        next: (response) => {
          this.success = 'Preferences updated successfully';
          this.loading = false;

          // Update language
          const language = this.preferencesForm.get('language')?.value;
          if (language) {
            this.translate.use(language);
          }

          // Update local user data
          this.authService.updateUserData(response);
        },
        error: (err) => {
          this.error = 'Failed to update preferences';
          this.loading = false;
        }
      });
    }
  }

  get usernameInvalid(): boolean {
    const control = this.profileForm.get('username');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  get newPasswordInvalid(): boolean {
    const control = this.passwordForm.get('newPassword');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
