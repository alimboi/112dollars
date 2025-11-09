import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { StorageService } from '../../../core/services/storage.service';
import { ApiService } from '../../../core/services/api.service';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  currentLang = 'en';
  languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'uz', name: 'O\'zbekcha', flag: '🇺🇿' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' }
  ];

  private routerSubscription?: Subscription;

  constructor(
    public authService: AuthService,
    private storage: StorageService,
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load saved language preference or use default
    const savedLang = this.storage.getItem<string>('language') || 'en';
    this.switchLanguage(savedLang);

    // Close mobile menu on route change
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.closeMenu();
      });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    // Ensure body scroll is re-enabled when component is destroyed
    document.body.classList.remove('menu-open');
  }

  // Close menu on escape key press
  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.isMenuOpen) {
      this.closeMenu();
    }
  }

  switchLanguage(lang: string): void {
    this.currentLang = lang;
    // TODO: Re-enable translation when fixed
    // this.translate.use(lang);
    this.storage.setItem('language', lang);

    // Sync with backend if user is authenticated
    if (this.authService.isAuthenticated()) {
      this.api.put('users/preferences', { language: lang }).subscribe({
        next: () => console.log('Language preference synced with backend'),
        error: (err) => console.error('Failed to sync language preference', err)
      });
    }

    // Close menu after language selection on mobile
    if (window.innerWidth <= 991) {
      this.closeMenu();
    }
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;

    // Prevent body scroll when menu is open on mobile
    if (this.isMenuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
  }

  closeMenu(): void {
    this.isMenuOpen = false;
    document.body.classList.remove('menu-open');
  }

  getCurrentLanguage() {
    return this.languages.find(l => l.code === this.currentLang);
  }

  logout(): void {
    this.authService.logout();
    this.closeMenu();
  }
}
