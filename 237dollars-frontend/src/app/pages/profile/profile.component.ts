import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService, User } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  profileForm: FormGroup;
  preferencesForm: FormGroup;
  loading = false;
  success = '';
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private api: ApiService
  ) {
    this.profileForm = this.fb.group({
      email: [{ value: '', disabled: true }],
      newPassword: [''],
      confirmPassword: ['']
    });

    this.preferencesForm = this.fb.group({
      language: ['EN', Validators.required],
      darkMode: [true]
    });
  }

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    if (this.user) {
      this.profileForm.patchValue({
        email: this.user.email
      });
      this.loadPreferences();
    }
  }

  loadPreferences(): void {
    this.api.get('users/profile').subscribe({
      next: (data: any) => {
        this.preferencesForm.patchValue({
          language: data.language || 'EN',
          darkMode: data.darkMode !== undefined ? data.darkMode : true
        });
      },
      error: (err) => console.error('Failed to load preferences')
    });
  }

  updateProfile(): void {
    if (this.profileForm.valid) {
      this.loading = true;
      this.error = '';
      this.success = '';

      const { newPassword, confirmPassword } = this.profileForm.value;

      if (newPassword && newPassword !== confirmPassword) {
        this.error = 'Passwords do not match';
        this.loading = false;
        return;
      }

      const updateData = newPassword ? { password: newPassword } : {};

      this.api.put('users/profile', updateData).subscribe({
        next: () => {
          this.success = 'Profile updated successfully';
          this.loading = false;
          this.profileForm.patchValue({ newPassword: '', confirmPassword: '' });
        },
        error: (err) => {
          this.error = 'Failed to update profile';
          this.loading = false;
        }
      });
    }
  }

  updatePreferences(): void {
    if (this.preferencesForm.valid) {
      this.loading = true;
      this.error = '';
      this.success = '';

      this.api.put('users/preferences', this.preferencesForm.value).subscribe({
        next: () => {
          this.success = 'Preferences updated successfully';
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to update preferences';
          this.loading = false;
        }
      });
    }
  }
}
