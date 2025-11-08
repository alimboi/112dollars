import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { StorageService } from '../../../core/services/storage.service';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  isMenuOpen = false;
  currentLang = 'en';
  languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'uz', name: 'O\'zbekcha', flag: '🇺🇿' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' }
  ];

  constructor(
    public authService: AuthService,
    private translate: TranslateService,
    private storage: StorageService,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    // Load saved language preference or use default
    const savedLang = this.storage.getItem<string>('language') || 'en';
    this.switchLanguage(savedLang);
  }

  switchLanguage(lang: string): void {
    this.currentLang = lang;
    this.translate.use(lang);
    this.storage.setItem('language', lang);

    // Sync with backend if user is authenticated
    if (this.authService.isAuthenticated()) {
      this.api.put('users/preferences', { language: lang }).subscribe({
        next: () => console.log('Language preference synced with backend'),
        error: (err) => console.error('Failed to sync language preference', err)
      });
    }
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout(): void {
    this.authService.logout();
  }
}
