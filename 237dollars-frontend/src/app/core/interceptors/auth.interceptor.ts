import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageService } from '../services/storage.service';
import { catchError, switchMap, throwError, from } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(StorageService);
  const router = inject(Router);
  const token = storage.getItem<string>('accessToken');

  // Add token to request if available
  const authReq = token ? req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  }) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // If 401 Unauthorized and not already refreshing
      if (error.status === 401 && !isRefreshing && !req.url.includes('/auth/refresh')) {
        console.log('[Auth Interceptor] 401 detected, attempting token refresh...');
        isRefreshing = true;
        const refreshToken = storage.getItem<string>('refreshToken');

        if (!refreshToken) {
          console.log('[Auth Interceptor] No refresh token found, logging out');
          // No refresh token, logout
          storage.clear();
          router.navigate(['/auth/login']);
          isRefreshing = false;
          return throwError(() => error);
        }

        // Try to refresh token using fetch API (avoids circular dependency with HttpClient)
        const apiUrl = environment.apiUrl || 'http://localhost:3000/api';
        console.log('[Auth Interceptor] Refreshing token via:', `${apiUrl}/auth/refresh`);

        const refreshPromise = fetch(`${apiUrl}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refreshToken })
        }).then(async (response) => {
          console.log('[Auth Interceptor] Refresh response status:', response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('[Auth Interceptor] Refresh failed:', errorText);
            throw new Error('Refresh failed: ' + errorText);
          }

          const data = await response.json();
          console.log('[Auth Interceptor] Refresh successful, got new tokens');
          return data;
        }).catch((err) => {
          console.error('[Auth Interceptor] Refresh error:', err);
          throw err;
        });

        return from(refreshPromise).pipe(
          switchMap((response: { accessToken: string; refreshToken?: string }) => {
            // Save new access token
            storage.setItem('accessToken', response.accessToken);

            // If new refresh token provided, update it too
            if (response.refreshToken) {
              storage.setItem('refreshToken', response.refreshToken);
              console.log('[Auth Interceptor] Updated both access and refresh tokens');
            } else {
              console.log('[Auth Interceptor] Updated access token only');
            }

            isRefreshing = false;

            // Retry the original request with new token
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${response.accessToken}`
              }
            });

            console.log('[Auth Interceptor] Retrying original request with new token');
            return next(retryReq);
          }),
          catchError((refreshError) => {
            // Refresh failed, logout
            console.error('[Auth Interceptor] Token refresh failed completely, logging out');
            isRefreshing = false;
            storage.clear();
            router.navigate(['/auth/login']);
            return throwError(() => refreshError);
          })
        );
      }

      return throwError(() => error);
    })
  );
};
