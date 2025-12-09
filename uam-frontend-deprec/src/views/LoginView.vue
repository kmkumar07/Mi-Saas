<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-10">
    <div class="grid w-full max-w-5xl gap-12 lg:grid-cols-[1.15fr,0.85fr] items-center">
      <!-- Brand / Marketing panel -->
      <section class="space-y-8 text-slate-100">
        <div class="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium tracking-wide backdrop-blur">
          <span class="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/80 text-slate-900 text-[10px] font-bold">
            U
          </span>
          Unified Access Management Console
        </div>

        <div class="space-y-4">
          <h1 class="text-3xl sm:text-4xl font-semibold tracking-tight">
            Secure access for every
            <span class="text-gradient">user</span>
            and
            <span class="text-gradient-accent">workspace</span>.
          </h1>
          <p class="max-w-xl text-sm sm:text-base text-slate-300/80">
            Manage identities, roles, and permissions across your tenants with a clean, focused console.
            Built for SaaS teams that care about security and clarity.
          </p>
        </div>

        <dl class="grid gap-4 sm:grid-cols-3 text-xs sm:text-sm text-slate-200/90">
          <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
            <dt class="text-slate-400">Tenants</dt>
            <dd class="mt-1 text-lg font-semibold">Multi-org</dd>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
            <dt class="text-slate-400">Audit ready</dt>
            <dd class="mt-1 text-lg font-semibold">Full trail</dd>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
            <dt class="text-slate-400">Control</dt>
            <dd class="mt-1 text-lg font-semibold">Fine‑grained</dd>
          </div>
        </dl>
      </section>

      <!-- Auth card -->
      <section class="animate-slide-up">
        <div
          class="relative rounded-2xl border border-white/10 bg-slate-950/75 px-6 py-7 shadow-2xl backdrop-blur-xl sm:px-8 sm:py-9"
        >
          <header class="mb-6">
            <p class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              UAM Console
            </p>
            <h2 class="mt-2 text-xl font-semibold text-white">
              Sign in to your workspace
            </h2>
            <p class="mt-1 text-xs text-slate-400">
              Use your admin credentials to continue.
            </p>
          </header>

          <form class="space-y-5" @submit.prevent="handleLogin">
            <div
              v-if="error"
              class="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-100"
            >
              <svg class="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{{ error }}</span>
            </div>

            <div class="space-y-1.5">
              <label for="email" class="block text-xs font-medium text-slate-200">
                Email
              </label>
              <input
                id="email"
                v-model="credentials.email"
                name="email"
                type="email"
                required
                autocomplete="email"
                class="block w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-50 placeholder-slate-500 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
                placeholder="you@company.com"
              />
            </div>

            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label for="password" class="block text-xs font-medium text-slate-200">
                  Password
                </label>
                <button
                  type="button"
                  class="text-[11px] font-medium text-indigo-400 hover:text-indigo-300"
                >
                  Forgot?
                </button>
              </div>
              <input
                id="password"
                v-model="credentials.password"
                name="password"
                type="password"
                required
                autocomplete="current-password"
                class="block w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-50 placeholder-slate-500 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
                placeholder="Enter your password"
              />
            </div>

            <div class="flex items-center justify-between pt-1">
              <label class="inline-flex cursor-pointer items-center gap-2 text-[11px] text-slate-400">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  class="h-3.5 w-3.5 rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500/60"
                />
                <span>Remember this device</span>
              </label>
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="btn btn-primary relative mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
            >
              <svg
                v-if="loading"
                class="h-4 w-4 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>{{ loading ? 'Signing you in...' : 'Sign in' }}</span>
            </button>
          </form>

          <p class="mt-6 text-center text-[11px] text-slate-400">
            Need a workspace?
            <router-link
              to="/register"
              class="font-medium text-indigo-400 hover:text-indigo-300"
            >
              Register your tenant
            </router-link>
          </p>
        </div>

        <p class="mt-4 text-center text-[11px] text-slate-500">
          &copy; {{ new Date().getFullYear() }} UAM System. All rights reserved.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const credentials = ref({
  email: '',
  password: '',
});

const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  try {
    loading.value = true;
    error.value = '';
    
    await authStore.login(credentials.value.email, credentials.value.password);
    router.push({ name: 'dashboard' });
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Login failed. Please try again.';
  } finally {
    loading.value = false;
  }
};
</script>
