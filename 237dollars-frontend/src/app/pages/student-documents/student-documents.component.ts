import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';

interface StudentDocument {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
}

@Component({
  selector: 'app-student-documents',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './student-documents.component.html',
  styleUrls: ['./student-documents.component.scss']
})
export class StudentDocumentsComponent implements OnInit {
  documents: StudentDocument[] = [];
  loading = false;
  uploading = false;
  error = '';
  success = '';
  selectedFile: File | null = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.loading = true;
    // This would call a backend endpoint to get user's uploaded documents
    // For now, just simulating the structure
    this.loading = false;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.error = 'File size must not exceed 10MB';
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        this.error = 'Only PDF, JPG, and PNG files are allowed';
        return;
      }

      this.selectedFile = file;
      this.error = '';
    }
  }

  uploadDocument(): void {
    if (!this.selectedFile) {
      this.error = 'Please select a file first';
      return;
    }

    this.uploading = true;
    this.error = '';
    this.success = '';

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.api.post('students/upload', formData).subscribe({
      next: (response: any) => {
        this.success = 'Document uploaded successfully';
        this.uploading = false;
        this.selectedFile = null;
        this.loadDocuments();

        // Reset file input
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to upload document';
        this.uploading = false;
      }
    });
  }

  deleteDocument(id: number): void {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    this.api.delete(`students/documents/${id}`).subscribe({
      next: () => {
        this.success = 'Document deleted successfully';
        this.loadDocuments();
      },
      error: (err) => {
        this.error = 'Failed to delete document';
      }
    });
  }

  downloadDocument(url: string, fileName: string): void {
    window.open(url, '_blank');
  }

  getFileIcon(fileType: string): string {
    if (fileType.includes('pdf')) return 'bi bi-file-pdf';
    if (fileType.includes('image')) return 'bi bi-file-image';
    return 'bi bi-file-earmark';
  }
}
