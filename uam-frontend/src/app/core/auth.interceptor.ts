import { HttpInterceptorFn } from '@angular/common/http';

const ACCESS_TOKEN_KEY = 'uam_access_token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);

  if (!token) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(authReq);
};

export function storeAccessToken(token: string | null): void {
  if (!token) {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  } else {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }
}


