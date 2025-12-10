import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { THIRDPARTY_API_BASE_URL } from './thirdparty-api.config';

export interface ApiCallState {
  loading: boolean;
  status: number | null;
  message: string | null;
}

@Injectable({ providedIn: 'root' })
export class ThirdPartyApiService {
  private readonly http = inject(HttpClient);

  readonly lastPublicCall = signal<ApiCallState>({
    loading: false,
    status: null,
    message: null,
  });

  readonly lastProtectedCall = signal<ApiCallState>({
    loading: false,
    status: null,
    message: null,
  });

  callPublicPing() {
    this.lastPublicCall.set({ loading: true, status: null, message: null });

    this.http.get(`${THIRDPARTY_API_BASE_URL}/public/ping`, { responseType: 'text' }).subscribe({
      next: (message) => {
        this.lastPublicCall.set({ loading: false, status: 200, message });
      },
      error: (err) => {
        this.lastPublicCall.set({
          loading: false,
          status: err.status ?? 0,
          message: err.error ?? String(err.message ?? 'Unknown error'),
        });
      },
    });
  }

  callFeatureX() {
    this.lastProtectedCall.set({ loading: true, status: null, message: null });

    this.http
      .get(`${THIRDPARTY_API_BASE_URL}/api/indoor_billing`, { responseType: 'text' })
      .subscribe({
        next: (message) => {
          this.lastProtectedCall.set({ loading: false, status: 200, message });
        },
        error: (err) => {
          this.lastProtectedCall.set({
            loading: false,
            status: err.status ?? 0,
            message: err.error ?? String(err.message ?? 'Unknown error'),
          });
        },
      });
  }

  callCreateShop() {
    this.lastProtectedCall.set({ loading: true, status: null, message: null });

    this.http
      .post(`${THIRDPARTY_API_BASE_URL}/api/shops`, {}, { responseType: 'text' })
      .subscribe({
        next: (message) => {
          this.lastProtectedCall.set({ loading: false, status: 200, message });
        },
        error: (err) => {
          this.lastProtectedCall.set({
            loading: false,
            status: err.status ?? 0,
            message: err.error ?? String(err.message ?? 'Unknown error'),
          });
        },
      });
  }
}


