import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { ReferencesService, Reference, Topic, Major } from '../../../core/services/references.service';
import { SafeUrlPipe } from '../../../shared/pipes/safe-url.pipe';
import { ColorThemeUtil } from '../../../shared/utils/color-theme.util';

type NavigationLevel = 'topics' | 'contents';

@Component({
  selector: 'app-references-by-topic',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, SafeUrlPipe],
  templateUrl: './references-by-topic.component.html',
  styleUrls: ['./references-by-topic.component.scss']
})
export class ReferencesByTopicComponent implements OnInit, OnDestroy {
  // Navigation state
  navigationLevel: NavigationLevel = 'topics';

  // Data
  topic: Topic | null = null;
  contents: Reference[] = [];
  selectedContent: Reference | null = null;

  // UI state
  loading = true;
  error = '';
  sidebarOpen = false;
  currentTheme: 'light' | 'dark' = 'light';

  // Utilities
  readonly ColorThemeUtil = ColorThemeUtil;

  private subscriptions = new Subscription();
  private topicId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private referencesService: ReferencesService
  ) {}

  ngOnInit(): void {
    // Detect initial theme
    this.detectTheme();

    // Listen for theme changes
    this.listenForThemeChanges();

    const sub = this.route.params.subscribe(params => {
      this.topicId = +params['id'];
      this.loadTopic();
    });
    this.subscriptions.add(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Load topic details and its contents
  loadTopic(): void {
    this.loading = true;
    this.navigationLevel = 'contents';
    this.selectedContent = null;
    this.contents = [];
    this.error = '';

    // Note: We load contents directly since we already have the topic ID from the URL
    const sub = this.referencesService.getReferencesByTopic(this.topicId).subscribe({
      next: (response: any) => {
        // Extract the references array from the paginated response
        this.contents = response.references || response || [];

        // Auto-select and fetch full details of first content
        if (this.contents.length > 0) {
          this.selectContent(this.contents[0]);
        } else {
          this.error = 'No contents available for this topic';
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = 'Failed to load contents';
        this.loading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  // Select content to view details
  selectContent(content: Reference): void {
    this.loading = true;
    this.sidebarOpen = false;

    // Fetch full content details including contentBlocks from the API
    const sub = this.referencesService.getReference(content.id).subscribe({
      next: (fullContent: Reference) => {
        this.selectedContent = fullContent;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load content details:', err);
        // Fallback to the list item if API call fails
        this.selectedContent = content;
        this.loading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  // NAVIGATION: Go back to topics
  goBackToTopics(): void {
    this.route.params.subscribe(params => {
      const majorId = params['majorId'];
      if (majorId) {
        // If majorId is available in the route, navigate back to topics list
        // This requires the route to be updated to include majorId
        window.history.back();
      } else {
        // Fallback to browser back
        window.history.back();
      }
    });
  }

  // SIDEBAR CONTROLS
  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  getEstimatedReadTime(reference: Reference): string {
    if (reference.readingTimeMinutes) {
      return `${reference.readingTimeMinutes} min read`;
    }
    return '';
  }

  // THEME AWARENESS
  private detectTheme(): void {
    // Check if user has a saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.currentTheme = savedTheme as 'light' | 'dark';
      return;
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.currentTheme = 'dark';
    } else {
      this.currentTheme = 'light';
    }
  }

  private listenForThemeChanges(): void {
    // Listen for local storage changes (when theme is switched in app)
    const handleStorageChange = () => {
      this.detectTheme();
    };

    // Listen for system theme changes
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      darkModeQuery.addEventListener('change', (e) => {
        this.currentTheme = e.matches ? 'dark' : 'light';
      });
    }

    window.addEventListener('storage', handleStorageChange);
    this.subscriptions.add(() => {
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
