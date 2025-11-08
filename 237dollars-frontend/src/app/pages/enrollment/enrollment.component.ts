import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';

interface Enrollment {
  id: number;
  studentId: number;
  majorId: number;
  majorName: string;
  status: string;
  reason: string;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  adminNotes?: string;
}

interface Major {
  id: number;
  name: string;
  description: string;
}

@Component({
  selector: 'app-enrollment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './enrollment.component.html',
  styleUrls: ['./enrollment.component.scss']
})
export class EnrollmentComponent implements OnInit {
  enrollmentForm: FormGroup;
  enrollments: Enrollment[] = [];
  majors: Major[] = [];
  loading = false;
  submitting = false;
  error = '';
  success = '';
  showForm = false;

  constructor(
    private fb: FormBuilder,
    private api: ApiService
  ) {
    this.enrollmentForm = this.fb.group({
      majorId: ['', Validators.required],
      reason: ['', [Validators.required, Validators.minLength(20)]]
    });
  }

  ngOnInit(): void {
    this.loadMajors();
    this.loadEnrollments();
  }

  loadMajors(): void {
    this.api.get<Major[]>('references/majors').subscribe({
      next: (majors) => {
        this.majors = majors;
      },
      error: (err) => {
        this.error = 'Failed to load majors';
      }
    });
  }

  loadEnrollments(): void {
    this.loading = true;
    this.api.get<Enrollment[]>('enrollments/my-applications').subscribe({
      next: (enrollments) => {
        this.enrollments = enrollments;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load enrollments';
        this.loading = false;
      }
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.enrollmentForm.reset();
      this.error = '';
      this.success = '';
    }
  }

  submitApplication(): void {
    if (this.enrollmentForm.valid) {
      this.submitting = true;
      this.error = '';
      this.success = '';

      this.api.post('enrollments/apply', this.enrollmentForm.value).subscribe({
        next: (response) => {
          this.success = 'Application submitted successfully!';
          this.submitting = false;
          this.enrollmentForm.reset();
          this.showForm = false;
          this.loadEnrollments();
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to submit application';
          this.submitting = false;
        }
      });
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'badge bg-success';
      case 'rejected':
        return 'badge bg-danger';
      case 'pending':
      default:
        return 'badge bg-warning';
    }
  }

  getStatusIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bi bi-check-circle';
      case 'rejected':
        return 'bi bi-x-circle';
      case 'pending':
      default:
        return 'bi bi-clock';
    }
  }
}
