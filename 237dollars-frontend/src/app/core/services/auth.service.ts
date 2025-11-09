import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';

export interface User {
  id: number;
  email: string;
  role: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private api: ApiService,
    private storage: StorageService,
    private router: Router
  ) {
    this.loadUser();
  }

  private loadUser(): void {
    const user = this.storage.getItem<User>('user');
    if (user) {
      this.currentUserSubject.next(user);
    }
  }

  register(email: string, password: string): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('auth/register', { email, password })
      .pipe(
        tap(response => this.handleAuthResponse(response))
      );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('auth/login', { email, password })
      .pipe(
        tap(response => this.handleAuthResponse(response))
      );
  }

  logout(): void {
    this.storage.clear();
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<{ accessToken: string }> {
    const refreshToken = this.storage.getItem<string>('refreshToken');
    return this.api.post<{ accessToken: string }>('auth/refresh', { refreshToken })
      .pipe(
        tap(response => {
          this.storage.setItem('accessToken', response.accessToken);
        })
      );
  }

  requestPasswordReset(email: string): Observable<any> {
    return this.api.post('auth/password-reset/request', { email });
  }

  verifyPasswordReset(email: string, code: string, newPassword: string): Observable<any> {
    return this.api.post('auth/password-reset/verify', { email, code, newPassword });
  }

  isAuthenticated(): boolean {
    return !!this.storage.getItem('accessToken');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getAccessToken(): string | null {
    return this.storage.getItem<string>('accessToken');
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'content_manager';
  }

  private handleAuthResponse(response: AuthResponse): void {
    this.storage.setItem('user', response.user);
    this.storage.setItem('accessToken', response.accessToken);
    this.storage.setItem('refreshToken', response.refreshToken);
    this.currentUserSubject.next(response.user);
  }
}
