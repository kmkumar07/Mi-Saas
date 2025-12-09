import { HttpInterceptorFn } from '@angular/common/http';
import { THIRDPARTY_API_BASE_URL } from './thirdparty-api.config';

const ACCESS_TOKEN_KEY = 'uam_access_token';

export const thirdPartyAuthInterceptor: HttpInterceptorFn = (req, next) => {
  let modifiedReq = req;

  // Only attach auth header when calling the third-party backend
  if (req.url.startsWith(THIRDPARTY_API_BASE_URL)) {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);

    modifiedReq = req.clone({
      withCredentials: true,
    });

    if (token) {
      modifiedReq = modifiedReq.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  }

  return next(modifiedReq);
};


