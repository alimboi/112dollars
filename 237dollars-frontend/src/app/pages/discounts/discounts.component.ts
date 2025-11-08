import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';

interface DiscountCode {
  id: number;
  code: string;
  discountPercentage: number;
  status: string;
  generatedAt: string;
  expiresAt?: string;
  usedAt?: string;
}

@Component({
  selector: 'app-discounts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './discounts.component.html',
  styleUrls: ['./discounts.component.scss']
})
export class DiscountsComponent implements OnInit {
  discountCodes: DiscountCode[] = [];
  applyForm: FormGroup;
  loading = false;
  submitting = false;
  error = '';
  success = '';
  showApplyForm = false;
  eligibleForDiscount = false;
  requiredPoints = 100;
  currentPoints = 0;

  constructor(
    private fb: FormBuilder,
    private api: ApiService
  ) {
    this.applyForm = this.fb.group({
      reason: ['', [Validators.required, Validators.minLength(50)]]
    });
  }

  ngOnInit(): void {
    this.loadDiscountCodes();
    this.checkEligibility();
  }

  loadDiscountCodes(): void {
    this.loading = true;
    this.api.get<DiscountCode[]>('discounts/my-codes').subscribe({
      next: (codes) => {
        this.discountCodes = codes;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load discount codes';
        this.loading = false;
      }
    });
  }

  checkEligibility(): void {
    this.api.get<any>('points/my-total').subscribe({
      next: (data) => {
        this.currentPoints = data.totalPoints || 0;
        this.eligibleForDiscount = this.currentPoints >= this.requiredPoints;
      },
      error: (err) => {
        console.error('Failed to check eligibility');
      }
    });
  }

  toggleApplyForm(): void {
    this.showApplyForm = !this.showApplyForm;
    if (!this.showApplyForm) {
      this.applyForm.reset();
      this.error = '';
      this.success = '';
    }
  }

  applyForDiscount(): void {
    if (this.applyForm.valid) {
      this.submitting = true;
      this.error = '';
      this.success = '';

      this.api.post('discounts/apply', this.applyForm.value).subscribe({
        next: (response: any) => {
          this.success = 'Discount application submitted successfully!';
          this.submitting = false;
          this.applyForm.reset();
          this.showApplyForm = false;
          this.loadDiscountCodes();
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to apply for discount';
          this.submitting = false;
        }
      });
    }
  }

  copyCode(code: string): void {
    navigator.clipboard.writeText(code).then(() => {
      this.success = `Code "${code}" copied to clipboard!`;
      setTimeout(() => this.success = '', 3000);
    }).catch(() => {
      this.error = 'Failed to copy code';
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
        return 'badge bg-success';
      case 'used':
        return 'badge bg-secondary';
      case 'expired':
        return 'badge bg-danger';
      default:
        return 'badge bg-warning';
    }
  }

  getStatusIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bi bi-check-circle';
      case 'used':
        return 'bi bi-check2-all';
      case 'expired':
        return 'bi bi-x-circle';
      default:
        return 'bi bi-clock';
    }
  }

  getDiscountBadgeClass(percentage: number): string {
    if (percentage >= 50) return 'discount-badge high';
    if (percentage >= 25) return 'discount-badge medium';
    return 'discount-badge low';
  }
}
