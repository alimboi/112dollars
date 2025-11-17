import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { ReferencesService, Reference } from '../../../core/services/references.service';
import { SafeUrlPipe } from '../../../shared/pipes/safe-url.pipe';
import { ColorThemeUtil } from '../../../shared/utils/color-theme.util';

@Component({
  selector: 'app-reference-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, SafeUrlPipe],
  templateUrl: './reference-detail.component.html',
  styleUrls: ['./reference-detail.component.scss']
})
export class ReferenceDetailComponent implements OnInit, OnDestroy {
  reference: Reference | null = null;
  loading = true;
  error = '';
  currentTheme: 'light' | 'dark' = 'light';
  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private referencesService: ReferencesService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    // Detect initial theme
    this.detectTheme();

    // Listen for theme changes
    this.listenForThemeChanges();

    const sub = this.route.params.subscribe(params => {
      const id = +params['id'];
      this.loadReference(id);
    });
    this.subscriptions.add(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadReference(id: number): void {
    const sub = this.referencesService.getReference(id).subscribe({
      next: (reference) => {
        console.log('Reference loaded:', reference);
        console.log('Content blocks before sanitization:', reference.contentBlocks);
        this.reference = reference;
        this.sanitizeContentBlocks();
        console.log('Content blocks after sanitization:', this.reference.contentBlocks);
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load reference';
        this.loading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  private sanitizeContentBlocks(): void {
    if (this.reference?.contentBlocks) {
      this.reference.contentBlocks = this.reference.contentBlocks.map(block => {
        // For image blocks, ensure blockData has default values
        if (block.blockType === 'image') {
          console.log('Processing image block:', block);
          console.log('Block content:', block.content);
          return {
            ...block,
            content: block.content || '', // Explicitly preserve content
            blockData: {
              url: block.blockData?.url || '',
              alt: block.blockData?.alt || 'Content image',
              width: block.blockData?.width || '100%',
              height: block.blockData?.height || 'auto',
              alignment: block.blockData?.alignment || 'center',
              borderRadius: block.blockData?.borderRadius || 0,
              boxShadow: block.blockData?.boxShadow || 'none',
              ...block.blockData
            }
          };
        }

        // For text blocks, sanitize content
        if (block.blockType === 'text') {
          return {
            ...block,
            content: this.sanitizer.sanitize(1, block.content) || ''
          };
        }

        // For other blocks, return as-is
        return block;
      });
    }
  }

  getSafeContent(content: string): SafeHtml {
    return this.sanitizer.sanitize(1, content) || '';
  }

  // ===== THEME AWARENESS =====

  /**
   * Detect current theme from document root attribute
   */
  private detectTheme(): void {
    // Check data-theme attribute on document root (set by navbar)
    const dataTheme = document.documentElement.getAttribute('data-theme');
    if (dataTheme === 'dark') {
      this.currentTheme = 'dark';
      return;
    }

    // Check if user has a saved theme preference in localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.currentTheme = 'dark';
      return;
    }

    // Default to light theme
    this.currentTheme = 'light';
  }

  /**
   * Listen for theme changes in real-time
   */
  private listenForThemeChanges(): void {
    // Use MutationObserver to watch for data-theme attribute changes on document root
    const observer = new MutationObserver(() => {
      this.detectTheme();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    // Also listen for storage changes (in case theme changes in different tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        this.detectTheme();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Cleanup
    this.subscriptions.add(() => {
      observer.disconnect();
      window.removeEventListener('storage', handleStorageChange);
    });
  }

  /**
   * Get theme-aware style for a content block
   * Automatically adjusts colors based on current theme
   */
  getThemeAwareStyle(styling: any): any {
    if (!styling) return {};

    const themeAwareStyle = { ...styling };

    // Adjust color based on current theme
    if (styling.color) {
      themeAwareStyle.color = ColorThemeUtil.getThemeAwareColor(styling.color, this.currentTheme);
    }

    // Adjust background color based on current theme
    if (styling.backgroundColor) {
      themeAwareStyle.backgroundColor = ColorThemeUtil.getThemeAwareColor(
        styling.backgroundColor,
        this.currentTheme
      );
    }

    return themeAwareStyle;
  }
}
