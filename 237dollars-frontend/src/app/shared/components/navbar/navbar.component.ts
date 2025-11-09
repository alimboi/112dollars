import { Component, OnInit, OnDestroy, HostListener, ElementRef, Renderer2 } from '@angular/core';
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
  isLangDropdownOpen = false;
  currentLang = 'en';
  isDarkMode = false;
  languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'uz', name: 'O\'zbekcha', flag: '🇺🇿' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' }
  ];

  private routerSubscription?: Subscription;
  private lastScrollTop = 0;
  private scrollThreshold = 100;
  private zoomLevel = 1;

  constructor(
    public authService: AuthService,
    private storage: StorageService,
    private api: ApiService,
    private router: Router,
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    // Load saved language preference or use default
    const savedLang = this.storage.getItem<string>('language') || 'en';
    this.currentLang = savedLang;
    this.storage.setItem('language', savedLang);

    // Load saved theme preference or use default
    const savedTheme = this.storage.getItem<string>('theme') || 'light';
    this.isDarkMode = savedTheme === 'dark';
    this.applyTheme(savedTheme);

    // Close mobile menu on route change
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.closeMenu();
      });

    // Check navbar fit on init and resize
    this.checkNavbarFit();
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
    if (this.isLangDropdownOpen) {
      this.isLangDropdownOpen = false;
    }
  }

  // Check navbar fit on resize and zoom
  @HostListener('window:resize')
  onWindowResize(): void {
    this.checkNavbarFit();
  }

  // Handle scroll for navbar hide/show animation
  @HostListener('window:scroll', ['$event'])
  onWindowScroll(): void {
    const navbar = this.el.nativeElement.querySelector('.navbar');
    if (!navbar) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Add scrolled class when scrolled down
    if (scrollTop > 50) {
      this.renderer.addClass(navbar, 'scrolled');
    } else {
      this.renderer.removeClass(navbar, 'scrolled');
    }

    // Hide/show navbar based on scroll direction
    if (scrollTop > this.scrollThreshold) {
      if (scrollTop > this.lastScrollTop && !this.isMenuOpen) {
        // Scrolling down - hide navbar
        this.renderer.addClass(navbar, 'navbar-hidden');
      } else {
        // Scrolling up - show navbar
        this.renderer.removeClass(navbar, 'navbar-hidden');
      }
    } else {
      // Always show navbar near top of page
      this.renderer.removeClass(navbar, 'navbar-hidden');
    }

    this.lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  }

  switchLanguage(lang: string): void {
    this.currentLang = lang;
    this.storage.setItem('language', lang);

    // Close language dropdown after selection
    this.isLangDropdownOpen = false;

    // Sync with backend if user is authenticated
    if (this.authService.isAuthenticated()) {
      this.api.put('users/preferences', { language: lang }).subscribe({
        next: () => console.log('Language preference synced with backend'),
        error: (err) => console.error('Failed to sync language preference', err)
      });
    }
  }

  toggleLangDropdown(): void {
    this.isLangDropdownOpen = !this.isLangDropdownOpen;
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
    this.isLangDropdownOpen = false;
    document.body.classList.remove('menu-open');
  }

  getCurrentLanguage() {
    return this.languages.find(l => l.code === this.currentLang);
  }

  logout(): void {
    this.authService.logout();
    this.closeMenu();
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    const theme = this.isDarkMode ? 'dark' : 'light';
    this.applyTheme(theme);
    this.storage.setItem('theme', theme);
  }

  private applyTheme(theme: string): void {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  private checkNavbarFit(): void {
    // Detect zoom level
    const devicePixelRatio = window.devicePixelRatio || 1;
    const visualViewport = (window as any).visualViewport;

    // Calculate effective viewport width accounting for zoom
    let effectiveWidth = window.innerWidth;

    if (visualViewport) {
      // More accurate zoom detection
      effectiveWidth = visualViewport.width;
      this.zoomLevel = window.innerWidth / visualViewport.width;
    } else {
      // Fallback zoom detection
      this.zoomLevel = devicePixelRatio;
    }

    // Get the navbar element
    const navbar = this.el.nativeElement.querySelector('.navbar-modern');
    if (!navbar) return;

    // Calculate if navbar items will fit
    // This checks actual available space vs needed space
    const containerWidth = effectiveWidth;
    const shouldShowMobileMenu = containerWidth < 1400 || this.zoomLevel > 1.1;

    // Add/remove mobile class dynamically
    if (shouldShowMobileMenu) {
      this.renderer.addClass(navbar, 'force-mobile');
    } else {
      this.renderer.removeClass(navbar, 'force-mobile');
    }

    console.log('Navbar check:', {
      windowWidth: window.innerWidth,
      effectiveWidth,
      zoomLevel: this.zoomLevel.toFixed(2),
      shouldShowMobile: shouldShowMobileMenu
    });
  }
}
