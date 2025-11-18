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
        isRefreshing = true;
        const refreshToken = storage.getItem<string>('refreshToken');

        if (!refreshToken) {
          // No refresh token, logout
          storage.clear();
          router.navigate(['/auth/login']);
          isRefreshing = false;
          return throwError(() => error);
        }

        // Try to refresh token using fetch API (avoids circular dependency with HttpClient)
        const apiUrl = environment.apiUrl || 'http://localhost:3000/api';
        const refreshPromise = fetch(`${apiUrl}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refreshToken })
        }).then(async (response) => {
          if (!response.ok) {
            throw new Error('Refresh failed');
          }
          return response.json();
        });

        return from(refreshPromise).pipe(
          switchMap((response: { accessToken: string }) => {
            // Save new access token
            storage.setItem('accessToken', response.accessToken);
            isRefreshing = false;

            // Retry the original request with new token
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${response.accessToken}`
              }
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            // Refresh failed, logout
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
