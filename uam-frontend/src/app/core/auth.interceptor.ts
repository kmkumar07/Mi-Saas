import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

const ACCESS_TOKEN_KEY = 'uam_access_token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const router = inject(Router);

  // Always send credentials so HttpOnly cookies are included
  let authReq = req.clone({
    withCredentials: true,
  });

  if (token) {
    authReq = authReq.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Clear any stored access token
        storeAccessToken(null);

        // Build redirect back to the current URL after successful login
        const redirectUrl = encodeURIComponent(window.location.href);

        // Avoid redirect loop if we're already on the login or register page
        const isAuthPath =
          router.url.startsWith('/auth/login') || router.url.startsWith('/auth/register');

        if (!isAuthPath) {
          router.navigate(['/auth/login'], {
            queryParams: { redirect: redirectUrl },
          });
        }
      }

      return throwError(() => error);
    }),
  );
};

export function storeAccessToken(token: string | null): void {
  if (!token) {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  } else {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }
}


